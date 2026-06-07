"""Workflow Engine(= S0 总协调的实现载体,里程碑 2)。

职责:创建 workflow + 4 个 stage_runs、推进主链、审核闸(approve/reject)、发射 run_events。
不含 S1/S2/S2.5/S4 的业务逻辑(由 thin handlers 占位)。状态机见 docs/31-workflow-engine.md。
"""
from __future__ import annotations

from app.domain.types import (
    CHAIN,
    STAGE_DEFS,
    STAGE_DEFS_L3,
    WORKFLOW_KIND_CHANNEL_INTELLIGENCE,
    WORKFLOW_KIND_VIDEO_PRODUCTION,
    stage_defs_for,
    CandidateStatus,
    Competitor,
    EventKind,
    Hotspot,
    KnowledgeCandidate,
    KnowledgeItem,
    RunEvent,
    StageRun,
    StageStatus,
    Track,
    ViralPattern,
    WorkflowRun,
    WorkflowStatus,
    gen_id,
    now_iso,
    stage_defs_for,
)
from app.repositories.knowledge_repository import knowledge_repo
from app.repositories.typed_repository import typed_repo
from app.repositories.workflow_repository import repo
from app.services import context_assembler
from app.stages.handlers import run_stage_handler


class NotFoundError(Exception):
    pass


class ConflictError(Exception):
    pass


# 已实装 handler 的阶段(其余 L3 阶段 S5–S17/FINAL 仅作脚手架,run 前以 409 拦截,不触发 500)。
IMPLEMENTED_STAGES: set[str] = {"S1", "S2", "S2.5", "S4", "S5", "S6", "S7", "S8"}

# L3 视频生产主链
CHAIN_L3: list[str] = ["S5", "S6", "S7", "S8"]


# ---- 内部工具 ----
_MESSAGES = {
    EventKind.workflow_created: "工作流已创建",
    EventKind.workflow_started: "工作流开始运行",
    EventKind.workflow_completed: "主链完成(S4 独立,不阻塞)",
    EventKind.workflow_failed: "工作流失败",
    EventKind.stage_started: "{stage} 开始执行",
    EventKind.stage_awaiting_review: "{stage} 等待人工审核",
    EventKind.stage_approved: "{stage} 审核通过",
    EventKind.stage_rejected: "{stage} 被驳回",
    EventKind.stage_completed: "{stage} 完成",
    EventKind.stage_failed: "{stage} 执行失败",
    EventKind.context_mounted: "{stage} 装配 mounted_context",
    EventKind.artifact_created: "{stage} 产出 artifact",
    EventKind.knowledge_candidate_created: "生成知识候选(待确认)",
    EventKind.knowledge_candidate_resolved: "知识候选已处理",
    EventKind.knowledge_item_created: "知识已沉淀(knowledge_item)",
}

_REF_PAYLOAD_KEY = {
    "track": "track_id",
    "competitor": "competitor_id",
    "viral_pattern": "viral_pattern_id",
    "hotspot": "hotspot_ref_id",
}


def _default_message(kind: EventKind, stage_code: str | None) -> str:
    tmpl = _MESSAGES.get(kind, kind.value)
    return tmpl.format(stage=stage_code) if stage_code else tmpl


def _emit(
    workflow_id: str,
    kind: EventKind,
    stage_code: str | None = None,
    payload: dict | None = None,
    message: str | None = None,
) -> None:
    repo.add_event(
        RunEvent(
            id=gen_id("ev"),
            workflow_id=workflow_id,
            stage_code=stage_code,
            kind=kind,
            message=message or _default_message(kind, stage_code),
            payload=payload or {},
        )
    )


def _require_workflow(workflow_id: str) -> WorkflowRun:
    wf = repo.get_workflow(workflow_id)
    if wf is None:
        raise NotFoundError(f"workflow '{workflow_id}' not found")
    return wf


def _require_stage(workflow_id: str, stage_code: str) -> StageRun:
    s = repo.get_stage(workflow_id, stage_code)
    if s is None:
        raise NotFoundError(f"stage '{stage_code}' not found in workflow '{workflow_id}'")
    return s


# ---- 公开操作 ----
def create_workflow(
    channel_id: str | None = None,
    seed_keywords: list[str] | None = None,
    platform: str = "youtube",
    language: str = "zh",
    owner_id: str | None = None,
    kind: str = WORKFLOW_KIND_CHANNEL_INTELLIGENCE,
    title: str | None = None,
    config: dict | None = None,
) -> WorkflowRun:
    # 阶段集随 kind:channel_intelligence→L2(S1/S2/S2.5/S4);video_production→L3(S5–S17+FINAL)。
    defs = stage_defs_for(kind)
    input_data: dict = {
        "seed_keywords": seed_keywords or [],
        "platform": platform,
        "language": language,
    }
    if title is not None:
        input_data["title"] = title
    if config is not None:
        # 前端 WorkflowConfigSnapshot:{version, stages:{<stage_code>:{kind,schema_version,values}}}。
        # 仅存「值」(schema 不上线);L3 handler 经 services.stage_config 解析(override>快照>默认)。
        input_data["config"] = config
    wf = WorkflowRun(
        id=gen_id("wf"),
        channel_id=channel_id,
        owner_id=owner_id,
        kind=kind,
        input=input_data,
    )
    repo.add_workflow(wf)
    stages = [
        StageRun(
            id=gen_id("sr"),
            workflow_id=wf.id,
            stage_code=d.code,
            stage_name=d.name,
            stage_slug=d.slug,
            order=i,
        )
        for i, d in enumerate(defs)
    ]
    repo.set_stages(wf.id, stages)
    _emit(wf.id, EventKind.workflow_created, payload={"stages": [d.code for d in defs], "kind": kind})
    return wf


def run_workflow(workflow_id: str) -> WorkflowRun:
    wf = _require_workflow(workflow_id)
    # 按 kind 选主链:L2=S1→S2→S2.5;L3=S5→S6→S7→S8
    chain = CHAIN_L3 if wf.kind == WORKFLOW_KIND_VIDEO_PRODUCTION else CHAIN
    stages = repo.get_stages(wf.id)
    for s in stages:
        if s.status in (StageStatus.running, StageStatus.awaiting_review):
            raise ConflictError(f"stage {s.stage_code} is {s.status.value}; resolve it before running")
    # 找主链上第一个 pending 且前置已完成的阶段
    for idx, code in enumerate(chain):
        s = _require_stage(wf.id, code)
        if s.status != StageStatus.pending:
            continue
        if idx > 0:
            prev = _require_stage(wf.id, chain[idx - 1])
            if prev.status != StageStatus.completed:
                continue
        # 首次从 pending 启动时发 workflow_started
        if wf.status == WorkflowStatus.pending:
            wf.status = WorkflowStatus.running
            _emit(wf.id, EventKind.workflow_started)
        _run_stage(wf, s)
        return wf
    raise ConflictError("no runnable stage (chain complete or blocked)")


def run_independent_stage(workflow_id: str, stage_code: str) -> WorkflowRun:
    """独立触发非主链阶段(MVP:仅 S4)。不影响主链状态;可重复触发。"""
    wf = _require_workflow(workflow_id)
    s = _require_stage(workflow_id, stage_code)
    if stage_code in CHAIN:
        raise ConflictError(f"{stage_code} 属主链,请用 /run;此入口仅用于独立阶段(S4)")
    if stage_code not in IMPLEMENTED_STAGES:
        raise ConflictError(f"stage {stage_code} handler 未实装(L3 待 Twy/Zxd 接入)")
    if s.status == StageStatus.running:
        raise ConflictError(f"stage {stage_code} 正在运行")
    _run_stage(wf, s, independent=True)
    return wf


def approve_stage(
    workflow_id: str,
    stage_code: str,
    notes: str | None = None,
    selected_candidate_ids: list[str] | None = None,
) -> WorkflowRun:
    wf = _require_workflow(workflow_id)
    s = _require_stage(workflow_id, stage_code)
    if s.status != StageStatus.awaiting_review:
        raise ConflictError(f"stage {stage_code} is {s.status.value}, not awaiting_review")
    s.status = StageStatus.completed
    s.completed_at = now_iso()
    s.review_decision = "approved"
    s.review_reason = notes
    _emit(wf.id, EventKind.stage_approved, stage_code, {"notes": notes})
    _emit(wf.id, EventKind.stage_completed, stage_code, {"artifact": s.output_artifact})
    # 通过后从 artifact 蒸馏知识候选(待用户确认,不直接入库)。
    if stage_code == "S1":
        _create_track_candidate(wf, s)
    elif stage_code == "S2":
        _create_competitor_candidates(wf, s, selected_candidate_ids)
    # 审核通过后**不自动推进**:由显式 run 启动下一阶段,
    # 以便在两阶段之间先确认/沉淀知识(如 S1 track 记住后再跑 S2,体现 mounted_context)。
    # 非审核阶段(S2.5)由 run 启动后在 _run_stage 内自动收尾。
    if wf.status == WorkflowStatus.awaiting_review:
        wf.status = WorkflowStatus.running
    wf.current_stage = None
    return wf


def reject_stage(workflow_id: str, stage_code: str, reason: str) -> WorkflowRun:
    wf = _require_workflow(workflow_id)
    s = _require_stage(workflow_id, stage_code)
    if s.status != StageStatus.awaiting_review:
        raise ConflictError(f"stage {stage_code} is {s.status.value}, not awaiting_review")
    # 驳回 → 回到 pending 可重跑(理由进 run_events,见 docs/31 两层机制)
    s.status = StageStatus.pending
    s.review_decision = "rejected"
    s.review_reason = reason
    s.output_artifact = None
    wf.status = WorkflowStatus.running
    wf.current_stage = stage_code
    _emit(wf.id, EventKind.stage_rejected, stage_code, {"reason": reason})
    return wf


# ---- 内部状态机 ----
# ---- 知识候选 / 沉淀(B 阶段最小闭环) ----
def _create_track_candidate(wf: WorkflowRun, stage: StageRun) -> KnowledgeCandidate:
    art = stage.output_artifact or {}
    track = Track(
        id=gen_id("track"),
        workflow_id=wf.id,
        channel_id=wf.channel_id,
        track_name=art.get("track_name") or "",
        seed_keywords=art.get("seed_keywords") or [],
        expanded_keywords=art.get("expanded_keywords") or [],
        scores=art.get("scores") or {},
        verdict=art.get("verdict"),
        provenance_artifact_id=art.get("artifact_id"),
    )
    typed_repo.add_track(track)
    candidate = KnowledgeCandidate(
        id=gen_id("kc"),
        workflow_id=wf.id,
        channel_id=wf.channel_id,
        stage_code=stage.stage_code,
        source="artifact_distillation",
        kind="track",
        scope="channel",
        summary=f"锁定赛道:{art.get('track_name', '未命名赛道')}",
        payload={
            "track_name": art.get("track_name"),
            "seed_keywords": art.get("seed_keywords"),
            "expanded_keywords": art.get("expanded_keywords"),
            "scores": art.get("scores"),
            "verdict": art.get("verdict"),
            "provenance_artifact_id": art.get("artifact_id"),
            "track_id": track.id,
        },
    )
    knowledge_repo.add_candidate(candidate)
    _emit(
        wf.id,
        EventKind.knowledge_candidate_created,
        stage.stage_code,
        {"candidate_id": candidate.id, "kind": candidate.kind, "source": candidate.source},
    )
    return candidate


def _create_competitor_candidates(
    wf: WorkflowRun, stage: StageRun, selected_candidate_ids: list[str] | None
) -> list[KnowledgeCandidate]:
    art = stage.output_artifact or {}
    all_candidates = art.get("candidates", [])
    if selected_candidate_ids is None:
        # 默认选中 tier=core
        selected = [c for c in all_candidates if c.get("tier") == "core"]
    else:
        selected = [c for c in all_candidates if c.get("channel_id") in selected_candidate_ids]
    art["selected_candidate_ids"] = [c["channel_id"] for c in selected]

    created: list[KnowledgeCandidate] = []
    for c in selected:
        competitor = Competitor(
            id=gen_id("comp"),
            workflow_id=wf.id,
            channel_id=wf.channel_id,
            competitor_channel_id=c.get("channel_id") or "",
            title=c.get("title"),
            subs=c.get("subs") or 0,
            tier=c.get("tier"),
            score_total=c.get("score_total") or 0,
            source_path=c.get("source_path"),
            provenance_artifact_id=art.get("artifact_id"),
        )
        typed_repo.add_competitor(competitor)
        candidate = KnowledgeCandidate(
            id=gen_id("kc"),
            workflow_id=wf.id,
            channel_id=wf.channel_id,
            stage_code=stage.stage_code,
            source="artifact_distillation",
            kind="competitor",
            scope="channel",
            summary=f"对标:{c.get('title')}({c.get('tier')})",
            payload={
                "competitor_channel_id": c.get("channel_id"),
                "title": c.get("title"),
                "subs": c.get("subs"),
                "tier": c.get("tier"),
                "score_total": c.get("score_total"),
                "source_path": c.get("source_path"),
                "provenance_artifact_id": art.get("artifact_id"),
                "competitor_id": competitor.id,
            },
        )
        knowledge_repo.add_candidate(candidate)
        _emit(
            wf.id,
            EventKind.knowledge_candidate_created,
            stage.stage_code,
            {"candidate_id": candidate.id, "kind": candidate.kind, "competitor": c.get("channel_id")},
        )
        created.append(candidate)
    return created


def _create_viral_pattern_candidates(wf: WorkflowRun, stage: StageRun) -> list[KnowledgeCandidate]:
    art = stage.output_artifact or {}
    clusters = art.get("pattern_clusters", [])
    created: list[KnowledgeCandidate] = []
    for cl in clusters:
        pattern = ViralPattern(
            id=gen_id("vp"),
            workflow_id=wf.id,
            channel_id=wf.channel_id,
            cluster_id=cl.get("cluster_id"),
            pattern_type=cl.get("pattern_type"),
            summary=cl.get("summary", ""),
            supporting_video_ids=cl.get("supporting_video_ids") or [],
            confidence=cl.get("confidence") or 0,
            provenance_artifact_id=art.get("artifact_id"),
        )
        typed_repo.add_viral_pattern(pattern)
        candidate = KnowledgeCandidate(
            id=gen_id("kc"),
            workflow_id=wf.id,
            channel_id=wf.channel_id,
            stage_code=stage.stage_code,
            source="artifact_distillation",
            kind="viral_pattern",
            scope="channel",
            summary=cl.get("summary", "爆款公式"),
            payload={
                "cluster_id": cl.get("cluster_id"),
                "pattern_type": cl.get("pattern_type"),
                "supporting_video_ids": cl.get("supporting_video_ids"),
                "confidence": cl.get("confidence"),
                "provenance_artifact_id": art.get("artifact_id"),
                "viral_pattern_id": pattern.id,
            },
        )
        knowledge_repo.add_candidate(candidate)
        _emit(
            wf.id,
            EventKind.knowledge_candidate_created,
            stage.stage_code,
            {"candidate_id": candidate.id, "kind": candidate.kind, "pattern_type": cl.get("pattern_type")},
        )
        created.append(candidate)
    return created


def _create_hotspot_candidates(wf: WorkflowRun, stage: StageRun) -> list[KnowledgeCandidate]:
    """S4 默认不沉淀;仅对 verdict=recommended 的热点生成候选(可选闭环)。"""
    art = stage.output_artifact or {}
    created: list[KnowledgeCandidate] = []
    for h in art.get("hotspots", []):
        if h.get("verdict") != "recommended":
            continue
        hotspot = Hotspot(
            id=gen_id("hs"),
            workflow_id=wf.id,
            channel_id=wf.channel_id,
            source_hotspot_id=h.get("hotspot_id"),
            source=h.get("source"),
            title=h.get("title"),
            opportunity_score=h.get("opportunity_score") or 0,
            matched_keywords=h.get("matched_keywords") or [],
            adapted_angle=h.get("adapted_angle"),
            expires_at=h.get("expires_at"),
            verdict=h.get("verdict"),
            provenance_artifact_id=art.get("artifact_id"),
        )
        typed_repo.add_hotspot(hotspot)
        candidate = KnowledgeCandidate(
            id=gen_id("kc"),
            workflow_id=wf.id,
            channel_id=wf.channel_id,
            stage_code=stage.stage_code,
            source="artifact_distillation",
            kind="hotspot",
            scope="channel",
            summary=f"热点机会:{h.get('title')}(opportunity={h.get('opportunity_score')})",
            payload={
                "hotspot_id": h.get("hotspot_id"),
                "source": h.get("source"),
                "opportunity_score": h.get("opportunity_score"),
                "matched_keywords": h.get("matched_keywords"),
                "adapted_angle": h.get("adapted_angle"),
                "expires_at": h.get("expires_at"),
                "provenance_artifact_id": art.get("artifact_id"),
                "hotspot_ref_id": hotspot.id,
            },
        )
        knowledge_repo.add_candidate(candidate)
        _emit(
            wf.id,
            EventKind.knowledge_candidate_created,
            stage.stage_code,
            {"candidate_id": candidate.id, "kind": candidate.kind, "hotspot": h.get("hotspot_id")},
        )
        created.append(candidate)
    return created


def list_candidates(workflow_id: str) -> list[KnowledgeCandidate]:
    _require_workflow(workflow_id)
    return knowledge_repo.list_candidates(workflow_id)


def list_knowledge_items(workflow_id: str) -> list[KnowledgeItem]:
    _require_workflow(workflow_id)
    return knowledge_repo.list_items(workflow_id=workflow_id)


def resolve_candidate(workflow_id: str, candidate_id: str, action: str) -> KnowledgeCandidate:
    _require_workflow(workflow_id)
    candidate = knowledge_repo.get_candidate(candidate_id)
    if candidate is None or candidate.workflow_id != workflow_id:
        raise NotFoundError(f"candidate '{candidate_id}' not found in workflow '{workflow_id}'")
    if candidate.status != CandidateStatus.pending:
        raise ConflictError(f"candidate {candidate_id} already {candidate.status.value}")

    if action == "remember":
        ref_type = "none"
        ref_id = None
        ref_key = _REF_PAYLOAD_KEY.get(candidate.kind)
        if ref_key and candidate.payload.get(ref_key):
            ref_type = candidate.kind
            ref_id = candidate.payload[ref_key]
        item = KnowledgeItem(
            id=gen_id("ki"),
            workflow_id=workflow_id,
            channel_id=candidate.channel_id,
            scope=candidate.scope,
            kind=candidate.kind,
            summary=candidate.summary,
            body=candidate.payload,
            ref_type=ref_type,
            ref_id=ref_id,
            provenance_type="review",
            provenance_id=candidate.id,
            created_by="user",
        )
        knowledge_repo.add_item(item)
        candidate.status = CandidateStatus.remembered
        candidate.resolved_knowledge_id = item.id
        candidate.resolved_at = now_iso()
        _emit(workflow_id, EventKind.knowledge_item_created, candidate.stage_code,
              {"knowledge_item_id": item.id, "kind": item.kind})
        _emit(workflow_id, EventKind.knowledge_candidate_resolved, candidate.stage_code,
              {"candidate_id": candidate.id, "action": action, "knowledge_item_id": item.id})
    elif action == "session_only":
        candidate.status = CandidateStatus.session_only
        candidate.resolved_at = now_iso()
        # 仅本次有效:不写 knowledge_items(后续仅注入 mounted_context)。
        _emit(workflow_id, EventKind.knowledge_candidate_resolved, candidate.stage_code,
              {"candidate_id": candidate.id, "action": action})
    elif action == "ignore":
        candidate.status = CandidateStatus.ignored
        candidate.resolved_at = now_iso()
        _emit(workflow_id, EventKind.knowledge_candidate_resolved, candidate.stage_code,
              {"candidate_id": candidate.id, "action": action})
    else:
        raise ConflictError(f"unknown action '{action}' (expect remember|session_only|ignore)")

    return candidate


def _run_stage(wf: WorkflowRun, stage: StageRun, independent: bool = False) -> None:
    """运行一个阶段。independent=True 用于 S4 等独立阶段:不改 workflow 主链状态、不 advance。"""
    stage.status = StageStatus.running
    stage.started_at = now_iso()
    if not independent:
        wf.status = WorkflowStatus.running
        wf.current_stage = stage.stage_code
    _emit(wf.id, EventKind.stage_started, stage.stage_code)

    # S0 召回装配:显式构造 mounted_context 并记录到 stage_run + 事件流。
    mounted = context_assembler.assemble(wf, stage.stage_code)
    stage.mounted_context = mounted
    kinds = sorted({m["kind"] for m in mounted["mounted_items"]})
    _emit(
        wf.id,
        EventKind.context_mounted,
        stage.stage_code,
        {
            "stage_code": stage.stage_code,
            "mounted_count": len(mounted["mounted_items"]),
            "kinds": kinds,
            "fallback_used": mounted["fallback_used"],
            "source": mounted["source"],
        },
    )

    try:
        result = run_stage_handler(stage.stage_code, wf, mounted)
    except Exception as exc:
        stage.status = StageStatus.failed
        stage.error = str(exc)
        _emit(wf.id, EventKind.stage_failed, stage.stage_code, {"error": str(exc)})
        if not independent:  # 独立阶段失败不拖垮主链
            wf.status = WorkflowStatus.failed
            _emit(wf.id, EventKind.workflow_failed, stage.stage_code, {"error": str(exc)})
        return

    stage.output_artifact = result["artifact"]
    _emit(
        wf.id,
        EventKind.artifact_created,
        stage.stage_code,
        {
            "artifact_id": stage.output_artifact.get("artifact_id"),
            "artifact_type": stage.output_artifact.get("artifact_type"),
        },
    )
    if result["needs_review"]:
        stage.status = StageStatus.awaiting_review
        wf.status = WorkflowStatus.awaiting_review
        _emit(wf.id, EventKind.stage_awaiting_review, stage.stage_code, {"artifact": stage.output_artifact})
    else:
        stage.status = StageStatus.completed
        stage.completed_at = now_iso()
        _emit(wf.id, EventKind.stage_completed, stage.stage_code, {"artifact": stage.output_artifact})
        # 非审核阶段完成时蒸馏候选(入库前仍需 resolve)。
        if stage.stage_code == "S2.5":
            _create_viral_pattern_candidates(wf, stage)
        elif stage.stage_code == "S4":
            _create_hotspot_candidates(wf, stage)
        if not independent:
            _advance(wf, stage.stage_code)


def _advance(wf: WorkflowRun, completed_code: str) -> None:
    chain = CHAIN_L3 if wf.kind == WORKFLOW_KIND_VIDEO_PRODUCTION else CHAIN
    if completed_code not in chain:
        return
    idx = chain.index(completed_code)
    if idx + 1 < len(chain):
        nxt = _require_stage(wf.id, chain[idx + 1])
        if nxt.status == StageStatus.pending:
            _run_stage(wf, nxt)
    else:
        wf.status = WorkflowStatus.completed
        wf.current_stage = None
        _emit(wf.id, EventKind.workflow_completed)
