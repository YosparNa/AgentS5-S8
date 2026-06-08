// mock 数据 — 数据分析 F1
// PROTO 行 2570–2583 (09index-v7.html): 4 KPI + 3 频道贡献 + D-B 补充近 7 日趋势
// deltaTone 枚举键: up | down | flat (class map 在 AnalyticsView 内)
// barTone 枚举键: indigo | pink | emerald | amber (class map 在 AnalyticsView 内)
import type { AnalyticsSummary } from "@/types";

export const ANALYTICS: AnalyticsSummary = {
  kpis: [
    { label: "总播放", value: "38.4K", delta: "↑ 12% 周环比", deltaTone: "up" },
    { label: "总订阅净增", value: "+420", delta: "↑ 8%", deltaTone: "up" },
    { label: "平均 CTR", value: "6.8%", delta: "↑ 0.4pt", deltaTone: "up" },
    { label: "完播率", value: "54%", delta: "→ 持平", deltaTone: "flat" },
  ],
  contributions: [
    { emoji: "📺", name: "AI 工具频道", value: "23.8K · 62%", pct: 62, barTone: "indigo" },
    { emoji: "🌸", name: "小红书种草", value: "10.8K · 28%", pct: 28, barTone: "pink" },
    { emoji: "📝", name: "X 长推号", value: "3.8K · 10%", pct: 10, barTone: "emerald" },
  ],
};
