"""S5-S8 模拟数据，用于快速功能测试（跳过 LLM 调用）"""

MOCK_S5 = {
    "topics": [
        {
            "rank": 1,
            "title": "AI 替代程序员？我用 Cursor 写了 30 天代码，结果出乎意料",
            "angle": "从真实体验出发，打破AI替代程序员的恐慌叙事",
            "score": 9.2,
            "scores": {"hotness": 9, "relevance": 10, "videoability": 9, "differentiation": 8, "risk": 9, "opportunity": 10},
            "unique": "30天真机实测，不是云评测",
            "keywords": ["Cursor", "AI编程", "程序员", "效率"],
            "hook_idea": "开头展示AI写的bug代码翻车现场",
            "competitors_covered": ["某科技up"],
            "predicted_views": "50万-100万",
            "risk_notes": ["需要真实使用记录支撑"]
        },
        {
            "rank": 2,
            "title": "月薪3万的运营都在用的5个AI工具",
            "angle": "聚焦运营岗位实际效率工具",
            "score": 8.5,
            "scores": {"hotness": 8, "relevance": 9, "videoability": 8, "differentiation": 7, "risk": 9, "opportunity": 8},
            "unique": "按薪资段推荐，精准定位受众",
            "keywords": ["AI工具", "运营", "效率", "职场"],
            "hook_idea": "展示运营加班vs用AI准时下班对比",
            "competitors_covered": [],
            "predicted_views": "30万-60万",
            "risk_notes": []
        },
        {
            "rank": 3,
            "title": "GPT-5 来了，普通人该怎么准备",
            "angle": "不讲技术原理，只讲对普通人的影响和应对",
            "score": 7.8,
            "scores": {"hotness": 10, "relevance": 8, "videoability": 7, "differentiation": 6, "risk": 7, "opportunity": 8},
            "unique": "面向非技术人群的实用指南",
            "keywords": ["GPT-5", "人工智能", "普通人"],
            "hook_idea": "你可能不知道，GPT-5已经能做这些事了",
            "competitors_covered": ["多个科技频道"],
            "predicted_views": "80万-150万",
            "risk_notes": ["GPT-5尚未正式发布，信息可能过时"]
        },
        {
            "rank": 4,
            "title": "为什么你的AI生成图片总是很丑？3个Prompt技巧",
            "angle": "实用教程型，解决具体痛点",
            "score": 7.5,
            "scores": {"hotness": 7, "relevance": 8, "videoability": 9, "differentiation": 7, "risk": 9, "opportunity": 7},
            "unique": "对比展示丑图vs美图的prompt差异",
            "keywords": ["AI绘画", "Prompt", "Midjourney", "Stable Diffusion"],
            "hook_idea": "左边是你的图，右边是我的图",
            "competitors_covered": [],
            "predicted_views": "20万-40万",
            "risk_notes": []
        },
        {
            "rank": 5,
            "title": "我让AI帮我写了一份商业计划书，投资人看完说了3个字",
            "angle": "故事型，有悬念有结果",
            "score": 7.0,
            "scores": {"hotness": 6, "relevance": 7, "videoability": 8, "differentiation": 8, "risk": 6, "opportunity": 7},
            "unique": "真实创业场景+AI应用",
            "keywords": ["商业计划书", "AI写作", "创业"],
            "hook_idea": "投资人看完沉默了3秒，然后说了3个字",
            "competitors_covered": [],
            "predicted_views": "15万-30万",
            "risk_notes": ["需要真实故事支撑，否则显得虚假"]
        }
    ]
}

MOCK_S6 = {
    "outline": [
        {"chapter": 1, "title": "开场钩子：AI写代码翻车现场", "duration": "30s", "tension": 9, "hook": "展示一段AI生成的有bug代码", "crisis": True, "description": "用一个真实的AI翻车案例吸引注意力", "purpose": "制造认知冲突，AI真的能替代程序员吗", "transition_to_next": "但我决定给它一个真正的考验"},
        {"chapter": 2, "title": "实验设计：30天挑战规则", "duration": "45s", "tension": 7, "hook": "展示挑战规则卡片", "crisis": False, "description": "说明实验条件和评判标准", "purpose": "建立可信度，让观众知道这不是随便玩玩", "transition_to_next": "第一天，我就遇到了第一个坑"},
        {"chapter": 3, "title": "第1周：蜜月期", "duration": "60s", "tension": 5, "hook": "AI写代码的速度让人震惊", "crisis": False, "description": "展示AI辅助编码的效率提升", "purpose": "先扬后抑，为后面的反转做铺垫", "transition_to_next": "但好景不长"},
        {"chapter": 4, "title": "第2周：翻车开始", "duration": "90s", "tension": 9, "hook": "一个看似简单的bug花了3天", "crisis": True, "description": "展示AI代码的隐藏问题和调试困难", "purpose": "核心观点：AI写的代码出了问题更难排查", "transition_to_next": "最崩溃的是第3周"},
        {"chapter": 5, "title": "第3周：崩溃与突破", "duration": "90s", "tension": 8, "hook": "差点放弃的那一刻", "crisis": True, "description": "低谷到转折的过程", "purpose": "情绪低谷后的反弹，增加故事张力", "transition_to_next": "最后一周的结果让我彻底改变了看法"},
        {"chapter": 6, "title": "第4周：最终结果", "duration": "60s", "tension": 7, "hook": "最终代码质量对比数据", "crisis": False, "description": "用数据说话，展示30天的成果", "purpose": "给观众一个明确的结论", "transition_to_next": "所以我的结论是"},
        {"chapter": 7, "title": "总结：AI不会替代你，但会用AI的人会", "duration": "45s", "tension": 6, "hook": "金句输出", "crisis": False, "description": "升华主题，给出实用建议", "purpose": "让观众有收获感，愿意转发", "transition_to_next": ""},
    ],
    "total_duration": "6min30s",
    "crisis_points": [1, 4, 5],
    "climax_position": "57%"
}

MOCK_S7 = """# AI 替代程序员？我用 Cursor 写了 30 天代码，结果出乎意料

## 第1章：开场钩子（30s）

大家好，今天我要跟你们分享一个让我又爱又恨的30天经历。

[画面: 屏幕录制，一段AI生成的代码，红色错误提示不断弹出]

你们看这段代码，AI写的，看起来很完美对吧？但运行起来，bug一个接一个。这就是我用Cursor写代码30天的日常。

但结果呢？出乎所有人的意料。

## 第2章：实验设计（45s）

[画面: 挑战规则卡片动画]

我的规则很简单：
- 所有代码必须用Cursor生成
- 可以修改但不能从零手写
- 每天记录效率和bug数量
- 最后对比代码质量

[危机点] 就是这么一个简单的挑战，差点让我崩溃。

## 第3章：第1周——蜜月期（60s）

[画面: 快速编码的屏幕录制]

第一周简直太爽了。以前要写2小时的代码，Cursor 20分钟搞定。我甚至开始怀疑自己以前是不是在浪费时间。

效率提升了3倍，bug率还很低。我当时想，程序员真的要失业了。

## 第4章：第2周——翻车开始（90s）

[画面: 调试界面，时间显示凌晨3点]

但好景不长。第二周开始，一个看似简单的功能，AI生成的代码怎么跑都不对。

[危机点] 我花了整整3天去debug一段AI写的代码。你知道最崩溃的是什么吗？代码看起来完全正确，逻辑也说得通，但就是不对。

最后发现是一个隐含的类型转换问题。如果是人写的代码，我一眼就能看出来。但AI写的代码，我反而失去了直觉。

## 第5章：第3周——崩溃与突破（90s）

[画面: 对话框显示"确定要放弃吗？"]

第三周我差点放弃。每天都在和AI生成的代码搏斗。

[危机点] 但转折点来了——我改变了使用方式。不再让AI写完整功能，而是让它写小块代码，我来组装。

这个改变，让效率翻了一倍。

## 第6章：第4周——最终结果（60s）

[画面: 数据对比图表]

30天结束，数据说话：
- 总代码量：12,000行
- AI生成占比：85%
- Bug率：比手写低15%
- 开发效率：提升2.5倍

结论：AI不会替代程序员，但会让程序员的工作方式彻底改变。

## 第7章：总结（45s）

[画面: 金句卡片]

记住这句话：AI不会替代你，但会用AI的人会。

如果你觉得这个视频有帮助，点个赞，我们下期见。
"""

MOCK_S8 = {
    "roles": [
        {
            "name": "杠精",
            "emoji": "😤",
            "focus": "事实准确性、逻辑漏洞、数据来源",
            "score": 6,
            "issues": [
                {"severity": "medium", "description": "效率提升3倍缺乏具体数据支撑，不同项目差异很大", "suggestion": "补充具体项目的前后对比数据"},
                {"severity": "low", "description": "bug率低15%的统计方法未说明", "suggestion": "说明是按什么标准统计的bug"},
            ],
            "suggestions": ["建议补充实验的局限性说明", "12000行代码的项目复杂度需要说明"],
            "highlights": ["30天持续测试有说服力", "翻车→突破的叙事结构好"],
            "summary": "核心观点有说服力，但数据支撑不足，部分结论过于绝对。建议补充实验条件和局限性说明。"
        },
        {
            "name": "同行",
            "emoji": "🧑‍💻",
            "focus": "技术准确性、工具使用方法",
            "score": 7,
            "issues": [
                {"severity": "low", "description": "Cursor的功能描述偏简单，实际能力更强", "suggestion": "可以展示更多Cursor高级功能"},
            ],
            "suggestions": ["加入代码review环节展示AI代码质量", "可以对比不同AI编程工具"],
            "highlights": ["使用方式转变的洞察很有价值", "小块代码组装的建议实用"],
            "summary": "技术内容基本准确，对AI编程工具的使用建议有参考价值。可以深入技术细节。"
        },
        {
            "name": "小白",
            "emoji": "😶",
            "focus": "是否容易理解、术语是否通俗",
            "score": 8,
            "issues": [
                {"severity": "low", "description": "类型转换问题的解释不够通俗", "suggestion": "用更生活化的比喻解释"},
            ],
            "suggestions": ["开头可以用更通俗的比喻解释AI编程"],
            "highlights": ["故事性强，容易跟下去", "结论明确，不会看完不知道说什么"],
            "summary": "整体易懂，故事线清晰。少数技术术语需要更通俗的解释。"
        },
        {
            "name": "老粉",
            "emoji": "❤️",
            "focus": "人设一致性、观众期待",
            "score": 8,
            "issues": [],
            "suggestions": ["可以加入频道一贯的幽默元素"],
            "highlights": ["保持了实测风格", "数据说话的方式符合频道调性"],
            "summary": "内容风格与频道定位一致，观众应该会喜欢这种实测型内容。"
        },
        {
            "name": "合规",
            "emoji": "⚖️",
            "focus": "平台政策、版权、敏感内容",
            "score": 9,
            "issues": [],
            "suggestions": ["注意不要出现其他产品的负面商标"],
            "highlights": ["没有敏感内容", "引用工具名属于合理使用"],
            "summary": "内容合规，无平台风险。"
        }
    ],
    "average_score": 7.6,
    "synthesis": {
        "top_issues": ["数据支撑不足需要补充", "部分技术解释不够通俗"],
        "all_highlights": ["30天实测有说服力", "故事结构好", "结论实用"],
        "issue_count": {"high": 0, "medium": 1, "low": 4}
    }
}
