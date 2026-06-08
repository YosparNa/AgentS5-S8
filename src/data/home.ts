// 来源 PROTO 254–399
import type { Template, ChannelTile, RunningMission, HomeTodo } from "@/types";

export const homeTodo: HomeTodo = {
  total: 5,
  agentsRunning: 3,
  awaitingReview: 2,
  publishToday: 1,
};

export const homeTemplates: Template[] = [
  {
    id: "matt-wolfe",
    grad: "bg-gradient-to-br from-blue-500 to-purple-600",
    icon: "Brain",
    iconCls: "text-blue-600",
    author: "@MattWolfe",
    title: "AI 资讯快讯频道",
    stats: "14 阶段模板 · 1.2M 订阅同款",
  },
  {
    id: "ali-abdaal",
    grad: "bg-gradient-to-br from-rose-500 to-orange-500",
    icon: "FileText",
    iconCls: "text-rose-600",
    author: "@AliAbdaal",
    title: "知识博主深度长视频",
    stats: "17 阶段 · 高完播结构",
  },
  {
    id: "fireship",
    grad: "bg-gradient-to-br from-emerald-500 to-teal-600",
    icon: "Fire",
    iconCls: "text-emerald-700",
    author: "@Fireship",
    title: "极简技术快讯（100s）",
    stats: "9 阶段 · 信息密度爆炸",
  },
  {
    id: "mkbhd",
    grad: "bg-gradient-to-br from-gray-700 to-gray-900",
    icon: "Database",
    iconCls: "text-gray-700",
    author: "@MKBHD 风格",
    title: "科技产品评测",
    stats: "15 阶段 · 高制作精度",
  },
  {
    id: "xhs-shop",
    grad: "bg-gradient-to-br from-pink-500 to-fuchsia-600",
    icon: "Bookmark",
    iconCls: "text-pink-600",
    author: "@小红书带货",
    title: "种草测评 Shorts 矩阵",
    stats: "9 阶段 · 平台原生话术",
  },
];

export const myChannels: ChannelTile[] = [
  {
    id: "ai-tool",
    bg: "bg-sky-50 hover:bg-sky-100",
    emoji: "📺",
    title: "AI 工具频道",
    stats: "YT 主号 · 2.4K 订阅 · 视频 8",
    chips: [
      { text: "定位 ✓", cls: "text-sky-700" },
      { text: "热点 5", cls: "text-emerald-700" },
      { text: "运行 3", cls: "text-amber-700" },
    ],
  },
  {
    id: "shorts",
    bg: "bg-orange-50 hover:bg-orange-100",
    emoji: "🎬",
    title: "跨境短视频矩阵",
    stats: "TikTok · 待 L2 配置",
    chips: [
      { text: "定位 待", cls: "text-amber-700" },
    ],
  },
  {
    id: "xhs",
    bg: "bg-pink-50 hover:bg-pink-100",
    emoji: "🌸",
    title: "小红书种草号",
    stats: "小红书 · 18K 粉 · 视频 24",
    chips: [
      { text: "定位 ✓", cls: "text-emerald-700" },
      { text: "爆款 4", cls: "text-emerald-700" },
    ],
  },
  {
    id: "long-x",
    bg: "bg-emerald-50 hover:bg-emerald-100",
    emoji: "📝",
    title: "X 长推号",
    stats: "X / Twitter · 1.1K 关注",
    chips: [
      { text: "定位 ✓", cls: "text-emerald-700" },
      { text: "运行 1", cls: "text-amber-700" },
    ],
  },
];

export const runningMissions: RunningMission[] = [
  {
    id: "manus-vs-notebooklm",
    title: "Manus vs NotebookLM 长视频",
    channel: "📺 AI 工具频道",
    stage: "S9 · 分镜中",
    next: "76% → 审核 ④",
    status: "运行中",
    statusCls: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    blink: true,
  },
  {
    id: "claude-code-intro",
    title: "Claude Code 极速入门",
    channel: "📺 AI 工具频道",
    stage: "S15 · 待终审",
    next: "作者签收 → 发布",
    status: "待终审",
    statusCls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  {
    id: "sora2-truth",
    title: "Sora 2 商用真相",
    channel: "📺 AI 工具频道",
    stage: "S7 · 审③驳回",
    next: "需重写脚本",
    nextCls: "text-red-600",
    status: "有风险",
    statusCls: "bg-red-50 text-red-700 border border-red-200",
  },
];
