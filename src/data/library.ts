// Ported from reference/09index-v7.html lines 1137–1395
// Representative subset faithfully covering 3 tabs: tracks (3) / creators (5) / videos (4).
// Enum-key tones only — no Tailwind class strings (guardrail #9).

import type { LibraryData } from "@/types/ideas";

export const LIBRARY: LibraryData = {
  // ── 已关注赛道 PROTO 1137–1210 ─────────────────────────────────────────────
  tracks: [
    // 赛道1: AI 工具教程
    {
      key: "ai",
      emoji: "🤖",
      title: "AI 工具教程",
      rpm: "$5-10",
      hot: 23,
      turning: 7,
      alertText: "+23 新爆款",
      alertTone: "emerald",
      channelName: "AI 工具频道",
      inboxCount: 28,
    },
    // 赛道2: AI 赚钱方法 (not a track key — library-only, no channel docked)
    {
      key: "ai_earn",
      emoji: "🤖",
      title: "AI 赚钱方法",
      rpm: "$10-15",
      hot: 18,
      turning: 4,
      alertText: "⚠ YT 严打区",
      alertTone: "amber",
    },
    // 赛道3: 超长助眠 (observation only, no channel)
    {
      key: "sleep",
      emoji: "🌙",
      title: "超长助眠 (2-3h)",
      rpm: "$10-15",
      hot: 5,
      turning: 1,
      watchDays: 12,
    },
  ],

  // ── 关注博主 PROTO 1213–1322 ────────────────────────────────────────────────
  creators: [
    // 博主1: @CodeWizard 拐点
    {
      id: "cw",
      initials: "CW",
      gradientTone: "fuchsia",
      handle: "@CodeWizard",
      badgeText: "拐点",
      badgeTone: "fuchsia",
      subs: "11K",
      statLine: "历史中位 8K → 近 3 条 187K",
      trackEmoji: "🤖",
      trackName: "AI 工具教程",
      newCount: 2,
    },
    // 博主2: @MattVidPro 头部
    {
      id: "mv",
      initials: "MV",
      gradientTone: "indigo",
      handle: "@MattVidPro",
      badgeText: "头部",
      badgeTone: "gray",
      subs: "42K",
      statLine: "月增 +18%",
      trackEmoji: "🤖",
      trackName: "AI 工具教程",
    },
    // 博主3: @NewAIDevTalk 新进
    {
      id: "n1",
      initials: "N1",
      gradientTone: "emerald",
      handle: "@NewAIDevTalk",
      badgeText: "新进",
      badgeTone: "emerald",
      subs: "28K",
      statLine: "建号 12d · 4 条全 outlier",
      trackEmoji: "🤖",
      trackName: "AI 工具教程",
      newCount: 1,
    },
    // 博主4: @AIShortsDaily 拐点
    {
      id: "as",
      initials: "AS",
      gradientTone: "sky",
      handle: "@AIShortsDaily",
      badgeText: "拐点",
      badgeTone: "fuchsia",
      subs: "23K",
      statLine: "历史中位 12K → 近 3 条 68K",
      trackEmoji: "🤖",
      trackName: "AI 工具教程",
    },
    // 博主5: @IndieDevLife (无badge)
    {
      id: "id",
      initials: "ID",
      gradientTone: "rose",
      handle: "@IndieDevLife",
      subs: "28K",
      statLine: "月增 +6%",
      trackEmoji: "🤖",
      trackName: "AI 工具教程",
      newCount: 1,
    },
  ],

  // ── 收藏视频 PROTO 1328–1394 ────────────────────────────────────────────────
  videos: [
    // 视频1
    {
      id: "vid_01",
      gradientTone: "indigo",
      title: "I built an AI Agent in 1 hour with Claude Code",
      outlier: "7.8x",
      views: "312K",
      creator: "@MattVidPro",
      inboxNote: "已入 AI 工具频道收件箱",
    },
    // 视频2
    {
      id: "vid_02",
      gradientTone: "rose",
      title: "Devin vs Claude Code — 5 真实任务测评",
      outlier: "5.2x",
      views: "189K",
      creator: "@CodeWizard",
      creatorBadgeText: "拐点",
      creatorBadgeTone: "fuchsia",
      inboxNote: "已入收件箱",
    },
    // 视频3
    {
      id: "vid_03",
      gradientTone: "amber",
      title: "为什么我又退回 Cursor 了 — 三周 AI Agent 真相",
      outlier: "3.4x",
      views: "96K",
      creator: "@IndieDevLife",
      inboxNote: "已入收件箱",
    },
    // 视频4
    {
      id: "vid_04",
      gradientTone: "emerald",
      title: "我用 ¥0 跑了 Claude Agent 一周 — 真实账单",
      outlier: "4.6x",
      views: "142K",
      creator: "@NewAIDevTalk",
      creatorBadgeText: "新进",
      creatorBadgeTone: "emerald",
      inboxNote: "已入收件箱",
    },
  ],
};
