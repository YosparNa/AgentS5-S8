"""S8 对抗 Agent：5 个角色并行审核脚本"""

import asyncio
import uuid
from datetime import datetime, timezone
from app.llm import chat_json
from app.pipeline import PipelineState

SYSTEM_PROMPT = open("app/prompts/s8_adversarial.txt", encoding="utf-8").read()

# 文档 §2.3 S8 配置 keys（权威清单）：role_key → 中文名
ROLES = [
    {
        "role_key": "nitpicker",
        "name": "杠精",
        "emoji": "\U0001f624",
        "persona": "你是一个严格的事实核查员。你的审核范围只限于事实和逻辑。\n\n"
        "检查清单：\n"
        "1. 数据是否有来源？\n"
        "2. 因果关系是否成立？\n"
        "3. 是否有以偏概全？\n"
        "4. 前后是否有矛盾？\n"
        "5. 类比是否恰当？\n\n"
        "评分校准：\n"
        "- 有2个以上high级事实错误 → 不超过4分\n"
        "- 有3-5个medium级问题 → 5-6分\n"
        "- 只有少量low级问题 → 7-8分\n"
        "- 几乎没有问题 → 9分",
        "focus": "事实准确性、逻辑漏洞、数据来源、因果关系",
    },
    {
        "role_key": "peer",
        "name": "同行",
        "emoji": "\U0001f9d1‍\U0001f4bb",
        "persona": "你是一个同领域的资深内容创作者。审核范围只限于内容专业性。\n\n"
        "检查清单：\n"
        "1. 专业术语是否正确？\n"
        "2. 信息是否过时？\n"
        "3. 内容深度是否合适？\n"
        "4. 有没有遗漏关键信息？\n"
        "5. 内容是否有差异化？",
        "focus": "术语准确性、信息时效、内容深度、差异化",
    },
    {
        "role_key": "novice",
        "name": "小白",
        "emoji": "\U0001f636",
        "persona": "你是一个完全不懂这个领域的小白观众。审核范围只限于易懂性和吸引力。\n\n"
        "检查清单：\n"
        "1. 有没有听不懂的术语？\n"
        "2. 有没有看不懂的逻辑？\n"
        "3. 开头能不能吸引我？\n"
        "4. 看完我能记住什么？\n"
        "5. 我会不会划走？在哪划走？",
        "focus": "易懂性、吸引力、术语解释、留存",
    },
    {
        "role_key": "fan",
        "name": "老粉",
        "emoji": "❤️",
        "persona": "你是这个频道的老粉丝，看了50期以上。审核范围只限于人设一致性和粉丝体验。\n\n"
        "检查清单：\n"
        "1. 语气和以前一样吗？\n"
        "2. 有没有说以前反对的话？\n"
        "3. CTA 我会不会响应？\n"
        "4. 和往期比质量如何？\n"
        "5. 我会不会转发？",
        "focus": "人设一致性、粉丝体验、CTA有效性",
    },
    {
        "role_key": "compliance",
        "name": "合规",
        "emoji": "⚖️",
        "persona": "你是一个内容合规审核员。审核范围只限于法律风险和平台政策。\n\n"
        "检查清单：\n"
        "1. 有没有政治敏感内容？\n"
        "2. 有没有夸大宣传或绝对化用语？\n"
        "3. 有没有版权风险？\n"
        "4. 有没有歧视性语言？\n"
        "5. 有没有宗教敏感词？\n\n"
        "评分校准：\n"
        "- 有政治敏感内容 → 1-2分\n"
        "- 有2处以上夸大宣传 → 5-6分\n"
        "- 只有措辞轻微不妥 → 7-8分\n"
        "- 完全合规 → 9分",
        "focus": "政治敏感、夸大宣传、版权风险、歧视语言、平台政策",
    },
]


def _review_single(role: dict, script: str) -> dict:
    """单个角色审核脚本。"""
    user_content = f"""## 待审核脚本
{script}

请以「{role['name']}」的身份审核这个脚本，给出你的发现。"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + role["persona"]},
        {"role": "user", "content": user_content},
    ]

    try:
        result = chat_json(messages, temperature=0.6, max_tokens=8000)
    except Exception:
        from app.llm import chat
        fallback = chat(messages, temperature=0.6, max_tokens=8000)
        result = {"score": 5, "summary": fallback[:200], "issues": [], "suggestions": [], "highlights": []}

    # 文档 §3 S8 artifact：{role_key, name, issues, note, avatar?}
    return {
        "role_key": role["role_key"],
        "name": role["name"],
        "avatar": role["emoji"],
        "score": result.get("score", 5),
        "issues": result.get("issues", []),
        "note": result.get("summary", ""),
        "suggestions": result.get("suggestions", []),
        "highlights": result.get("highlights", []),
    }


async def run_async(state: PipelineState) -> dict:
    """异步并行执行 5 个角色审核。"""
    script = state.script_data
    config = getattr(state, 'stage_config', {}) or {}

    enabled_roles = config.get("enabled_roles", {})
    active_roles = [r for r in ROLES if enabled_roles.get(r["role_key"], True)]

    tasks = [asyncio.to_thread(_review_single, role, script) for role in active_roles]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    roles = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            roles.append({
                "role_key": active_roles[i]["role_key"],
                "name": active_roles[i]["name"],
                "avatar": active_roles[i]["emoji"],
                "score": 0,
                "issues": [f"审核失败: {str(r)}"],
                "note": "审核过程出错",
                "suggestions": [],
                "highlights": [],
            })
        else:
            roles.append(r)

    avg = sum(r["score"] for r in roles) / len(roles) if roles else 0

    return {
        "roles": roles,
        "average_score": round(avg, 1),
    }


def run(state: PipelineState) -> dict:
    """文档 §3 S8 artifact：{roles[{role_key, name, issues, note, avatar?}]}"""
    result = asyncio.run(run_async(state))
    return {
        "artifact_id": f"art_{uuid.uuid4().hex[:8]}",
        "artifact_type": "adversarial_review",
        "stage_code": "S8",
        "produced_at": datetime.now(timezone.utc).isoformat(),
        **result,
    }
