// mock 数据 — 经验库 F1
// PROTO 行 2533–2558 (09index-v7.html): 3 exact rules + 9 D-B fill = 12 total
// category 枚举键: title | hook | script | storyboard | other
// 分布: 标题3 / 钩子2 / 脚本结构4(script) / 分镜技能3(storyboard)
import type { KnowledgeRule, KnowledgeRuleCandidate } from "@/types";

export const KNOWLEDGE_RULES: KnowledgeRule[] = [
  // ── PROTO 精确行 ──
  {
    id: "kr01",
    code: "Rule_Hk_01",
    title: "反常识开场白结构",
    desc: '"你以为 X，其实是 Y" — 推翻共识开场，3 秒抓人',
    metric: "完播 +15%",
    meta: "已验证 36 条 · 复用 22 次 · 跨 3 个频道",
    category: "hook",
  },
  {
    id: "kr02",
    code: "Rule_Title_04",
    title: "冲突型标题套路",
    desc: "别再 X，真正值钱的是 Y",
    metric: "CTR +28%",
    meta: "适用工具分析类 · 不适教程类",
    category: "title",
  },
  {
    id: "kr03",
    code: "Skill_Storyboard_02",
    title: "UI 对照分镜模板",
    desc: "左右分屏 + 红箭头标记，技术对比视频专用",
    metric: "复用 18 次",
    meta: "本视频 S9 正在使用",
    category: "storyboard",
  },
  // ── D-B 填充: 标题规则 (补 2 条凑满 3) ──
  {
    id: "kr04",
    code: "Rule_Title_01",
    title: "数字量化标题法",
    desc: "用具体数字替代模糊描述，如「7 个技巧」比「若干技巧」CTR 高",
    metric: "CTR +19%",
    meta: "适用教程类 · 已验证 24 条",
    category: "title",
  },
  {
    id: "kr05",
    code: "Rule_Title_07",
    title: "问句悬念标题",
    desc: "以疑问句收尾，引发好奇心点击，搭配封面数字效果更佳",
    metric: "CTR +22%",
    meta: "跨 2 个频道 · 复用 14 次",
    category: "title",
  },
  // ── D-B 填充: 钩子规则 (补 1 条凑满 2) ──
  {
    id: "kr06",
    code: "Rule_Hk_03",
    title: "痛点放大钩子",
    desc: "开头直接说出用户最痛的问题，再给出本视频的解法预告",
    metric: "完播 +11%",
    meta: "已验证 18 条 · 适用教程/测评类",
    category: "hook",
  },
  // ── D-B 填充: 脚本结构 (4 条) ──
  {
    id: "kr07",
    code: "Rule_Script_01",
    title: "三段 PASS 脚本框架",
    desc: "问题（P）→ 放大（A）→ 解法（S）→ 召唤行动（S），完整闭环",
    metric: "完播 +9%",
    meta: "适用工具评测类 · 复用 31 次",
    category: "script",
  },
  {
    id: "kr08",
    code: "Rule_Script_02",
    title: "对比测试脚本结构",
    desc: "同一任务 A vs B，平行结构展示差异，结尾给出主观推荐",
    metric: "互动 +17%",
    meta: "跨 3 个频道 · 适用 AI 工具横评",
    category: "script",
  },
  {
    id: "kr09",
    code: "Rule_Script_03",
    title: "实操演示脚本节奏",
    desc: "每 90 秒插入一个「关键发现」字幕卡，防止注意力流失",
    metric: "完播 +13%",
    meta: "已验证 21 条 · 适用教程类",
    category: "script",
  },
  {
    id: "kr10",
    code: "Rule_Script_04",
    title: "故事线嵌套框架",
    desc: "以真实用户故事开头，穿插方法论，结尾回到故事做总结",
    metric: "完播 +8%",
    meta: "适用深度分析类 · 复用 12 次",
    category: "script",
  },
  // ── D-B 填充: 分镜技能 (补 2 条凑满 3) ──
  {
    id: "kr11",
    code: "Skill_Storyboard_05",
    title: "屏幕录制缩放模板",
    desc: "关键操作区域放大 150%，边缘淡出，适合软件教程",
    metric: "复用 27 次",
    meta: "本号默认教程分镜规范",
    category: "storyboard",
  },
  {
    id: "kr12",
    code: "Skill_Storyboard_09",
    title: "时间轴对比分镜",
    desc: "上下分屏对比「before/after」，搭配进度条动效",
    metric: "复用 9 次",
    meta: "适用功能演进类视频",
    category: "storyboard",
  },
];

export const KNOWLEDGE_RULE_CANDIDATES: KnowledgeRuleCandidate[] = [
  // ── PROTO 精确行 ──
  {
    id: "kc01",
    title: '"前 5 秒留人钩子" 候选',
    desc: '来自 S17 数据反哺：本号最近 3 条爆款都用了 "我马上告诉你..." 句式',
    source: "S17 数据反哺",
  },
  // ── D-B 填充 ──
  {
    id: "kc02",
    title: '"结尾呼吁关注" 句式候选',
    desc: "分析近 10 条视频评论，「关注博主」行动词出现在末尾 8 秒效果最佳",
    source: "评论区文本分析",
  },
  {
    id: "kc03",
    title: '"弹幕互动提问" 钩子候选',
    desc: "S11 A/B 测试：加入「你觉得哪个更好用？」字幕卡后互动率提升 34%",
    source: "S11 A/B 实验",
  },
];
