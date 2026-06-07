"""S5 选题 Agent：分析数据 → 生成 5 个候选选题"""

import uuid
from datetime import datetime, timezone
from app.llm import chat_json
from app.pipeline import PipelineState
from app.utils import build_config_instructions, get_config

SYSTEM_PROMPT = open("app/prompts/s5_topic.txt", encoding="utf-8").read()

# 对齐文档 §2.3 配置 keys
CONFIG_MAPPING = [
    ('exclude_shock_title', '排除震惊体标题', {True: '是', False: '否'}),
    ('exclude_empty_buzzwords', '排除假大空内容', {True: '是', False: '否'}),
    ('exclude_ai_filler', '排除AI套话', {True: '是', False: '否'}),
    ('cognitive_conflict', '认知冲突权重', None),
    ('resonance', '共鸣度权重', None),
    ('crisis', '危机感权重', None),
    ('curiosity', '好奇驱动权重', None),
    # 兼容旧 key
    ('avoid_shock', '排除震惊体标题', {True: '是', False: '否'}),
    ('avoid_empty', '排除假大空内容', {True: '是', False: '否'}),
    ('avoid_ai', '排除AI套话', {True: '是', False: '否'}),
    ('emotion_conflict', '认知冲突权重', None),
    ('emotion_resonance', '共鸣度权重', None),
    ('emotion_crisis', '危机感权重', None),
    ('emotion_curiosity', '好奇驱动权重', None),
]


def _build_user_content(state: PipelineState) -> str:
    cfg_text = build_config_instructions(get_config(state), CONFIG_MAPPING)
    return f"""## 用户输入数据
{state.user_data}

## 频道定位
{state.channel_desc}

{cfg_text}

请根据以上数据生成 5 个候选选题。"""


def _normalize_topic(t: dict, rank: int) -> dict:
    """对齐文档 §3 S5 artifact schema：{rank, title, score, locked, unique, ...}"""
    return {
        "rank": t.get("rank", rank),
        "title": t.get("title", ""),
        "score": t.get("score", 0),
        "locked": t.get("locked", rank == 1),
        "unique": t.get("unique", ""),
        # 建议补充字段
        "angle": t.get("angle", ""),
        "keywords": t.get("keywords", []),
        "scores": t.get("scores", {}),
        "hook_idea": t.get("hook_idea", t.get("hookIdea", "")),
        "competitors_covered": t.get("competitors_covered", t.get("competitorsCovered", [])),
        "predicted_views": t.get("predicted_views", t.get("predictedViews", "")),
        "risk_notes": t.get("risk_notes", t.get("riskNotes", [])),
    }


def run(state: PipelineState) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_content(state)},
    ]
    result = chat_json(messages, temperature=0.8, max_tokens=32768)
    if "topics" not in result:
        result = {"topics": result.get("topics", result.get("candidates", []))}
    # 标准化 topic 字段
    result["topics"] = [_normalize_topic(t, i+1) for i, t in enumerate(result.get("topics", []))]
    # 包装 artifact 信封
    return {
        "artifact_id": f"art_{uuid.uuid4().hex[:8]}",
        "artifact_type": "topic_candidates",
        "stage_code": "S5",
        "produced_at": datetime.now(timezone.utc).isoformat(),
        **result,
    }


def re_run_with_feedback(state: PipelineState, feedback: str) -> dict:
    user_content = f"""## 用户输入数据
{state.user_data}

## 频道定位
{state.channel_desc}

## 上一轮对抗审核的反馈（需要改进的方向）
{feedback}

请根据反馈重新生成 5 个候选选题，避免上一轮的问题。"""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    result = chat_json(messages, temperature=0.8, max_tokens=32768)
    if "topics" not in result:
        result = {"topics": result.get("topics", result.get("candidates", []))}
    return result
