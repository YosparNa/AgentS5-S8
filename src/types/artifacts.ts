// 阶段产物形状(S1/S2/S2.5/S4 对齐后端 handlers.py;S5–S17 为占位契约,待后端成员对齐)

export interface S1TrackScorecard {
  artifact_type: "track_scorecard";
  verdict: "recommend_lock" | "review" | "reject";
  scores: { score_total: number; score_size: number; score_diff: number; score_biz: number; score_growth: number };
  metrics?: Record<string, { score: number } & Record<string, unknown>>;
  seed_keywords?: string[];
  expanded_keywords?: string[];
  evidence?: Record<string, string>;
  sample_videos?: unknown[];
  sample_channels?: unknown[];
}

export interface S2CompetitorCandidates {
  artifact_type: "competitor_candidates";
  candidates: Array<{
    candidate_id: string;
    channel_id?: string;
    title: string;
    subs?: string;
    source_path?: string;
    median_views?: number;
    engagement?: number;
    frequency?: number;
    diff?: number;
    biz?: number;
    risk?: number;
    heuristic_score?: number;
    llm_score?: number;
    score_total: number;
    tier: "core" | "candidate" | "archive";
    llm_explanation?: string;
    sample_videos?: unknown[];
  }>;
  discovery_paths?: Record<string, unknown>;
}

export interface S25ViralTeardowns {
  artifact_type: "viral_teardowns";
  teardowns: Array<{
    video_id: string;
    title: string;
    channel_id?: string;
    transcript_status?: "available" | "missing";
    title_formula?: string;
    opening_30s?: string;
    structure?: string;
    comment_themes?: string[];
    reusable_angle?: string;
    confidence?: number;
  }>;
  pattern_clusters?: Array<{
    cluster_id: string;
    pattern_type: string;
    summary: string;
    supporting_video_ids?: string[];
    confidence?: number;
  }>;
}

export interface S4HotspotBatch {
  artifact_type: "hotspot_batch";
  hotspots: Array<{
    hotspot_id: string;
    source: string;
    title: string;
    url?: string;
    discovered_at?: string;
    expires_at?: string;
    heat_score?: number;
    relevance_score?: number;
    timeliness_score?: number;
    story_score?: number;
    competition_score?: number;
    heuristic_score?: number;
    llm_score?: number;
    opportunity_score: number;
    verdict: "recommended" | "maybe" | "ignore";
    matched_keywords?: string[];
    adapted_angle?: string;
    reason?: string;
  }>;
  context_used?: Record<string, unknown>;
}

// S5–S17 占位:字段先满足原型展示,待后端成员对齐
export interface PlaceholderArtifact {
  artifact_type: string;
  [k: string]: unknown;
}

// 工作台阶段定义已移至 src/types/stage.ts (切片 C1)
// StageLayer 别名保留供其他地方兼容引用
export type { Layer as StageLayer } from "./stage";
