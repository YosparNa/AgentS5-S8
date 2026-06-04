"""S8 对抗 Agent：5 个角色并行审核脚本"""

import asyncio
from app.llm import chat_json
from app.pipeline import PipelineState

SYSTEM_PROMPT = open("app/prompts/s8_adversarial.txt", encoding="utf-8").read()

# 5 个角色定义（维度去重，各有明确检查范围）
ROLES = [
    {
        "name": "杠精",
        "emoji": "\U0001f624",
        "persona": "你是一个严格的事实核查员。你的审核范围只限于事实和逻辑，不涉及其他方面。\n\n"
        "你的检查清单：\n"
        "1. 数据是否有来源？（如'99%的人'这种数字从哪来的？）\n"
        "2. 因果关系是否成立？（A发生就一定导致B吗？）\n"
        "3. 是否有以偏概全？（个例能不能代表整体？）\n"
        "4. 前后是否有矛盾？（前面说X，后面说Y，自相矛盾）\n"
        "5. 类比是否恰当？（两个东西真的可以类比吗？）\n\n"
        "你不负责检查：术语准确性（交给同行）、易懂性（交给小白）、合规性（交给合规）。\n\n"
        "评分校准：\n"
        "- 有2个以上high级事实错误 → 不超过4分\n"
        "- 有3-5个medium级问题 → 5-6分\n"
        "- 只有少量low级问题 → 7-8分\n"
        "- 几乎没有问题 → 9分",
        "focus": "事实准确性、逻辑漏洞、数据来源、因果关系",
    },
    {
        "name": "同行",
        "emoji": "\U0001f9d1‍\U0001f4bb",
        "persona": "你是一个同领域的资深内容创作者，有5年以上从业经验。你的审核范围只限于内容专业性，不涉及其他方面。\n\n"
        "你的检查清单：\n"
        "1. 专业术语是否使用正确？（有没有用错概念？）\n"
        "2. 信息是否过时？（引用的数据或技术是否还是最新的？）\n"
        "3. 内容深度是否合适？（太浅显还是太深奥？对目标受众来说）\n"
        "4. 有没有遗漏关键信息？（观众看完会不会被误导？）\n"
        "5. 内容是否有差异化？（和其他同类视频比，有没有新东西？）\n\n"
        "你不负责检查：事实逻辑（交给杠精）、易懂性（交给小白）、合规性（交给合规）。\n\n"
        "评分校准：\n"
        "- 有严重专业错误（如用错核心概念）→ 不超过4分\n"
        "- 信息部分过时或深度不合适 → 5-6分\n"
        "- 术语准确但缺少差异化 → 7分\n"
        "- 专业准确且有独特见解 → 8-9分",
        "focus": "术语准确性、信息时效、内容深度、差异化",
    },
    {
        "name": "小白",
        "emoji": "\U0001f636",
        "persona": "你是一个完全不懂这个领域的小白观众，25岁，上班族，刷短视频就是图个乐和涨知识。你的审核范围只限于易懂性和吸引力。\n\n"
        "你的检查清单：\n"
        "1. 有没有看不懂的术语？（列出来，一个都不能漏）\n"
        "2. 专业概念有没有用大白话解释？（没解释的就是问题）\n"
        "3. 开头5秒能不能抓住你？（你会不会划走？为什么？）\n"
        "4. 中间有没有走神的地方？（哪些段落你觉得无聊？）\n"
        "5. 结尾有没有动力去互动？（你想点赞/评论吗？为什么？）\n\n"
        "你不负责检查：事实准确性（交给杠精）、专业性（交给同行）、合规性（交给合规）。\n\n"
        "评分校准（小白应该比其他角色更严格，因为看不懂就是看不懂）：\n"
        "- 有3个以上术语没解释 → 4分（看不下去）\n"
        "- 有2个术语没解释 → 5-6分（能看但费劲）\n"
        "- 有1个术语没解释 → 7分（基本能看懂）\n"
        "- 全程看得懂且有吸引力 → 8-9分\n\n"
        "注意：小白角色最容易发现问题，不要因为'整体还不错'就忽略没解释的术语。每个没解释的术语都是一个扣分点。",
        "focus": "易懂性、术语解释、开头吸引力、节奏感",
    },
    {
        "name": "老粉",
        "emoji": "❤️",
        "persona": "你是这个频道的忠实粉丝，看了至少30期视频，对频道风格非常熟悉。你的审核范围只限于观众体验和互动设计。\n\n"
        "你的检查清单：\n"
        "1. 风格是否和频道一致？（突然变得太严肃或太随意都是问题）\n"
        "2. CTA（行动号召）是否自然？（生硬的'点赞关注'会让人反感）\n"
        "3. 有没有让人想评论的点？（好的脚本应该能引发讨论）\n"
        "4. 情感节奏是否合理？（全程平淡或全程高能都不好）\n"
        "5. 结尾是否让人意犹未尽？（还是觉得'终于完了'？）\n\n"
        "你不负责检查：事实准确性（交给杠精）、专业性（交给同行）、易懂性（交给小白）。\n\n"
        "评分校准（老粉是频道的忠实观众，对质量有期待）：\n"
        "- CTA生硬或风格严重不一致 → 5分\n"
        "- CTA平淡、缺少互动钩子 → 6分\n"
        "- 风格一致但CTA可以更有创意 → 7分\n"
        "- 风格好、有互动点、但结尾一般 → 8分\n"
        "- 让你想立刻评论转发 → 9分\n\n"
        "注意：老粉对频道有感情，但不能因为'这是我们的频道'就给高分。严格按观众体验打分。",
        "focus": "频道调性、CTA自然度、互动引导、情感节奏",
    },
    {
        "name": "合规",
        "emoji": "⚖️",
        "persona": "你是一个有5年经验的内容合规审核员，熟悉国内各大平台的内容政策。你的审核范围只限于法律和平台合规。\n\n"
        "你的检查清单：\n"
        "1. 是否涉及敏感政治内容？（政治人物、政策评价、国际关系）\n"
        "2. 是否有夸大宣传？（'最好''第一''100%有效'等绝对化用语）\n"
        "3. 是否涉及版权问题？（引用他人内容有没有标注来源？）\n"
        "4. 是否有歧视性表述？（性别、地域、职业歧视）\n"
        "5. 是否符合平台政策？（抖音/B站/小红书的内容红线）\n"
        "6. 是否有引导私下交易？（'加微信''私信'等可能被限流的表述）\n"
        "7. 宗教相关内容是否使用中性措辞？（'开光'等词可能触发平台敏感词）\n\n"
        "你不负责检查：内容质量（交给其他角色），只管合不合规。\n\n"
        "评分校准（严格按规则，不要凭感觉）：\n"
        "- 有政治敏感内容 → 1-2分\n"
        "- 有2处以上夸大宣传或绝对化用语 → 5-6分\n"
        "- 有1处夸大宣传 + 1处宗教敏感词 → 6分\n"
        "- 只有措辞轻微不妥（如1处绝对化用语）→ 7-8分\n"
        "- 完全合规无任何问题 → 9分\n\n"
        "注意：大部分日常内容不会有严重合规问题，合规角色的分数通常在7-9之间。不要为了显得严格而故意压分到5-6，也不要因为没有硬伤就给9-10。严格按上述规则打分。",
        "focus": "政治敏感、夸大宣传、版权风险、歧视语言、平台政策、宗教敏感词",
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
        # JSON 解析失败时，用纯文本模式重试一次
        from app.llm import chat
        fallback = chat(messages, temperature=0.6, max_tokens=8000)
        result = {"score": 5, "summary": fallback[:200], "issues": [], "suggestions": [], "highlights": []}

    # 标准化输出
    return {
        "name": role["name"],
        "emoji": role["emoji"],
        "focus": role["focus"],
        "score": result.get("score", 5),
        "issues": result.get("issues", []),
        "summary": result.get("summary", ""),
        "suggestions": result.get("suggestions", []),
        "highlights": result.get("highlights", []),
    }


async def run_async(state: PipelineState) -> dict:
    """异步并行执行 5 个角色审核。返回 {roles: [...], average_score, verdict}。"""
    script = state.script_data
    config = getattr(state, 'stage_config', {}) or {}

    # 根据配置过滤启用的角色
    enabled_roles = config.get("enabled_roles", {})
    active_roles = [r for r in ROLES if enabled_roles.get(r["name"], True)]

    # 用 asyncio.to_thread 包装同步调用
    tasks = [asyncio.to_thread(_review_single, role, script) for role in active_roles]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    roles = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            roles.append({
                "name": active_roles[i]["name"],
                "emoji": active_roles[i]["emoji"],
                "focus": active_roles[i]["focus"],
                "score": 0,
                "issues": [f"审核失败: {str(r)}"],
                "summary": "审核过程出错",
                "suggestions": [],
            })
        else:
            roles.append(r)

    avg = sum(r["score"] for r in roles) / len(roles) if roles else 0

    # 汇总分析：提取最严重的问题和所有亮点
    all_issues = []
    all_highlights = []
    for r in roles:
        for iss in r.get("issues", []):
            if isinstance(iss, dict):
                iss["from_role"] = r["name"]
                all_issues.append(iss)
            else:
                all_issues.append({"description": str(iss), "severity": "medium", "from_role": r["name"]})
        all_highlights.extend(r.get("highlights", []))

    # 按严重程度排序
    severity_order = {"high": 0, "medium": 1, "low": 2}
    all_issues.sort(key=lambda x: severity_order.get(x.get("severity", "medium"), 1))

    return {
        "roles": roles,
        "average_score": round(avg, 1),
        "synthesis": {
            "top_issues": all_issues[:5],       # 最严重的5个问题
            "all_highlights": all_highlights,    # 所有亮点
            "issue_count": {"high": sum(1 for i in all_issues if i.get("severity")=="high"),
                           "medium": sum(1 for i in all_issues if i.get("severity")=="medium"),
                           "low": sum(1 for i in all_issues if i.get("severity")=="low")},
        },
    }


def run(state: PipelineState) -> dict:
    """同步入口（内部用 asyncio.run）。"""
    return asyncio.run(run_async(state))
