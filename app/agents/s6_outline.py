"""S6 大纲 Agent：根据选题生成视频大纲"""

from app.llm import chat_json
from app.pipeline import PipelineState
from app.utils import build_config_instructions, get_config

SYSTEM_PROMPT = open("app/prompts/s6_outline.txt", encoding="utf-8").read()

CONFIG_MAPPING = [
    ('hook_type', '钩子类型', {
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


def run(state: PipelineState) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_content(state)},
    ]
    result = chat_json(messages, temperature=0.7, max_tokens=32768)
    if "outline" not in result:
        result = {"outline": result.get("chapters", result.get("sections", []))}
    return result


def re_run_with_feedback(state: PipelineState, feedback: str) -> dict:
    topic = state.selected_topic
    user_content = f"""## 锁定选题
- 标题: {topic.get('title', '')}
- 角度: {topic.get('angle', '')}

## 上一轮对抗审核反馈
{feedback}

请根据反馈调整大纲结构，修复被指出的问题。"""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    result = chat_json(messages, temperature=0.7, max_tokens=32768)
    if "outline" not in result:
        result = {"outline": result.get("chapters", result.get("sections", []))}
    return result


def regen_chapter(state: PipelineState, old_chapter: dict, index: int, total: int, feedback: str = "") -> dict:
    """重新生成单个章节，支持 feedback 改进模式。"""
    topic = state.selected_topic
    outline = state.outline_data.get("outline", [])
    surrounding = []
    if index > 0:
        surrounding.append(f"上一章: {outline[index-1].get('title','')}")
    if index < total - 1:
        surrounding.append(f"下一章: {outline[index+1].get('title','')}")

    feedback_section = ""
    if feedback:
        feedback_section = f"""

## 需要改进的问题
{feedback}

请针对以上问题改进这个章节，保留优点，修复不足。"""

    user_content = f"""## 选题
{topic.get('title', '')} - {topic.get('angle', '')}

## 当前章节（第{index+1}章，共{total}章）
标题: {old_chapter.get('title','')}
描述: {old_chapter.get('description','')}
{f"钩子: {old_chapter.get('hook','')}" if old_chapter.get('hook') else ""}

## 上下文
{chr(10).join(surrounding)}
{feedback_section}

请重新生成这一个章节，保持与上下文的衔接。返回单个章节的 JSON 对象（不是数组），格式：
{{"chapter": {index+1}, "title": "...", "duration": "...", "tension": N, "hook": "...", "crisis": false, "purpose": "...", "description": "...", "transition_to_next": "...", "pros": ["..."], "cons": ["..."]}}"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    result = chat_json(messages, temperature=0.7, max_tokens=4000)
    result["chapter"] = index + 1
    return result
