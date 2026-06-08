// 来源 PROTO renderProbeResult 4204–4280 + 信息探针 mock 静态数据
import type { ProbeSource, ProbeDeepTask, ProbeRef } from "@/types";

// ── Web sources (4 items) ────────────────────────────────────────────────────

export const WEB_SOURCES: ProbeSource[] = [
  { i: 1, title: "Manus 官方定价页", url: "manus.app/pricing", desc: "官方一手，更新于昨天" },
  { i: 2, title: "TheRundown AI · 周报", url: "therundown.ai", desc: "行业 newsletter 解读" },
  { i: 3, title: "Reddit r/LocalLLaMA 讨论", url: "reddit.com/r/...", desc: "用户实测反馈 280 条" },
  { i: 4, title: "TechCrunch · Manus 报道", url: "techcrunch.com", desc: "融资和路线图" },
];

// ── YT videos (3 items) ──────────────────────────────────────────────────────

export const YT_SOURCES: ProbeSource[] = [
  { i: 1, channel: "Matt Wolfe", title: "我用 Manus 一周后...", views: "89K · 3d", angle: "解读型 · 9 分钟" },
  { i: 2, channel: "AI Search", title: "Manus vs Notebook 实测", views: "42K · 5d", angle: "对比型 · 14 分钟" },
  { i: 3, channel: "Ali Abdaal", title: "最强 AI 工作流", views: "380K · 7d", angle: "深度型 · 22 分钟" },
];

// ── Own refs (2 items) ───────────────────────────────────────────────────────

export const OWN_REFS: ProbeRef[] = [
  { label: "[1] NotebookLM 官方指南 · 第 12 页", body: '"...支持 50 个来源..."' },
  { label: "[2] Manus 1.6 Lite 产品页", body: '"...任务执行..."' },
];

// ── Deep tasks (4 items) ─────────────────────────────────────────────────────

export const DEEP_TASKS: ProbeDeepTask[] = [
  { label: "① 抓取 8 个一手来源", state: "done" },
  { label: "② 对比 5 个评测视频", state: "running" },
  { label: "③ 评论情绪聚类", state: "pending" },
  { label: "④ 生成综合报告", state: "pending" },
];
