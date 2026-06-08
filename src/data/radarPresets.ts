// Ported from reference/09index-v7.html
//   RADAR_PRESETS      → lines 2238–2257
//   RADAR_POOLED_RULES → lines 2258–2268
// All vcls/wcls/badge.cls replaced with verdictTone/windowTone/badge.tone (guardrail #9).

import type { VerdictTone, WindowTone, BadgeTone, TrackBadge, RadarCluster } from "@/types/ideas";

// ── Preset item (new track discovered by search) ──────────────────────────
export interface RadarPresetItem {
  key: string;
  emoji: string;
  title: string;
  verdict: string;
  verdictTone: VerdictTone;
  rpm: string;
  rpmNote?: string;
  hot: number;
  turning: number;
  active: string;
  supply: string;
  window: string;
  windowTone: WindowTone;
  score: number;
  badge?: TrackBadge | null;
  tag: string;
}

export interface RadarPreset {
  match: string[];
  items: RadarPresetItem[];
}

// ── Pooled-rule entry (links query keywords → already-monitored tracks) ───
export interface RadarPooledRule {
  keys: string[];
  k: string;
  rank: number;
  hot: number;
  turning: number;
  score: number;
  badge?: { text: string; tone: BadgeTone } | null;
}

// ── Tone mappings applied during port ─────────────────────────────────────
// vcls 'bg-emerald-50 text-emerald-700 ...' → verdictTone: 'blue'
// vcls 'bg-amber-50  text-amber-700 ...'   → verdictTone: 'neutral'
// vcls 'bg-gray-100  text-gray-600 ...'    → verdictTone: 'red'
// wcls 'text-amber-600' → windowTone: 'open' | 'mid'  (per window text)
// wcls 'text-amber-700' → windowTone: 'narrow'
// badge.cls 'bg-purple-50 text-purple-700' → tone: 'purple'
// badge.cls 'bg-sky-50    text-sky-700'    → tone: 'sky'
// badge.cls 'bg-emerald-50 text-emerald-700' → tone: 'emerald'

export const RADAR_PRESETS: RadarPreset[] = [
  {
    match: ["存钱", "省钱", "极简", "负债", "上岸"],
    items: [
      {
        key: "r_save",
        emoji: "💰",
        title: "存钱挑战 / 极简省钱",
        verdict: "蓝海 ★★",
        verdictTone: "blue",
        rpm: "$6-9",
        rpmNote: "记账 App / 省钱工具广告主",
        hot: 18,
        turning: 4,
        active: "263",
        supply: "1.1K",
        window: "开放",
        windowTone: "open",
        score: 7.8,
        badge: { text: "起号窗口开放", tone: "purple" },
        tag: "「30 天存钱挑战」「无消费月」打卡型内容,真人出镜门槛低。观众为省钱方法 + 情绪陪伴而来,复访率高。",
      },
      {
        key: "r_debt",
        emoji: "📉",
        title: "负债上岸记录",
        verdict: "中性 ★★",
        verdictTone: "neutral",
        rpm: "$7-11",
        hot: 9,
        turning: 2,
        active: "141",
        supply: "620",
        window: "中",
        windowTone: "mid",
        score: 7.1,
        tag: "真实负债 → 还清的连续剧式记录,强代入感。需持续更新维持追更,适合做系列。",
      },
      {
        key: "r_frugal",
        emoji: "🪙",
        title: "极简生活方式",
        verdict: "红海 ★",
        verdictTone: "red",
        rpm: "$4-7",
        hot: 6,
        turning: 1,
        active: "410",
        supply: "2.3K",
        window: "窄",
        windowTone: "narrow",
        score: 5.9,
        tag: "供给已较密,需极强个人风格或地域差异化才能突围。",
      },
    ],
  },
  {
    match: ["老年", "银发", "退休", "老人"],
    items: [
      {
        key: "r_senior_life",
        emoji: "👵",
        title: "银发生活记录",
        verdict: "蓝海 ★★★",
        verdictTone: "blue",
        rpm: "$7-12",
        rpmNote: "保健 / 适老产品广告主厚",
        hot: 21,
        turning: 5,
        active: "198",
        supply: "880",
        window: "开放",
        windowTone: "open",
        score: 8.1,
        badge: { text: "起号窗口开放", tone: "purple" },
        tag: "退休后的日常 / 旅居 / 手艺,治愈系受众粘性高,海外银发经济广告主预算厚。",
      },
      {
        key: "r_senior_health",
        emoji: "🩺",
        title: "老年健康科普",
        verdict: "中性 ★★",
        verdictTone: "neutral",
        rpm: "$8-13",
        hot: 12,
        turning: 3,
        active: "320",
        supply: "1.6K",
        window: "中",
        windowTone: "mid",
        score: 7.3,
        tag: "慢病管理 / 营养 / 防摔等实用科普,搜索流量稳。需注意医疗合规口径。",
      },
      {
        key: "r_retire_fin",
        emoji: "💴",
        title: "退休理财规划",
        verdict: "中性 ★★",
        verdictTone: "neutral",
        rpm: "$10-16",
        rpmNote: "金融广告主 RPM 高",
        hot: 7,
        turning: 2,
        active: "96",
        supply: "410",
        window: "中",
        windowTone: "mid",
        score: 6.9,
        tag: "养老金 / 医保 / 遗产规划,RPM 高但专业门槛高,需可信人设。",
      },
    ],
  },
  {
    match: ["单亲", "妈妈", "带娃", "育儿", "宝妈"],
    items: [
      {
        key: "r_solo_mom",
        emoji: "👩‍👧",
        title: "单亲妈妈成长",
        verdict: "蓝海 ★★",
        verdictTone: "blue",
        rpm: "$6-10",
        rpmNote: "母婴 / 教育广告主",
        hot: 15,
        turning: 4,
        active: "174",
        supply: "760",
        window: "开放",
        windowTone: "open",
        score: 7.6,
        badge: { text: "情感共鸣强", tone: "purple" },
        tag: "真实困境 + 自我成长的叙事,情感共鸣极强,易出爆款与高互动。",
      },
      {
        key: "r_solo_parent",
        emoji: "🧸",
        title: "一个人带娃日常",
        verdict: "中性 ★★",
        verdictTone: "neutral",
        rpm: "$5-9",
        hot: 10,
        turning: 2,
        active: "388",
        supply: "1.9K",
        window: "中",
        windowTone: "mid",
        score: 6.8,
        tag: "育儿干货 + vlog 混合,供给中等,靠真诚和实用度区分。",
      },
    ],
  },
  {
    match: ["小语种", "语言", "磨耳朵", "西班牙", "日语", "韩语", "法语", "学语"],
    items: [
      {
        key: "r_minor_lang",
        emoji: "🗣️",
        title: "小语种速成",
        verdict: "蓝海 ★★",
        verdictTone: "blue",
        rpm: "$7-11",
        rpmNote: "语言 App 联盟分佣",
        hot: 13,
        turning: 3,
        active: "221",
        supply: "1.0K",
        window: "开放",
        windowTone: "open",
        score: 7.5,
        badge: { text: "搜索流量稳", tone: "sky" },
        tag: "西 / 日 / 韩 / 法等小语种入门,强搜索流量 + 语言 App 联盟分佣,适合系列化。",
      },
      {
        key: "r_lang_immerse",
        emoji: "🎧",
        title: "沉浸式磨耳朵",
        verdict: "中性 ★★",
        verdictTone: "neutral",
        rpm: "$6-10",
        rpmNote: "可做超长拉高 RPM",
        hot: 8,
        turning: 2,
        active: "305",
        supply: "1.4K",
        window: "中",
        windowTone: "mid",
        score: 6.7,
        tag: "长时段听力材料,可叠加超长内容路径提升 RPM,制作可半自动化。",
      },
    ],
  },
];

// ── Pooled rules: maps query keywords → already-monitored track keys ───────
// PROTO lines 2258–2268
export const RADAR_POOLED_RULES: RadarPooledRule[] = [
  {
    keys: ["ai", "工具", "教程", "智能"],
    k: "ai",
    rank: 1,
    hot: 23,
    turning: 7,
    score: 8.7,
    badge: { text: "起号窗口开放", tone: "purple" },
  },
  { keys: ["助眠", "睡", "sleep"], k: "sleep", rank: 2, hot: 5, turning: 1, score: 8.4 },
  {
    keys: ["投资", "理财", "股", "基金", "币", "financ"],
    k: "invest",
    rank: 3,
    hot: 31,
    turning: 9,
    score: 8.2,
  },
  { keys: ["健身", "减肥", "fit"], k: "fitness", rank: 4, hot: 14, turning: 3, score: 7.6 },
  { keys: ["心理", "焦虑", "adhd", "情绪"], k: "psych", rank: 5, hot: 19, turning: 5, score: 7.4 },
  { keys: ["健康", "饮食", "抗衰", "营养"], k: "health", rank: 6, hot: 11, turning: 4, score: 7.2 },
  { keys: ["宠物", "狗", "猫", "训练", "pet"], k: "pet", rank: 7, hot: 17, turning: 2, score: 7.0 },
  { keys: ["科技", "评测", "数码", "tech"], k: "tech", rank: 10, hot: 9, turning: 2, score: 6.6 },
  { keys: ["冥想", "正念", "meditat"], k: "meditate", rank: 12, hot: 6, turning: 1, score: 6.1 },
];

// Helper: convert a RadarPresetItem → RadarCluster shape for resolveRadarQuery
export function presetItemToCluster(item: RadarPresetItem): RadarCluster {
  return {
    key: item.key,
    pooled: false,
    emoji: item.emoji,
    title: item.title,
    verdict: item.verdict,
    verdictTone: item.verdictTone,
    rpm: item.rpm,
    rpmNote: item.rpmNote,
    hot: item.hot,
    turning: item.turning,
    active: item.active,
    score: item.score,
    badge: item.badge ?? null,
    supply: item.supply,
    window: item.window,
    windowTone: item.windowTone,
    tag: item.tag,
  };
}
