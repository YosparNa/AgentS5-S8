// CreatorOS 后端 API 客户端
// 对接 backend/app/api/workflows.py + auth.py

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",  // cookie session
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ===== Auth =====

export async function login(username: string, password: string): Promise<{ username: string }> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<{ username: string } | null> {
  try {
    return await apiFetch("/api/auth/me");
  } catch {
    return null;
  }
}

// ===== Workflow =====

export interface WorkflowView {
  workflow: {
    id: string;
    channel_id: string | null;
    status: string;
    current_stage: string | null;
    kind: string;
    input: Record<string, unknown>;
    created_at: string;
  };
  stages: Array<{
    id: string;
    stage_code: string;
    stage_name: string;
    stage_slug: string;
    order: number;
    status: string;
    output_artifact: Record<string, unknown> | null;
    error: string | null;
    started_at: string | null;
    completed_at: string | null;
  }>;
}

export async function createWorkflow(body: {
  seed_keywords?: string[];
  platform?: string;
  language?: string;
  kind?: string;
  title?: string;
  user_data?: string;
  channel_desc?: string;
}): Promise<WorkflowView> {
  return apiFetch("/api/workflows", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getWorkflow(id: string): Promise<WorkflowView> {
  return apiFetch(`/api/workflows/${id}`);
}

export async function listWorkflows(): Promise<{ workflows: WorkflowView["workflow"][] }> {
  return apiFetch("/api/workflows");
}

export async function runWorkflow(id: string): Promise<WorkflowView> {
  return apiFetch(`/api/workflows/${id}/run`, { method: "POST" });
}

export async function runStage(wfId: string, stageCode: string, config?: Record<string, unknown>): Promise<WorkflowView> {
  return apiFetch(`/api/workflows/${wfId}/stages/${stageCode}/run`, {
    method: "POST",
    body: JSON.stringify({ config: config ?? {} }),
  });
}

export async function approveStage(wfId: string, stageCode: string, body?: { notes?: string }): Promise<WorkflowView> {
  return apiFetch(`/api/workflows/${wfId}/stages/${stageCode}/approve`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export async function rejectStage(wfId: string, stageCode: string, reason: string): Promise<WorkflowView> {
  return apiFetch(`/api/workflows/${wfId}/stages/${stageCode}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// SSE stream for real-time events
export function streamUrl(wfId: string): string {
  return `${API_BASE}/api/workflows/${wfId}/events/stream`;
}
