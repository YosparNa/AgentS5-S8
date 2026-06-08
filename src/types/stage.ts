// 来源 reference/frontend-vite-rebuild-design.md §D-A + §D-E

export type Layer = "central" | "channel" | "video";

// Run-state is the ONLY status source for the workbench.
// domain.StageStatus is the backend contract (mapped in provider when backend lands).
export type RunStatus =
  | "pending"
  | "active"
  | "done"
  | "awaiting_review"
  | "rejected"
  | "skipped"
  | "locked";

export interface StageFlowIO {
  layer?: Layer;
  label: string;
}

export interface StageDef {
  code: string;
  layer: Layer;
  title: string;
  subtitle: string;
  model: string;
  audit?: string;       // gate symbol ①..⑦
  star?: boolean;
  config: { kind: string; [k: string]: unknown };
  output?: Record<string, unknown>;
  flow: { inputs: StageFlowIO[]; outputs: StageFlowIO[]; next: string };
}

export interface WorkflowNode {
  nodeId: string;            // mock: mirrors stageId (one workflow). Distinct field for future/backend.
  stageId: string;           // key into STAGES
  order: number;
  enabled: boolean;
  layer: Layer;
  special?: boolean;         // s25 → navigate('/viral')
  dividerBefore?: "sky" | "indigo";  // segment divider color rendered BEFORE this node
  audit?: string;            // audit-gate symbol shown on node
  badge?: { text: string; cls: string };  // static display badge (L2 reuse / special)
  star?: boolean;            // ★ in code line
  scheduled?: boolean;       // s4 clock icon
  deletable?: boolean;       // L3 (S5+) deletable; L1/L2 (S0–S4, s25) not
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface NodeRun {
  status: RunStatus;
  percent?: number;
  doneCount?: number;
  totalCount?: number;
  currentItem?: string;
  checklist?: ChecklistItem[];
  mountedContext?: StageFlowIO[];   // mounted-context chips (layer-colored)
  artifactRef?: string;
  producedAt?: string;
}

export interface RunFlow {
  currentNodeId: string;
  nodes: Record<string, NodeRun>;
}
