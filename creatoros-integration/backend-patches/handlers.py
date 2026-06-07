"""Stage handlers(S1/S2/S2.5/S4 已全部实装)。

四个 handler 均产出真实 artifact + 参考01 §1/§2/§3 多维量化评分 + LLM 0.5/0.5 融合:
- S1 run_s1 → track_scorecard(§1 七维:供给密度/爆款率/新号占比/头部集中度/中位V·S/互动率/RPM)。
- S2 run_s2 → competitor_candidates(§2 六维 + explain_competitor 融合)。
- S2.5 run_s2_5 → viral_teardowns(§3 五维 video_score + teardown_video,无字幕降级 cap 0.6)。
- S4 run_s4 → hotspot_batch(velocity 时效分 + adapt_hotspot 融合)。
默认走 mock(MockCollector + MockModelGateway);真实 YouTube/LLM 配置即切,任何错误优雅降级到
mock-shape stub,handler 永不崩。详见 docs/54 §1、CLAUDE.md「当前实现状态」。
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from statistics import median

from app.collectors.registry import get_collector
from app.collectors.search_provider import get_search_provider
from app.collectors.youtube import CollectorError
from app.domain.types import WorkflowRun, gen_id, now_iso
from app.models_gateway.call_context import model_call_context
from app.models_gateway.registry import get_gateway as get_model_gateway
from app.services import context_assembler as ctx_asm

# 首跑砍维权重(growth 标灰,见 docs/41-s1-track-analysis.md)。
_W_SIZE, _W_DIFF, _W_BIZ = 0.4, 0.3, 0.3
_NEUTRAL_GROWTH = 5.0


def _clamp(x: float, lo: float = 0.0, hi: float = 10.0) -> float:
    return max(lo, min(hi, x))


def _verdict(score_total: float) -> str:
    # 已定稿阈值(docs/02-design-decisions §8)。
    if score_total >= 7.0:
        return "recommend_lock"
    if score_total >= 5.0:
        return "review"
    return "reject"


# ---- A1:参考01 §1「挑赛道」七维真实量化评分 ----
# 公式与阈值取自 docs/参考文档/01-requirements-extraction-report.md §1;按真实数据口径实现
# (mock fixture 数据量小,部分维度如供给密度无法跑出真实分布,以单测用合成输入验证阈值)。

# RPM 行业估值表(美元/千次播放),取自 docs/参考文档/rpm.md。变现真实收入不可得,仅作参考分。
_RPM_TABLE: list[tuple[tuple[str, ...], float]] = [
    (("理财", "投资", "金融", "finance", "invest", "trading", "crypto", "比特币", "股票"), 18.0),
    (("健身", "fitness", "workout", "增肌", "减脂"), 10.0),
    (("睡眠", "sleep", "助眠"), 10.0),
    (("宠物", "pet", "猫", "狗"), 8.5),
    (("心理", "psychology", "焦虑", "情绪", "自律", "专注", "亲子", "拖延"), 8.0),
    (("健康", "health", "养生", "饮食", "抗衰"), 8.0),
    (("冥想", "meditation", "放松"), 7.5),
    (("科技", "tech", "数码", "评测"), 7.5),
    # AI / AI 教程类:参考01/rpm.md 约 5-10,取中。
    (("ai", "人工智能", "agent", "教程", "tutorial", "工具", "工作流", "llm", "gpt", "自动化"), 7.5),
    (("商业", "纪录片", "business", "创业"), 5.0),
    (("故事", "story", "asmr", "diy", "手工"), 3.0),
]
_RPM_DEFAULT = 5.0  # 未命中赛道:中性参考分。


def _rpm_for_terms(terms: list[str]) -> float:
    blob = " ".join(t for t in terms if t).lower()
    for keywords, rpm in _RPM_TABLE:
        if any(k in blob for k in keywords):
            return rpm
    return _RPM_DEFAULT


def _lin_score(x: float, x_lo: float, x_hi: float, s_lo: float, s_hi: float) -> float:
    """把原始量 x 线性映射到分数区间并 clamp 到 [0,10]。x_lo→s_lo,x_hi→s_hi。

    反向维度(越小越好,如供给密度)传入 x_lo<x_hi 但 s_lo>s_hi 即可。
    """
    if x_hi == x_lo:
        return round(_clamp(s_lo), 1)
    t = (x - x_lo) / (x_hi - x_lo)
    t = max(0.0, min(1.0, t))
    return round(_clamp(s_lo + t * (s_hi - s_lo)), 1)


def _parse_dt(value) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _vs_ratio(video: dict, channels_by_id: dict) -> float | None:
    """单视频 V/S 比 = 播放量 ÷ 该频道粉丝数;粉丝数未知则 None(排除出该维度)。"""
    subs = (channels_by_id.get(video.get("channelId")) or {}).get("subs") or 0
    views = video.get("views") or 0
    if subs <= 0:
        return None
    return views / subs


def _track_metrics(
    videos: list[dict], channels_by_id: dict, track_terms: list[str], now: datetime
) -> dict:
    """参考01 §1 赛道七维:返回每维的原始量 + 0-10 分。"""
    # ① 供给密度:近 90 天发布数 ÷ 3 = 月供给。<300 蓝海(高分),>800 红海(低分)。
    recent = [v for v in videos if (_parse_dt(v.get("publishedAt")) or now) >= now - timedelta(days=90)]
    monthly_supply = round(len(recent) / 3.0, 1)
    supply_score = _lin_score(monthly_supply, 300.0, 800.0, 9.0, 3.0)

    # ② 爆款率:V/S ≥ 10 的视频占比。≥15% 好。
    ratios = [_vs_ratio(v, channels_by_id) for v in videos]
    rated = [r for r in ratios if r is not None]
    viral = [r for r in rated if r >= 10.0]
    viral_rate = (len(viral) / len(rated)) if rated else 0.0
    viral_rate_score = _lin_score(viral_rate, 0.0, 0.15, 4.0, 8.5)

    # ③ 新号占比:爆款视频所属频道中,首条视频在 6 个月内的占比。≥30% 好。
    viral_channels = {v.get("channelId") for v in videos if (_vs_ratio(v, channels_by_id) or 0.0) >= 10.0}
    if not viral_channels:  # 无爆款时退化为「样本中出现的所有频道」,使该维仍有意义。
        viral_channels = {v.get("channelId") for v in videos if v.get("channelId")}
    cutoff = now - timedelta(days=183)
    _epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    new_count = sum(
        1
        for cid in viral_channels
        if (_parse_dt((channels_by_id.get(cid) or {}).get("firstVideoAt")) or _epoch) >= cutoff
    )
    newcomer_ratio = (new_count / len(viral_channels)) if viral_channels else 0.0
    newcomer_score = _lin_score(newcomer_ratio, 0.0, 0.30, 4.0, 8.5)

    # ④ 头部集中度:Top20(按播放)来自多少不同频道。≥15 分散(高分),≤5 垄断(低分)。
    top = sorted(videos, key=lambda v: v.get("views") or 0, reverse=True)[:20]
    distinct_channels = len({v.get("channelId") for v in top if v.get("channelId")})
    concentration_score = _lin_score(distinct_channels, 5.0, 15.0, 3.0, 9.0)

    # ⑤ 中位 V·S 比:median(views/subs)。≥5 靠推荐(高分),<2(低分)。
    median_vs = median(rated) if rated else 0.0
    median_vs_score = _lin_score(median_vs, 2.0, 5.0, 3.0, 9.0)

    # ⑥ 互动率:median((赞+评)/播放)。≥4% 好。
    eng = [
        ((v.get("likes") or 0) + (v.get("comments") or 0)) / v["views"]
        for v in videos
        if v.get("views")
    ]
    median_eng = median(eng) if eng else 0.0
    engagement_score = _lin_score(median_eng, 0.0, 0.04, 3.0, 8.5)

    # ⑦ 变现 RPM:按赛道关键词查表(参考分)。
    rpm = _rpm_for_terms(track_terms)
    rpm_score = _lin_score(rpm, 3.0, 15.0, 4.0, 9.0)

    return {
        "supply_density": {"monthly_supply": monthly_supply, "score": supply_score},
        "viral_rate": {"ratio": round(viral_rate, 3), "score": viral_rate_score},
        "newcomer_ratio": {"ratio": round(newcomer_ratio, 3), "score": newcomer_score},
        "head_concentration": {"distinct_channels": distinct_channels, "score": concentration_score},
        "median_vs": {"ratio": round(median_vs, 2), "score": median_vs_score},
        "engagement": {"rate": round(median_eng, 4), "score": engagement_score},
        "rpm": {"usd_per_1k": rpm, "score": rpm_score},
        "_sample": {"videos": len(videos), "rated_videos": len(rated)},
    }


def _derive_track_scorecard(m: dict) -> dict:
    """七维 → 现有 4 维卡(size/growth/diff/biz),权重与 verdict 阈值不变(docs/41 §4)。"""
    score_size = round((m["supply_density"]["score"] + m["head_concentration"]["score"]) / 2, 1)
    score_diff = round(
        (
            m["newcomer_ratio"]["score"]
            + m["median_vs"]["score"]
            + m["viral_rate"]["score"]
            + m["engagement"]["score"]
        )
        / 4,
        1,
    )
    score_biz = m["rpm"]["score"]
    score_growth = _NEUTRAL_GROWTH  # 标灰:首跑无历史快照。
    score_total = round(score_size * _W_SIZE + score_diff * _W_DIFF + score_biz * _W_BIZ, 1)
    return {
        "score_size": score_size,
        "score_growth": score_growth,
        "score_diff": score_diff,
        "score_biz": score_biz,
        "score_total": score_total,
    }


def run_s1(workflow: WorkflowRun, mounted_context: dict) -> dict:
    """S1 赛道分析(mock)。经 mounted_context 注入已有 channel 级 track/preference/rule 先验。"""
    collector = get_collector()
    seed_keywords: list[str] = workflow.input.get("seed_keywords") or []
    # 已挂载的先验 track 关键词(若 channel 之前已沉淀)→ 参与扩词基底。
    prior_kw: list[str] = []
    for body in ctx_asm.bodies_of_kind(mounted_context, "track"):
        prior_kw.extend(body.get("expanded_keywords") or body.get("seed_keywords") or [])
    query = seed_keywords[0] if seed_keywords else (prior_kw[0] if prior_kw else "AI")
    channel_id = workflow.channel_id

    sample_videos = collector.search_videos(query)
    sample_channels = collector.search_channels(query)
    if channel_id:
        profile = collector.get_channel_profile(channel_id)
        channel_videos = collector.get_channel_videos(channel_id)
    else:
        profile = sample_channels[0] if sample_channels else {}
        channel_videos = []

    # 扩词:经 ModelGateway(本阶段 mock 确定性)+ 样本视频标签(去重)。
    gateway = get_model_gateway()
    with model_call_context(workflow_id=workflow.id, stage_code="S1"):
        llm_expansion = gateway.expand_keywords(seed_keywords or prior_kw, {"channel_id": channel_id})
    llm_words: list[str] = llm_expansion.get("flat", [])
    tag_pool: list[str] = []
    for v in sample_videos:
        tag_pool.extend(v.get("tags", []))
    expanded_keywords = list(dict.fromkeys([*seed_keywords, *prior_kw, *llm_words, *tag_pool]))

    now = datetime.now(timezone.utc)
    # 频道索引(subs / firstVideoAt 供 V/S、新号占比等维度):搜索频道 + 当前频道 +
    # 样本视频里出现但未覆盖的频道(逐个补齐,单个采集失败不阻塞整阶段)。
    channel_index: dict[str, dict] = {c["channelId"]: c for c in sample_channels if c.get("channelId")}
    if profile and profile.get("channelId"):
        channel_index.setdefault(profile["channelId"], profile)
    for cid in {v.get("channelId") for v in sample_videos if v.get("channelId")}:
        if cid not in channel_index:
            try:
                channel_index[cid] = collector.get_channel_profile(cid)
            except CollectorError:
                continue

    metrics = _track_metrics(sample_videos, channel_index, [*seed_keywords, *expanded_keywords], now)
    scores = _derive_track_scorecard(metrics)
    score_total = scores["score_total"]

    track_name = (seed_keywords[0] if seed_keywords else query) + " 赛道"

    artifact = {
        "artifact_id": gen_id("art"),
        "artifact_type": "track_scorecard",
        "produced_at": now_iso(),
        "stage_code": "S1",
        "track_name": track_name,
        "seed_keywords": seed_keywords,
        "expanded_keywords": expanded_keywords,
        "keyword_expansion": llm_expansion,  # ModelGateway 扩词产物(provider/keywords/rationale),可观测
        "sample_videos": sample_videos,
        "sample_channels": sample_channels,
        "channel_profile": profile,
        "channel_video_count": len(channel_videos),
        "scores": scores,
        "metrics": metrics,  # 参考01 §1 七维原始量 + 各维 0-10 分(可观测)
        "verdict": _verdict(score_total),
        "evidence": {
            "size": (
                f"供给密度 月供给≈{metrics['supply_density']['monthly_supply']} + "
                f"头部集中度 Top视频来自 {metrics['head_concentration']['distinct_channels']} 个频道"
            ),
            "growth": "首跑无历史快照,标灰并降权(neutral 5.0);加速度待 D+0 快照累积",
            "diff": (
                f"新号占比 {metrics['newcomer_ratio']['ratio']} / 中位V·S {metrics['median_vs']['ratio']} / "
                f"爆款率 {metrics['viral_rate']['ratio']} / 互动率 {metrics['engagement']['rate']}"
            ),
            "biz": f"赛道 RPM 估值 ≈ ${metrics['rpm']['usd_per_1k']}/千次播放(rpm.md 行业参考)",
        },
        "gray_fields": ["score_growth"],
        "generated_from": "mock_collector",
    }
    return {"artifact": artifact, "needs_review": True}


# ===== S2 对标发现(mock) =====
def _s2_tier(score_total: float) -> str:
    # 已定稿阈值(docs/02-design-decisions §8、42-s2-competitor-discovery.md)。
    if score_total >= 8.0:
        return "core"
    if score_total >= 6.5:
        return "candidate"
    return "archive"


def _build_s2_context(mounted_context: dict) -> dict:
    """从 mounted_context 读 track 锚点;无 track 时用 fallback 的 seed_keywords。"""
    track_bodies = ctx_asm.bodies_of_kind(mounted_context, "track")
    if track_bodies:
        body = track_bodies[0]
        return {
            "track_name": body.get("track_name"),
            "seed_keywords": body.get("seed_keywords") or [],
            "expanded_keywords": body.get("expanded_keywords") or [],
            "from": "knowledge_item",
        }
    seeds = ctx_asm.fallback_seeds(mounted_context)
    return {"track_name": None, "seed_keywords": seeds, "expanded_keywords": seeds, "from": "workflow_input"}


# 对标频道评分权重(参考01 §2 六维;无官方权重,按「系统推荐/新人友好」优先取定)。
_W_S2 = {
    "tenure": 0.20,        # ① 运营时长(新人友好)
    "subs_band": 0.15,     # ② 粉丝数甜区
    "recent_vs": 0.25,     # ③ 最近视频 V/S(靠推荐)
    "burst": 0.15,         # ④ 爆发倍数
    "acceleration": 0.10,  # ⑤ 加速度(首跑标灰)
    "update_freq": 0.15,   # ⑥ 更新频率
}


def _score_competitor(profile: dict, videos: list[dict], now: datetime) -> dict:
    """参考01 §2「挑频道」六维真实量化评分。返回六维分 + metrics 原始量 + heuristic score_total。"""
    subs = profile.get("subs") or 0
    views = [v.get("views") or 0 for v in videos]
    pub_dates = sorted([d for v in videos if (d := _parse_dt(v.get("publishedAt")))], reverse=True)
    recent = [v for v in videos if (_parse_dt(v.get("publishedAt")) or now) >= now - timedelta(days=90)]

    # ① 运营时长(新人友好):首条视频越近越值得抄;视频数过少(<5)未验证,轻微降权。
    first = _parse_dt(profile.get("firstVideoAt"))
    months = round((now - first).days / 30.4, 1) if first else None
    tenure_score = _lin_score(months, 6.0, 36.0, 9.0, 4.0) if months is not None else 5.0
    video_count = profile.get("videoCount") or len(videos)
    if video_count < 5:
        tenure_score = round(_clamp(tenure_score - 1.0), 1)

    # ② 粉丝数:1000–50000 甜区(太小未验证,太大抄不动)。
    if subs <= 0:
        subs_band_score = 4.0
    elif subs < 1000:
        subs_band_score = 5.0
    elif subs <= 50_000:
        subs_band_score = 9.0
    elif subs <= 500_000:
        subs_band_score = _lin_score(subs, 50_000, 500_000, 8.0, 5.0)
    else:
        subs_band_score = 4.0

    # ③ 最近视频 V/S 比:median(近90天播放) ÷ 粉丝数。≥10 系统大力推。
    recent_views = [v.get("views") or 0 for v in (recent or videos)]
    med_recent = median(recent_views) if recent_views else 0
    recent_vs = (med_recent / subs) if subs > 0 else None
    recent_vs_score = _lin_score(recent_vs, 1.0, 10.0, 3.0, 9.0) if recent_vs is not None else 5.0

    # ④ 爆发倍数:max(播放) ÷ avg(播放)。≥5 踩中爆点。
    avg_views = (sum(views) / len(views)) if views else 0.0
    burst = (max(views) / avg_views) if avg_views > 0 else 1.0
    burst_score = _lin_score(burst, 1.0, 5.0, 3.0, 9.0)

    # ⑤ 加速度:近90天均播 ÷ 前 90–180 天均播。无足够历史 → 标灰 neutral。
    prior = [
        v.get("views") or 0
        for v in videos
        if (d := _parse_dt(v.get("publishedAt"))) and now - timedelta(days=180) <= d < now - timedelta(days=90)
    ]
    recent_avg = (sum(v.get("views") or 0 for v in recent) / len(recent)) if recent else 0.0
    prior_avg = (sum(prior) / len(prior)) if prior else 0.0
    accel_gray = not (prior_avg > 0 and recent)
    accel = (recent_avg / prior_avg) if not accel_gray else None
    acceleration_score = _NEUTRAL_GROWTH if accel_gray else _lin_score(accel, 0.5, 2.0, 3.0, 9.0)

    # ⑥ 更新频率:最近若干视频平均间隔天数。≤7 活跃,>30 可能弃号。
    avg_gap = None
    if len(pub_dates) >= 2:
        gaps = [(pub_dates[i] - pub_dates[i + 1]).days for i in range(min(len(pub_dates) - 1, 9))]
        avg_gap = round(sum(gaps) / len(gaps), 1) if gaps else None
    update_freq_score = _lin_score(avg_gap, 7.0, 30.0, 9.0, 3.0) if avg_gap is not None else 5.0

    score_total = round(
        tenure_score * _W_S2["tenure"]
        + subs_band_score * _W_S2["subs_band"]
        + recent_vs_score * _W_S2["recent_vs"]
        + burst_score * _W_S2["burst"]
        + acceleration_score * _W_S2["acceleration"]
        + update_freq_score * _W_S2["update_freq"],
        1,
    )
    return {
        "tenure": tenure_score,
        "subs_band": subs_band_score,
        "recent_vs": recent_vs_score,
        "burst": burst_score,
        "acceleration": acceleration_score,
        "update_freq": update_freq_score,
        "metrics": {
            "tenure": {"months": months, "video_count": video_count, "score": tenure_score},
            "subs_band": {"subs": subs, "score": subs_band_score},
            "recent_vs": {"ratio": round(recent_vs, 2) if recent_vs is not None else None, "score": recent_vs_score},
            "burst": {"multiplier": round(burst, 2), "score": burst_score},
            "acceleration": {"ratio": round(accel, 2) if accel is not None else None, "gray": accel_gray, "score": acceleration_score},
            "update_freq": {"avg_gap_days": avg_gap, "score": update_freq_score},
        },
        "gray_fields": ["acceleration"] if accel_gray else [],
        "score_total": score_total,
    }


def _optional_float(value) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _llm_score_from_competitor_result(result: dict) -> float | None:
    """Map explain_competitor confidence(0..1) to S2's 0..10 score scale.

    The current gateway contract returns explanation confidence, not a raw
    relevance score. Treat it as a neutral-to-strong relevance signal so the
    LLM channel can add judgment without erasing the existing heuristic tiering.
    """
    confidence = _optional_float((result or {}).get("confidence"))
    if confidence is None:
        return None
    return round(_clamp(5.0 + confidence * 6.0), 1)


def _llm_explanation_from_competitor_result(result: dict) -> str:
    parts = [
        (result or {}).get("why_relevant") or "",
        (result or {}).get("risk_note") or "",
    ]
    return " | ".join(p for p in parts if p)[:500]


_YT_CHANNEL_RE = re.compile(r"youtube\.com/channel/(UC[0-9A-Za-z_-]{22})")


def _extract_channel_ids(results: list[dict]) -> list[str]:
    """从 web 搜索结果 URL 里抽显式 YouTube 频道 ID(/channel/UC...);handle/c 形式无法直解,略过。"""
    ids: list[str] = []
    for r in results or []:
        m = _YT_CHANNEL_RE.search(str((r or {}).get("url") or ""))
        if m and m.group(1) not in ids:
            ids.append(m.group(1))
    return ids


def run_s2(workflow: WorkflowRun, mounted_context: dict) -> dict:
    """S2 对标发现:多路发现(关键词/频道/评论挖人 + 可选 web 搜索)+ 启发式/LLM 融合评分。"""
    collector = get_collector()
    ctx = _build_s2_context(mounted_context)
    source_keywords = ctx["expanded_keywords"] or ctx["seed_keywords"]
    query = source_keywords[0] if source_keywords else "AI"

    sample_videos = collector.search_videos(query)
    searched_channels = collector.search_channels(query)

    # 路径1 keyword_search:视频结果里的 channelId
    kw_ids: list[str] = list(dict.fromkeys(v["channelId"] for v in sample_videos))
    # 路径3 comment_author_mining:从前若干视频评论挖 authorChannelId(新增的才算)
    comment_ids: list[str] = []
    for v in sample_videos[:3]:
        for cm in collector.get_video_comments(v["videoId"]):
            cid = cm.get("authorChannelId")
            if cid and cid not in kw_ids and cid not in comment_ids:
                comment_ids.append(cid)
    # 路径2 channel_search:搜索频道里、尚未被前两路覆盖的
    cs_ids: list[str] = [
        c["channelId"] for c in searched_channels
        if c["channelId"] not in kw_ids and c["channelId"] not in comment_ids
    ]
    # 路径4 web_search(可选,AnySearch 等):未配置真实搜索源时 NoopSearchProvider 返回 [],
    # web_ids/web_evidence 皆空,S2 行为与原三路完全一致(默认零变化)。
    web_evidence = get_search_provider().search(query, limit=10)
    _seen = set(kw_ids) | set(comment_ids) | set(cs_ids)
    web_ids: list[str] = [
        cid for cid in _extract_channel_ids(web_evidence) if cid not in _seen
    ]

    source_of: dict[str, str] = {}
    for cid in kw_ids:
        source_of.setdefault(cid, "keyword_search")
    for cid in comment_ids:
        source_of.setdefault(cid, "comment_author_mining")
    for cid in cs_ids:
        source_of.setdefault(cid, "channel_search")
    for cid in web_ids:
        source_of.setdefault(cid, "web_search")

    candidates = []
    skipped_candidates: list[dict] = []
    now = datetime.now(timezone.utc)
    gateway = get_model_gateway()
    with model_call_context(workflow_id=workflow.id, stage_code="S2"):
        for cid, path in source_of.items():
            # 逐候选隔离:单个候选的采集失败(瞬时超时 / 配额 / 受限频道)只跳过该候选,
            # 不掀翻整个 S2 阶段。广义发现调用(search/comments)仍在循环外,系统性错误照常上抛。
            try:
                profile = collector.get_channel_profile(cid)
                videos = collector.get_channel_videos(cid)
            except CollectorError as exc:
                skipped_candidates.append({
                    "channel_id": cid,
                    "source_path": path,
                    "error": f"{type(exc).__name__}: {exc}",
                })
                continue
            scores = _score_competitor(profile, videos, now)
            heuristic_score = scores["score_total"]

            llm_score: float | None = None
            llm_explanation = ""
            llm_skipped = False
            llm_error: str | None = None
            llm_candidate = {
                "channel_id": cid,
                "title": profile.get("title"),
                "subs": profile.get("subs", 0),
                "source_path": path,
                "sample_videos": [
                    {
                        "title": v.get("title"),
                        "views": v.get("views"),
                        "likes": v.get("likes"),
                        "comments": v.get("comments"),
                    }
                    for v in videos[:3]
                ],
                "tier": _s2_tier(heuristic_score),
            }
            llm_context = {
                "track": ctx,
                "source_keywords": source_keywords,
                "discovery_path": path,
                "heuristic_scores": scores,
            }
            try:
                llm_result = gateway.explain_competitor(llm_candidate, llm_context)
            except Exception as exc:  # noqa: BLE001 - candidate-level isolation is intentional.
                llm_result = {}
                llm_skipped = True
                llm_error = f"call_exception:{type(exc).__name__}: {exc}"

            if not isinstance(llm_result, dict):
                llm_result = {}
                llm_skipped = True
                llm_error = "invalid_llm_result"
            elif llm_result.get("_error"):
                llm_skipped = True
                llm_error = str(llm_result.get("_error"))
            elif not llm_skipped:
                llm_score = _llm_score_from_competitor_result(llm_result)
                llm_explanation = _llm_explanation_from_competitor_result(llm_result)
                if llm_score is None:
                    llm_skipped = True
                    llm_error = "missing_llm_score"

            score_total = (
                heuristic_score
                if llm_skipped or llm_score is None
                else round(0.5 * heuristic_score + 0.5 * llm_score, 1)
            )
            candidates.append({
                "candidate_id": cid,
                "channel_id": cid,
                "title": profile.get("title"),
                "subs": profile.get("subs", 0),
                "source_path": path,
                "sample_videos": [v.get("title") for v in videos[:3]],
                **scores,
                "heuristic_score": heuristic_score,
                "llm_score": llm_score,
                "llm_explanation": llm_explanation,
                "llm_skipped": llm_skipped,
                "llm_error": llm_error,
                "score_total": score_total,
                "tier": _s2_tier(score_total),
                "evidence": f"经 {path} 发现;近 {len(videos)} 条视频参与评分",
            })
    candidates.sort(key=lambda c: c["score_total"], reverse=True)

    artifact = {
        "artifact_id": gen_id("art"),
        "artifact_type": "competitor_candidates",
        "produced_at": now_iso(),
        "stage_code": "S2",
        "input_track": ctx,
        "source_keywords": source_keywords,
        "discovery_paths": {
            "keyword_search": kw_ids,
            "channel_search": cs_ids,
            "comment_author_mining": comment_ids,
            "web_search": web_ids,
        },
        "web_evidence": web_evidence,  # 通用 web 搜索证据(AnySearch 等);未配置则为 []
        "candidates": candidates,
        "skipped_candidates": skipped_candidates,
        "selected_candidate_ids": [],
        "generated_from": "mock_collector",
    }
    return {"artifact": artifact, "needs_review": True}


# ===== S2.5 爆款拆解(mock) =====
_VIRAL_MULTIPLIER_MIN = 3.0


def _title_formula(title: str) -> str:
    t = (title or "").lower()
    if "vs" in t or "对比" in title:
        return "对比型"
    if any(k in title for k in ("教程", "实战", "工作流")):
        return "实战/教程型"
    return "其他型"


def _reusable_angle(formula: str) -> str:
    return {
        "对比型": "用强冲突对比制造选择焦虑,引导观众站队",
        "实战/教程型": "以可复现步骤承诺即时收益,降低观看门槛",
    }.get(formula, "用结果前置吸引点击,正文兑现承诺")


def _structure_from_transcript(text: str) -> str:
    # 非真实 NLP:简单启发式从 mock 文本判断结构。
    if "第一步" in text or "三个维度" in text or "步" in text:
        return "总分总 / 分步推进"
    return "叙事铺陈"


def _list_of_strings(value) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(v) for v in value if v]


# 单视频评分权重(参考01 §3 五维「挑视频」)。
_W_S2_5 = {
    "vs": 0.30,            # ① V/S 比(这条跑赢号了吗)
    "daily_views": 0.20,   # ② 日均播放(火得快不快)
    "burst": 0.20,         # ③ 爆发倍数(比平时火多少)
    "engagement": 0.20,    # ④ 互动率(数据真不真)
    "comment_ratio": 0.10, # ⑤ 评论占比(话题性)
}


def _video_metrics(video: dict, subs: int, now: datetime) -> dict:
    """参考01 §3「挑视频」五维:单条视频是否值得拆解。返回 video_score(0-10) + 各维原始量。"""
    views = video.get("views") or 0
    likes = video.get("likes") or 0
    comments = video.get("comments") or 0

    # ① V/S 比:这条播放 ÷ 频道粉丝。≥10 超级爆款,≥5 合格,<5 普通。
    vs = (views / subs) if subs > 0 else None
    vs_score = _lin_score(vs, 2.0, 10.0, 3.0, 9.0) if vs is not None else 5.0

    # ② 日均播放:总播放 ÷ 发布到现在天数。≥3000/天 热。
    pub = _parse_dt(video.get("publishedAt"))
    days = max((now - pub).days, 1) if pub else 1
    daily = views / days
    daily_score = _lin_score(daily, 500.0, 3000.0, 4.0, 9.0)

    # ③ 爆发倍数:这条播放 ÷ 该号平时平均(沿用 collector 的 viralMultiplier)。≥3 值得看。
    burst = _optional_float(video.get("viralMultiplier")) or 0.0
    burst_score = _lin_score(burst, 1.0, 3.0, 3.0, 9.0)

    # ④ 互动率:(赞+评)/播放。~4% 正常,<2% 可能刷量。
    eng = ((likes + comments) / views) if views else 0.0
    eng_score = _lin_score(eng, 0.02, 0.04, 4.0, 8.5)

    # ⑤ 评论占比:评论数/播放。越高话题性越强。
    cr = (comments / views) if views else 0.0
    cr_score = _lin_score(cr, 0.001, 0.01, 4.0, 9.0)

    video_score = round(
        vs_score * _W_S2_5["vs"]
        + daily_score * _W_S2_5["daily_views"]
        + burst_score * _W_S2_5["burst"]
        + eng_score * _W_S2_5["engagement"]
        + cr_score * _W_S2_5["comment_ratio"],
        1,
    )
    return {
        "video_score": video_score,
        "video_metrics": {
            "vs": {"ratio": round(vs, 2) if vs is not None else None, "score": vs_score},
            "daily_views": {"per_day": round(daily), "score": daily_score},
            "burst": {"multiplier": round(burst, 2), "score": burst_score},
            "engagement": {"rate": round(eng, 4), "score": eng_score},
            "comment_ratio": {"rate": round(cr, 4), "score": cr_score},
        },
    }


def _s2_5_competitor_ids(mounted_context: dict) -> tuple[list[str], str]:
    """从 mounted_context 读 competitor 知识;无则用 fallback 的 S2 selected;都没有则空。"""
    comp_bodies = ctx_asm.bodies_of_kind(mounted_context, "competitor")
    ids = [b.get("competitor_channel_id") for b in comp_bodies if b.get("competitor_channel_id")]
    if ids:
        return list(dict.fromkeys(ids)), "knowledge_item"
    sel = ctx_asm.fallback_competitor_ids(mounted_context)
    if sel:
        return list(dict.fromkeys(sel)), "s2_artifact"
    return [], "none"


def run_s2_5(workflow: WorkflowRun, mounted_context: dict) -> dict:
    collector = get_collector()
    competitor_ids, input_source = _s2_5_competitor_ids(mounted_context)

    if not competitor_ids:
        # 不伪造成功:无输入 → completed_with_warning,空产物。
        return {
            "artifact": {
                "artifact_id": gen_id("art"),
                "artifact_type": "viral_teardowns",
                "produced_at": now_iso(),
                "stage_code": "S2.5",
                "input_competitors": [],
                "input_source": input_source,
                "selected_videos": [],
                "teardowns": [],
                "pattern_clusters": [],
                "status": "completed_with_warning",
                "warning": "无 competitor 输入:请先 approve S2 并 remember/勾选对标后再跑 S2.5",
                "generated_from": "mock_collector",
            },
            "needs_review": False,
        }

    # 筛爆款视频(简单 mock:viralMultiplier >= 3)
    selected_videos: list[dict] = []
    for cid in competitor_ids:
        for v in collector.get_channel_videos(cid):
            detail = collector.get_video_detail(v["videoId"])
            if detail.get("viralMultiplier", 0) >= _VIRAL_MULTIPLIER_MIN:
                selected_videos.append(detail)

    teardowns: list[dict] = []
    now = datetime.now(timezone.utc)
    _subs_cache: dict[str, int] = {}

    def _subs_for(cid: str | None) -> int:
        if not cid:
            return 0
        if cid not in _subs_cache:
            try:
                _subs_cache[cid] = (collector.get_channel_profile(cid) or {}).get("subs") or 0
            except CollectorError:
                _subs_cache[cid] = 0
        return _subs_cache[cid]

    gateway = get_model_gateway()
    with model_call_context(workflow_id=workflow.id, stage_code="S2.5"):
        for v in selected_videos:
            vid = v["videoId"]
            transcript = collector.get_transcript(vid)
            available = transcript is not None
            mock_formula = _title_formula(v.get("title", ""))
            comments = collector.get_video_comments(vid)
            comment_texts = [c.get("content", "") for c in comments if c.get("content")]
            mock_opening = (transcript[:40] + "…") if available else "基于标题/缩略图推断(无字幕)"
            mock_structure = _structure_from_transcript(transcript) if available else "未知(无字幕降级)"
            heuristic_confidence = 0.8 if available else 0.5

            llm_skipped = False
            llm_error: str | None = None
            llm_video = {
                "video_id": vid,
                "title": v.get("title"),
                "channel_id": v.get("channelId"),
                "durationSec": v.get("durationSec"),
                "views": v.get("views"),
                "likes": v.get("likes"),
                "comments": v.get("comments"),
                "tags": v.get("tags") or [],
                "transcript_status": "available" if available else "missing",
                "comment_samples": comment_texts[:5],
            }
            llm_context = {
                "input_competitors": competitor_ids,
                "input_source": input_source,
                "teardown_mode": "transcript_based" if available else "title_thumbnail_only",
            }
            try:
                llm_result = gateway.teardown_video(llm_video, transcript, llm_context)
            except Exception as exc:  # noqa: BLE001 - per-video isolation is intentional.
                llm_result = {}
                llm_skipped = True
                llm_error = f"call_exception:{type(exc).__name__}: {exc}"

            if not isinstance(llm_result, dict):
                llm_result = {}
                llm_skipped = True
                llm_error = "invalid_llm_result"
            elif llm_result.get("_error"):
                llm_skipped = True
                llm_error = str(llm_result.get("_error"))

            if llm_skipped:
                title_formula = mock_formula
                opening_30s = mock_opening
                structure = mock_structure
                comment_themes = []
                confidence = round(min(heuristic_confidence, 0.6), 2)
            else:
                title_formula = (llm_result.get("title_formula") or mock_formula).strip()
                opening_30s = (
                    llm_result.get("opening_30s")
                    or llm_result.get("opening_pattern")
                    or mock_opening
                ).strip()
                structure = (
                    llm_result.get("structure")
                    or llm_result.get("structure_pattern")
                    or mock_structure
                ).strip()
                comment_themes = _list_of_strings(llm_result.get("comment_themes"))
                confidence_value = _optional_float(llm_result.get("confidence"))
                if confidence_value is None:
                    llm_skipped = True
                    llm_error = "missing_confidence"
                    title_formula = mock_formula
                    opening_30s = mock_opening
                    structure = mock_structure
                    comment_themes = []
                    confidence = round(min(heuristic_confidence, 0.6), 2)
                else:
                    confidence = round(_clamp(confidence_value, 0.0, 1.0), 2)

            vm = _video_metrics(v, _subs_for(v.get("channelId")), now)
            teardowns.append({
                "video_id": vid,
                "title": v.get("title"),
                "channel_id": v.get("channelId"),
                "transcript_status": "available" if available else "missing",
                "teardown_mode": "transcript_based" if available else "title_thumbnail_only",
                # 参考01 §3 五维「挑视频」评分(可观测:该视频是否值得拆解)。
                "video_score": vm["video_score"],
                "video_metrics": vm["video_metrics"],
                "title_formula": title_formula,
                "opening_30s": opening_30s,
                "structure": structure,
                "comment_themes": comment_themes,
                # Backward-compatible field names for existing consumers/tests.
                "opening_pattern": opening_30s,
                "structure_pattern": structure,
                "comment_insight": comments[0]["content"] if comments else None,
                "reusable_angle": _reusable_angle(title_formula),
                "confidence": confidence,
                "heuristic_confidence": heuristic_confidence,
                "llm_skipped": llm_skipped,
                "llm_error": llm_error,
                "source_path": "viral_filter",
            })

    # 简单聚类:按 title_formula 归组;低置信拆解仅留 artifact,不入 pattern。
    groups: dict[str, list[dict]] = {}
    for t in teardowns:
        if t["confidence"] < 0.7:
            continue
        groups.setdefault(t["title_formula"], []).append(t)
    pattern_clusters = []
    for i, (formula, members) in enumerate(groups.items()):
        avg_conf = round(sum(m["confidence"] for m in members) / len(members), 2)
        pattern_clusters.append({
            "cluster_id": f"pc_{i}",
            "pattern_type": formula,
            "summary": f"{formula}爆款公式 · {_reusable_angle(formula)}",
            "supporting_video_ids": [m["video_id"] for m in members],
            "confidence": avg_conf,
        })

    artifact = {
        "artifact_id": gen_id("art"),
        "artifact_type": "viral_teardowns",
        "produced_at": now_iso(),
        "stage_code": "S2.5",
        "input_competitors": competitor_ids,
        "input_source": input_source,
        "selected_videos": [v["videoId"] for v in selected_videos],
        "teardowns": teardowns,
        "pattern_clusters": pattern_clusters,
        "status": "completed",
        "generated_from": "mock_collector",
    }
    return {"artifact": artifact, "needs_review": False}


def run_stage_handler(stage_code: str, workflow: WorkflowRun, mounted_context: dict) -> dict:
    """返回 {'artifact': dict, 'needs_review': bool}。mounted_context 由 S0 装配后注入。"""
    if stage_code == "S1":
        return run_s1(workflow, mounted_context)
    if stage_code == "S2":
        return run_s2(workflow, mounted_context)
    if stage_code == "S2.5":
        return run_s2_5(workflow, mounted_context)
    if stage_code == "S4":
        return run_s4(workflow, mounted_context)
    if stage_code == "S5":
        return run_s5(workflow, mounted_context)
    if stage_code == "S6":
        return run_s6(workflow, mounted_context)
    if stage_code == "S7":
        return run_s7(workflow, mounted_context)
    if stage_code == "S8":
        return run_s8(workflow, mounted_context)
    raise ValueError(f"unknown stage_code: {stage_code}")


# ===== S4 热点雷达(mock) =====
def _s4_verdict(opportunity: float) -> str:
    # 已定稿阈值(docs/44-s4-hotspot-radar.md)。
    if opportunity >= 7.5:
        return "recommended"
    if opportunity >= 6.0:
        return "maybe"
    return "ignore"


def _hotspot_velocity(hotspot: dict, now: datetime) -> tuple[float | None, dict]:
    """A2 · Velocity:热点看「加速度」而非总量(参考资料 §2.5)。

    YouTube trending 用 views/小时,HN 用 points/小时;映射到 0-10 作为时效分。
    缺时间戳/量级 → 返回 (None, gray) 让 caller 回退中性 timeliness,不阻塞。
    """
    ts = _parse_dt(hotspot.get("published_at") or hotspot.get("created_at"))
    if ts is None:
        return None, {"kind": None, "magnitude": None, "age_hours": None, "per_hour": None, "gray": True}
    age_hours = max((now - ts).total_seconds() / 3600.0, 1.0)
    if hotspot.get("source") == "youtube_trending":
        magnitude = hotspot.get("views") or 0
        per_hour = magnitude / age_hours
        score = _lin_score(per_hour, 500.0, 5000.0, 4.0, 9.0)
        kind = "views_per_hour"
    else:  # hn / 其它:用 points 速率
        magnitude = hotspot.get("points") or 0
        per_hour = magnitude / age_hours
        score = _lin_score(per_hour, 2.0, 20.0, 4.0, 9.0)
        kind = "points_per_hour"
    return score, {
        "kind": kind,
        "magnitude": magnitude,
        "age_hours": round(age_hours, 1),
        "per_hour": round(per_hour, 1),
        "gray": False,
    }


def _s4_context(workflow: WorkflowRun, mounted_context: dict) -> dict:
    """从 mounted_context 读 track/competitor/viral_pattern;fallback seed_keywords。"""
    track_bodies = ctx_asm.bodies_of_kind(mounted_context, "track")
    competitor_bodies = ctx_asm.bodies_of_kind(mounted_context, "competitor")
    pattern_bodies = ctx_asm.bodies_of_kind(mounted_context, "viral_pattern")
    seeds = workflow.input.get("seed_keywords") or []

    track_kw: list[str] = []
    track_name = None
    if track_bodies:
        body = track_bodies[0]
        track_name = body.get("track_name")
        track_kw = (body.get("expanded_keywords") or []) + (body.get("seed_keywords") or [])
    keywords = list(dict.fromkeys([*track_kw, *seeds]))

    return {
        "context_source": mounted_context["source"],
        "context_used": {
            "track": track_name,
            "competitors": [c.get("competitor_channel_id") for c in competitor_bodies],
            "viral_patterns": [p.get("pattern_type") for p in pattern_bodies],
            "seed_keywords": seeds,
        },
        "_keywords": keywords,
        "_pattern_types": [p.get("pattern_type") for p in pattern_bodies],
    }


def _llm_score_from_hotspot_result(result: dict) -> float | None:
    """Map adapt_hotspot confidence(0..1) to S4's 0..10 opportunity scale."""
    confidence = _optional_float((result or {}).get("confidence"))
    if confidence is None:
        return None
    return round(_clamp(5.0 + confidence * 6.0), 1)


def run_s4(workflow: WorkflowRun, mounted_context: dict) -> dict:
    collector = get_collector()
    ctx = _s4_context(workflow, mounted_context)
    ctx_terms = {k.lower() for k in ctx["_keywords"]}
    ctx_tokens = {tok for k in ctx_terms for tok in k.split()}

    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=7)).isoformat()

    hotspots = []
    gateway = get_model_gateway()
    with model_call_context(workflow_id=workflow.id, stage_code="S4"):
        for h in collector.get_hotspots():
            hk = [k.lower() for k in h.get("keywords", [])]
            full = any(k in ctx_terms for k in hk)
            tokens = {tok for k in hk for tok in k.split()}
            partial = bool(tokens & ctx_tokens)
            matched = [k for k in h.get("keywords", []) if k.lower() in ctx_terms] or sorted(tokens & ctx_tokens)

            relevance = 9.0 if full else 6.0 if partial else 4.0
            heat = 8.0 if h.get("source") == "youtube_trending" else 6.0
            # A2 · Velocity 时效分:有时间戳/量级则用 views|points 每小时速率,否则中性 7.0。
            velocity_score, velocity_metric = _hotspot_velocity(h, now)
            timeliness = velocity_score if velocity_score is not None else 7.0
            story = 6.0
            competition = 6.0   # 反向分(越高竞争越小),mock 中性
            heuristic_score = round(
                relevance * 0.35 + heat * 0.25 + timeliness * 0.15 + story * 0.15 + competition * 0.10, 1
            )
            angle_hint = (
                ctx["_pattern_types"][0]
                if ctx["_pattern_types"]
                else (ctx["context_used"]["track"] or "频道赛道")
            )
            mock_angle = f"结合「{angle_hint}」切入:{h.get('title')}"
            mock_reason = f"relevance={relevance} heat={heat} → opportunity={heuristic_score}"

            llm_score: float | None = None
            llm_skipped = False
            llm_error: str | None = None
            llm_hotspot = {
                "source_id": h.get("sourceId"),
                "source": h.get("source"),
                "title": h.get("title"),
                "url": h.get("url"),
                "keywords": h.get("keywords") or [],
                "matched_keywords": matched,
                "heat_score": heat,
                "relevance_score": relevance,
                "heuristic_score": heuristic_score,
            }
            llm_context = {
                "angle_hint": angle_hint,
                "context_used": ctx["context_used"],
                "context_source": ctx["context_source"],
            }
            try:
                llm_result = gateway.adapt_hotspot(llm_hotspot, llm_context)
            except Exception as exc:  # noqa: BLE001 - per-hotspot isolation is intentional.
                llm_result = {}
                llm_skipped = True
                llm_error = f"call_exception:{type(exc).__name__}: {exc}"

            if not isinstance(llm_result, dict):
                llm_result = {}
                llm_skipped = True
                llm_error = "invalid_llm_result"
            elif llm_result.get("_error"):
                llm_skipped = True
                llm_error = str(llm_result.get("_error"))
            elif not llm_skipped:
                llm_score = _llm_score_from_hotspot_result(llm_result)
                if llm_score is None:
                    llm_skipped = True
                    llm_error = "missing_llm_score"

            opportunity = (
                heuristic_score
                if llm_skipped or llm_score is None
                else round(0.5 * heuristic_score + 0.5 * llm_score, 1)
            )
            adapted_angle = (
                mock_angle
                if llm_skipped
                else (llm_result.get("adapted_angle") or llm_result.get("angle") or mock_angle)
            )
            reason = (
                mock_reason
                if llm_skipped
                else (llm_result.get("reason") or llm_result.get("risks") or mock_reason)
            )

            hotspots.append({
                "hotspot_id": h.get("sourceId") or gen_id("hs"),
                "source": h.get("source"),
                "title": h.get("title"),
                "url": h.get("url"),
                "discovered_at": now.isoformat(),
                "heat_score": heat,
                "relevance_score": relevance,
                "timeliness_score": timeliness,
                "velocity_metric": velocity_metric,
                "story_score": story,
                "competition_score": competition,
                "heuristic_score": heuristic_score,
                "llm_score": llm_score,
                "llm_skipped": llm_skipped,
                "llm_error": llm_error,
                "opportunity_score": opportunity,
                "verdict": _s4_verdict(opportunity),
                "matched_keywords": matched,
                "adapted_angle": adapted_angle,
                "reason": reason,
                "expires_at": expires,
            })
    hotspots.sort(key=lambda x: x["opportunity_score"], reverse=True)

    artifact = {
        "artifact_id": gen_id("art"),
        "artifact_type": "hotspot_batch",
        "produced_at": now_iso(),
        "stage_code": "S4",
        "context_source": ctx["context_source"],
        "context_used": ctx["context_used"],
        "hotspots": hotspots,
        "generated_from": "mock_collector",
    }
    return {"artifact": artifact, "needs_review": False}


# ===== S5-S8 视频生产层(L3) via Agent-L3 =====

import os
import httpx

_AGENT_L3_URL = os.getenv("AGENT_L3_URL", "http://localhost:8001")


def _agent_l3(method: str, path: str, body: dict = None) -> dict:
    url = f"{_AGENT_L3_URL}{path}"
    try:
        with httpx.Client(timeout=300) as c:
            r = c.post(url, json=body or {}) if method == "POST" else c.get(url)
            result = r.json()
            ok = result.get('success')
            if not ok:
                print(f"[Agent-L3] {method} {path} → FAIL: {result.get('error',{}).get('message','')[:120]}")
            else:
                print(f"[Agent-L3] {method} {path} → OK")
            return result
    except Exception as e:
        print(f"[Agent-L3] {method} {path} → EXCEPTION: {type(e).__name__}: {e}")
        return {"success": False, "error": {"code": "SERVICE_UNAVAILABLE", "message": str(e)}}


def _mock_l3(atype: str, scode: str, fields: dict) -> dict:
    return {"artifact_id": gen_id("art"), "artifact_type": atype, "stage_code": scode, "produced_at": now_iso(), "generated_from": "mock_fallback", **fields}


def run_s5(workflow: WorkflowRun, mounted_context: dict) -> dict:
    _agent_l3("POST", "/api/init", {"userData": workflow.input.get("user_data", ""), "channelDesc": workflow.input.get("channel_desc", "")})
    r = _agent_l3("POST", "/api/s5/generate", {})
    print(f"[S5] result: success={r.get('success')} keys={list(r.keys())[:5]}")
    if r.get("success") and r.get("data"):
        a = r["data"]; a["stage_code"] = "S5"
        return {"artifact": a, "needs_review": False}
    print(f"[S5] FALLBACK TO MOCK: {r.get('error',{}).get('message','')[:100]}")
    return {"artifact": _mock_l3("topic_candidates", "S5", {"topics": [{"rank": 1, "title": "(mock)选题1", "score": 8.5, "locked": True, "unique": "mock角度"}]}), "needs_review": False}


def run_s6(workflow: WorkflowRun, mounted_context: dict) -> dict:
    _agent_l3("POST", "/api/s5/select", {"candidateId": 0})
    r = _agent_l3("POST", "/api/s6/generate", {})
    if r.get("success") and r.get("data"):
        a = r["data"]; a["stage_code"] = "S6"
        return {"artifact": a, "needs_review": True}
    return {"artifact": _mock_l3("outline", "S6", {"outline": [{"ch": "(mock)钩子", "dur": "15s", "tension": 9}, {"ch": "(mock)内容", "dur": "3min", "tension": 8, "crisis": True}]}), "needs_review": True}


def run_s7(workflow: WorkflowRun, mounted_context: dict) -> dict:
    _agent_l3("POST", "/api/s6/confirm", {})
    r = _agent_l3("POST", "/api/s7/generate", {})
    if r.get("success") and r.get("data"):
        a = r["data"]; a["stage_code"] = "S7"
        return {"artifact": a, "needs_review": False}
    return {"artifact": _mock_l3("script", "S7", {"excerpt": "(mock)脚本...", "body_md": "(mock)脚本全文", "word_count": 50}), "needs_review": False}


def run_s8(workflow: WorkflowRun, mounted_context: dict) -> dict:
    _agent_l3("POST", "/api/s7/confirm", {})
    r = _agent_l3("POST", "/api/s8/run", {})
    if r.get("success") and r.get("data"):
        a = r["data"]; a["stage_code"] = "S8"
        return {"artifact": a, "needs_review": True}
    return {"artifact": _mock_l3("adversarial_review", "S8", {"roles": [{"role_key": "nitpicker", "name": "杠精", "avatar": "😤", "score": 7, "issues": [], "note": "(mock)"}], "averageScore": 7.5, "decision": "pass"}), "needs_review": True}
