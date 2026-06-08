// 领域类型(对齐 backend/app/domain/types.py;详见 reference/frontend-vite-rebuild-design.md §7)
export type WorkflowStatus = "pending" | "running" | "awaiting_review" | "completed" | "failed";
// 后四个(done/active/reused/scheduled/locked)为原型 UI 态,接后端后归一到上面
export type StageStatus =
  | "pending" | "running" | "awaiting_review" | "completed" | "failed" | "skipped"
  | "done" | "active" | "reused" | "scheduled" | "locked";

export interface WorkflowRun {
  id: string;
  channel_id: string | null;
  status: WorkflowStatus;
  current_stage?: string;
  input: Record<string, unknown>;
  created_at: string;
}

export interface StageRun {
  id: string;
  workflow_id: string;
  stage_code: string;
  stage_name: string;
  stage_slug?: string;
  order: number;
  status: StageStatus;
  output_artifact?: Record<string, unknown> | null;
  mounted_context?: Record<string, unknown> | null;
  review_decision?: string | null;
  error?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface RunEvent {
  id: string;
  workflow_id: string;
  stage_code?: string;
  kind: string;
  message: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

export interface KnowledgeCandidate {
  id: string;
  source: string;
  kind: string;
  scope: string;
  summary: string;
  payload?: Record<string, unknown>;
  status: "pending" | "remembered" | "session_only" | "ignored";
}

export interface KnowledgeItem {
  id: string;
  scope: string;
  kind: string;
  summary: string;
  body: string;
  ref_type?: string;
  ref_id?: string | null;
  provenance_type?: string;
  status?: string;
  importance?: number;
  applied_count?: number;
}

export interface WorkflowView {
  workflow: WorkflowRun;
  stages: StageRun[];
}
