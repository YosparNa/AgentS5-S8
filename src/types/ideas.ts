// 选题池 / 频道 / 任务 等视图的 mock 数据形状
// + D2a: Competitor (S2) / Hotspot (S4) artifact shapes ported from PROTO
// E1: refactored to enum-key tone pattern (no *cls strings in data)

// ===== S2 对标账号 =====
export interface CompetitorVideo {
  t: string;
  plays: string;
  ago: string;
  viral?: boolean;
}

export interface CompetitorInflection {
  breakoutVideo: string;
  breakoutViews: string;
  historyMedian: string;
  burstRatio: string;
  lowSubRatio: string;
  delta: Record<string, string>;
  algoHypothesis: string;
}

export interface Competitor {
  avatar: string;
  name: string;
  plat: string;
  sub: string;
  monthGrow: string;
  medPlay: string;
  complete: string;
  interact: string;
  freq: string;
  diff: number;
  biz: string;
  risk: string;
  trans: string;
  monetize: string;
  recent: CompetitorVideo[];
  newVid?: boolean;
  valueScore: number;
  pick?: boolean;
  alert?: string;
  inflection?: CompetitorInflection;
}

// ===== S4 热点 =====
export interface HotspotCompetitor {
  n: string;
  a: string;
  t?: string;
  type?: string;
}

export interface Hotspot {
  emoji: string;
  title: string;
  score: number;
  dims: [number, number, number, number];
  dnaFit: number;
  expire: string;
  srcs: string[];
  trend: number[];
  peak: string;
  competitors: HotspotCompetitor[];
  angle: string;
  titles: string[];
  risk: string;
}

// ===== E1: 选题池 · 赛道 / 雷达 枚举键类型 =====
// guardrail #9: NO Tailwind class strings in data — use enum keys, map in components

export type VerdictTone = "blue" | "neutral" | "red";
// blue   → 蓝海 (bg-emerald-50 text-emerald-700 border-emerald-200)
// neutral → 中性  (bg-amber-50  text-amber-700  border-amber-200)
// red    → 红海  (bg-gray-100  text-gray-600   border-gray-200)

export type WindowTone = "open" | "mid" | "narrow" | "pending";
// open    → 开放   (text-amber-600)
// mid     → 中     (text-amber-600)
// narrow  → 窄     (text-amber-700)
// pending → 待评估  (text-gray-500)

export type BadgeTone = "purple" | "sky" | "emerald";
// purple  → bg-purple-50  text-purple-700
// sky     → bg-sky-50     text-sky-700
// emerald → bg-emerald-50 text-emerald-700

export interface TrackBadge {
  text: string;
  tone: BadgeTone;
}

export interface TrackRanking {
  key: string;
  rank: number;
  emoji: string;
  title: string;
  verdict: string;
  verdictTone: VerdictTone;
  rpm: string;
  hot: number;
  turning: number;
  active: string;
  score: number;
  badge?: TrackBadge | null;
  /** second pill on #1/#2 cards, e.g. 起号窗口开放 / 完播极高 */
  windowBadge?: { text: string; tone: BadgeTone };
}

export interface TrackDetail {
  key: string;
  emoji: string;
  title: string;
  verdict: string;
  verdictTone: VerdictTone;
  rpm: string;
  rpmNote?: string;
  creators: string;
  supply: string;
  window: string;
  windowTone: WindowTone;
  tag: string;
}

export interface RadarCluster {
  key: string;
  pooled: boolean;
  rank?: number;
  emoji: string;
  title: string;
  verdict: string;
  verdictTone: VerdictTone;
  rpm: string;
  hot: number;
  turning: number;
  active: string;
  score: number;
  badge?: TrackBadge | null;
  // detail-ish fields — lets a discovered track open its drawer
  rpmNote?: string;
  supply?: string;
  window?: string;
  windowTone?: WindowTone;
  tag?: string;
  sunk?: boolean;
}

export interface RadarSearchResult {
  clusters: RadarCluster[];
  newCount: number;
  pooledCount: number;
  raw: number;
  creatorsScanned: number;
}

// ===== E1: 关注库 (Library) =====
export type CreatorBadgeTone = "fuchsia" | "emerald" | "gray";
// fuchsia → 拐点  (bg-fuchsia-100 text-fuchsia-700)
// emerald → 新进  (bg-emerald-100 text-emerald-700)
// gray    → 头部  (bg-gray-100    text-gray-600)

export type TrackAlertTone = "emerald" | "amber";
// emerald → 正向新动态
// amber   → 警告/风险

export interface LibraryTrack {
  key: string;
  emoji: string;
  title: string;
  rpm: string;
  hot: number;
  turning: number;
  alertText?: string;
  alertTone?: TrackAlertTone;
  channelName?: string;
  inboxCount?: number;
  watchDays?: number;
}

/** Avatar/thumbnail gradient as an enum key — class strings live in toneMaps. */
export type GradientTone = "fuchsia" | "indigo" | "emerald" | "sky" | "rose" | "amber";

export interface LibraryCreator {
  id: string;
  initials: string;
  gradientTone: GradientTone;
  handle: string;
  badgeText?: string;
  badgeTone?: CreatorBadgeTone;
  subs: string;
  statLine: string;
  trackEmoji: string;
  trackName: string;
  newCount?: number;
}

export interface LibraryVideo {
  id: string;
  gradientTone: GradientTone;
  title: string;
  outlier: string;
  views: string;
  creator: string;
  creatorBadgeText?: string;
  creatorBadgeTone?: CreatorBadgeTone;
  inboxNote?: string;
}

export interface LibraryData {
  tracks: LibraryTrack[];
  creators: LibraryCreator[];
  videos: LibraryVideo[];
}

// ===== E1: 收件箱 (Inbox) =====
export type InboxSourceTone = "indigo" | "purple" | "emerald" | "amber" | "sky";
// indigo  → 🛰️ 雷达
// purple  → 🔥 热点
// emerald → 💬 评论
// amber   → 🏆 回溯
// sky     → 🤖 AI

export type InboxSignalTone = "green" | "amber";
// green → ●●○ (高置信)
// amber → ●○○ (低置信)

export interface InboxItem {
  id: string;
  sourceLabel: string;
  sourceTone: InboxSourceTone;
  title: string;
  outlier?: string;
  views?: string;
  velocity?: string;
  interactRate?: string;
  vsubs?: string;
  trendLabel?: string;
  creatorHandle?: string;
  creatorBadgeText?: string;
  note?: string;
  score: number;
  signalTone: InboxSignalTone;
}

// ===== F2: 爆款解构 · 类型定义 =====
// guardrail #9: NO Tailwind class strings in data — use enum keys, map in components

export type ViralType = "topic" | "performance" | "content" | "viral" | "longtail" | "own";
// topic       → 选题型
// performance → 表现型
// content     → 内容型
// viral       → 病毒型
// longtail    → 长尾型
// own         → 本号爆款

export type ViralThumbTone = "purple" | "rose" | "emerald" | "pink" | "gray" | "indigo";
// purple  → from-purple-700 to-indigo-900
// rose    → from-rose-600 to-orange-700
// emerald → from-emerald-600 to-teal-800
// pink    → from-pink-600 to-fuchsia-800
// gray    → from-gray-700 to-gray-900
// indigo  → from-indigo-600 to-purple-800

export type ViralChipTone = "blue" | "emerald" | "purple" | "amber" | "indigo";
// blue    → bg-blue-50 text-blue-700
// emerald → bg-emerald-50 text-emerald-700
// purple  → bg-purple-50 text-purple-700
// amber   → bg-amber-50 text-amber-700
// indigo  → bg-indigo-50 text-indigo-700

export interface ViralStats {
  view: string;
  ctr: string;
  ctrBase: string;
  watch: string;
  watchBase: string;
}

export interface ViralSample {
  id: number;
  type: string;
  typeKey: ViralType;
  score: number;
  thumbTone: ViralThumbTone;
  views: string;
  likes: string;
  title: string;
  author: string;
  meta: string;
  chips: { text: string; tone: ViralChipTone }[];
  stats: ViralStats;
}

export interface ViralCandidateRule {
  id: string;
  code: string;
  recommend: "L1" | "L2";
  title: string;
  desc: string;
  validation: string;
  samples?: string[];
}

// ===== Legacy channel / mission shapes (B/C slices) =====
export interface ChannelCard {
  id: string;
  emoji: string;
  name: string;
  platform: string;
  stats: string;
  badges: Array<{ text: string; cls: string }>;
}

export interface MissionRow {
  id: string;
  title: string;
  channel: string;
  stage: string;
  next?: string;
  status: string;
  statusCls: string;
}
