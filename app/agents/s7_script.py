"""S7 脚本 Agent：根据大纲生成完整口播脚本"""

import uuid
from datetime import datetime, timezone
from app.llm import chat
from app.pipeline import PipelineState
from app.utils import build_config_instructions, get_config

SYSTEM_PROMPT = open("app/prompts/s7_script.txt", encoding="utf-8").read()

# 对齐文档 §2.3 配置 keys
CONFIG_MAPPING = [
    ('spoken_style_bans', '额外禁用词', None),
    ('one_twist_per_chapter', '每章至少包含1个反预期转折点', {True: '是', False: '否'}),
    ('hook_every_2_3_min', '每2-3分钟设置一个留人钩子', {True: '是', False: '否'}),
    # 兼容旧 key
    ('banned_words', '额外禁用词', None),
    ('crisis_per_chapter', '每章至少包含1个反预期转折点', {True: '是', False: '否'}),
    ('crisis_hook_interval', '每2-3分钟设置一个留人钩子', {True: '是', False: '否'}),
]


def _build_user_content(state: PipelineState) -> str:
    cfg_text = build_config_instructions(get_config(state), CONFIG_MAPPING)
    outline = state.outline_data
    outline_text = ""
    for ch in outline.get("outline", []):
        crisis_mark = " [危机点]" if ch.get("crisis") else ""
        outline_text += f"第{ch.get('chapter', '?')}章: {ch.get('title', '')} ({ch.get('duration', '?')}) 张力{ch.get('tension', '?')}/10{crisis_mark}\n"
        outline_text += f"  {ch.get('description', '')}\n\n"
    return f"""## 视频大纲
{outline_text}

## 选题
{state.selected_topic.get('title', '')} - {state.selected_topic.get('angle', '')}

{cfg_text}

请根据大纲生成完整的口播脚本。"""


def run(state: PipelineState) -> dict:
    """返回 artifact dict（对齐文档 §3 S7 schema：{excerpt, body_md, word_count}）"""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_content(state)},
    ]
    script_text = chat(messages, temperature=0.7, max_tokens=32768)
    # 包装为 artifact dict
    return {
        "artifact_id": f"art_{uuid.uuid4().hex[:8]}",
        "artifact_type": "script",
        "stage_code": "S7",
        "produced_at": datetime.now(timezone.utc).isoformat(),
        "excerpt": script_text[:200],  # 前端预览
        "body_md": script_text,        # 全文（供 S8/S9 使用）
        "word_count": len(script_text),
        "script": script_text,         # 兼容旧字段
    }


def re_run_with_feedback(state: PipelineState, feedback: str, old_script: str = None) -> str:
    script = old_script or state.script_data or ""
    user_content = f"""## 当前脚本
{script}

## 对抗审核反馈（需要修补的问题）
{feedback}

请根据反馈修补脚本，保留整体结构，只修复被指出的问题。"""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    return chat(messages, temperature=0.6, max_tokens=32768)
