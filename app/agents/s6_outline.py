"""S6 大纲 Agent：根据选题生成视频大纲"""

import uuid
from datetime import datetime, timezone
from app.llm import chat_json
from app.pipeline import PipelineState
from app.utils import build_config_instructions, get_config

SYSTEM_PROMPT = open("app/prompts/s6_outline.txt", encoding="utf-8").read()

# 文档 §2.3 S6 配置 keys（权威清单）
CONFIG_MAPPING = [
    ('hook_type', '钩子策略', {
        'counterintuitive': '用反常识/颠覆认知的方式开头',
        'conflict_suspense': '用冲突/悬念的方式开头',
        'number_impact': '用具体数字/数据冲击开头',
        'visual_promise': '用画面承诺开头',
    }),
    ('crisis_density', '危机点密度', None),
    ('climax_pct', '高潮位置百分比', None),
    ('chapter_count', '章节数', None),
]


def _build_user_content(state: PipelineState) -> str:
    cfg_text = build_config_instructions(get_config(state), CONFIG_MAPPING)
    topic = state.selected_topic
    return f"""## 锁定选题
- 标题: {topic.get('title', '')}
- 角度: {topic.get('angle', '')}
- 评分: {topic.get('score', '')}
- 差异化: {topic.get('unique', '')}

## 频道定位
{state.channel_desc}

{cfg_text}

请根据以上选题生成视频大纲。"""


def _normalize_chapter(ch: dict) -> dict:
    """文档 §3 S6 artifact：{ch, dur, tension, hook?, crisis?}"""
    return {
        "ch": ch.get("ch", ch.get("title", "")),
        "dur": ch.get("dur", ch.get("duration", "")),
        "tension": ch.get("tension", 5),
        "hook": ch.get("hook", ""),
        "crisis": ch.get("crisis", False),
        # 建议补充
        "description": ch.get("description", ""),
        "purpose": ch.get("purpose", ""),
        "transition_to_next": ch.get("transition_to_next", ""),
        "pros": ch.get("pros", []),
        "cons": ch.get("cons", []),
    }


def run(state: PipelineState) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_content(state)},
    ]
    result = chat_json(messages, temperature=0.7, max_tokens=32768)
    if "outline" not in result:
        result = {"outline": result.get("chapters", [])}
    result["outline"] = [_normalize_chapter(ch) for ch in result.get("outline", [])]
    return {
        "artifact_id": f"art_{uuid.uuid4().hex[:8]}",
        "artifact_type": "outline",
        "stage_code": "S6",
        "produced_at": datetime.now(timezone.utc).isoformat(),
        **result,
    }


def re_run_with_feedback(state: PipelineState, feedback: str) -> dict:
    topic = state.selected_topic
    user_content = f"""## 锁定选题
- 标题: {topic.get('title', '')}
- 角度: {topic.get('angle', '')}

## 上一轮对抗审核反馈
{feedback}

请根据反馈调整大纲结构。"""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    result = chat_json(messages, temperature=0.7, max_tokens=32768)
    if "outline" not in result:
        result = {"outline": result.get("chapters", [])}
    result["outline"] = [_normalize_chapter(ch) for ch in result.get("outline", [])]
    return {
        "artifact_id": f"art_{uuid.uuid4().hex[:8]}",
        "artifact_type": "outline",
        "stage_code": "S6",
        "produced_at": datetime.now(timezone.utc).isoformat(),
        **result,
    }


def regen_chapter(state: PipelineState, old_chapter: dict, index: int, total: int, feedback: str = "") -> dict:
    if feedback:
        user_content = f"""## 当前章节
{old_chapter.get('ch', '')}: {old_chapter.get('description', '')}

## 需要改进的问题
{feedback}

请重新生成这个章节，修复上述问题。"""
    else:
        user_content = f"""## 原章节
{old_chapter.get('ch', '')}: {old_chapter.get('description', '')}

请全新重做这个章节，不要参考原内容。"""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    result = chat_json(messages, temperature=0.7, max_tokens=8000)
    return _normalize_chapter(result)
