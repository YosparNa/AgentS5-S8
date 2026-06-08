// 视图专用数据形状 — 供 dataProvider 方法返回 + 视图组件消费

/** 主页精华模板卡片 */
export interface Template {
  id: string;
  /** Tailwind bg-gradient-to-br class string, e.g. "bg-gradient-to-br from-blue-500 to-purple-600" */
  grad: string;
  /** Key into Icon map (icons.tsx) */
  icon: string;
  /** Icon color class, e.g. "text-blue-600" */
  iconCls: string;
  author: string;
  title: string;
  stats: string;
}

/** 主页"我的频道"磁贴（4 个真实频道，不含"新建"占位） */
export interface ChannelTile {
  id: string;
  /** Tailwind bg + hover class string */
  bg: string;
  emoji: string;
  title: string;
  stats: string;
  chips: Array<{ text: string; cls: string }>;
}

/** 主页"进行中的视频任务"表格行 */
export interface RunningMission {
  id: string;
  title: string;
  channel: string;
  stage: string;
  next?: string;
  /** Tailwind classes for next text color when non-default, e.g. "text-red-600" */
  nextCls?: string;
  status: string;
  /** Full static Tailwind classes for status badge */
  statusCls: string;
  /** Whether to animate the status badge with blink */
  blink?: boolean;
}

/** 频道列表页卡片 — 比旧 ChannelCard 更丰富 */
export interface ChannelListCard {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  statusBadge: { text: string; cls: string };
  /** Border color override class, e.g. "border-amber-200"; defaults to "border-gray-200" */
  borderCls?: string;
  stats: Array<{ label: string; value: string; valueCls?: string }>;
}

/** 频道详情页 L2 阶段卡片 */
export interface L2StageCard {
  code: string;
  /** Color class for code text, e.g. "text-sky-700" or "text-purple-700" */
  codeCls: string;
  title: string;
  sub: string;
  badge: { text: string; cls: string };
}

/** 频道详情页爆款视频卡片 */
export interface HitCard {
  id: string;
  grad: string;
  badge: string;
  title: string;
  stats: string;
}

/** 频道详情页视频任务卡片 */
export interface MissionCard {
  id: string;
  statusBadge: { text: string; cls: string };
  blink?: boolean;
  deadline: string;
  title: string;
  desc: string;
  stageLine: string;
  /** Color class override for stageLine, e.g. "text-red-500" */
  stageLineCls?: string;
  /** Progress percentage 0–100 */
  progress: number;
  /** Tailwind class for progress bar, e.g. "bg-indigo-500" */
  barCls: string;
  footLeft: string;
  footRight: string;
  footRightCls: string;
  /** Border color override class, e.g. "border-red-200" */
  borderCls?: string;
}

/** 频道详情页完整数据形状 */
export interface ChannelDetail {
  id: string;
  emoji: string;
  name: string;
  layerPill: string;
  lockedBadge: string;
  desc: string;
  meta: string[];
  l2Stages: L2StageCard[];
  hits: HitCard[];
  missions: MissionCard[];
}

/** 主页待办 banner 数据 */
export interface HomeTodo {
  total: number;
  agentsRunning: number;
  awaitingReview: number;
  publishToday: number;
}

// ── F1: 任务列表 ──────────────────────────────────────────────────────────────

export type MissionStatus = "running" | "review" | "published" | "risk" | "draft";

export interface MissionListRow {
  id: string;
  title: string;
  channel: string;
  stage: string;
  audit: string;
  status: MissionStatus;
  blink?: boolean;
  auditTone?: "ok" | "risk" | "muted";
}

// ── F1: 经验库 ────────────────────────────────────────────────────────────────

export type KnowledgeCategory = "title" | "hook" | "script" | "storyboard" | "other";

export interface KnowledgeRule {
  id: string;
  code: string;
  title: string;
  desc: string;
  metric: string;
  meta: string;
  category: KnowledgeCategory;
}

export interface KnowledgeRuleCandidate {
  id: string;
  title: string;
  desc: string;
  source: string;
}

// ── F1: 数据分析 ──────────────────────────────────────────────────────────────

export type DeltaTone = "up" | "down" | "flat";
export type BarTone = "indigo" | "pink" | "emerald" | "amber";

export interface AnalyticsKpi {
  label: string;
  value: string;
  delta: string;
  deltaTone: DeltaTone;
}

export interface ChannelContribution {
  emoji: string;
  name: string;
  value: string;
  pct: number;
  barTone: BarTone;
}

export interface AnalyticsSummary {
  kpis: AnalyticsKpi[];
  contributions: ChannelContribution[];
}

// ── Probe / 信息探针 ──────────────────────────────────────────────────────────

export type ProbeModeKey = "web" | "yt" | "own" | "deep";

export interface ProbeSource {
  i: number;
  title: string;
  url?: string;
  desc?: string;
  channel?: string;
  views?: string;
  angle?: string;
}

export interface ProbeDeepTask {
  label: string;
  state: "done" | "running" | "pending";
}

export interface ProbeRef {
  label: string;
  body: string;
}

export interface ProbeResult {
  mode: ProbeModeKey;
  modeName: string;
  /** Key into Icon map in @/components/icons.tsx */
  modeIcon: string;
  /** Full static Tailwind color class, e.g. "text-blue-600" */
  modeColor: string;
  time: string;
  query: string;
  /** web / yt summary text (query interpolated) */
  summary?: string;
  /** web + yt sources */
  sources?: ProbeSource[];
  /** deep mode tasks */
  deepTasks?: ProbeDeepTask[];
  deepNote?: string;
  /** own mode */
  ownIntro?: string;
  ownRefs?: ProbeRef[];
}
