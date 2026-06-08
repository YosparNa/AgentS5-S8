// 来源 计划 D-E ②/④
// Zustand store: workbench run state + simulate engine.
// Timer IDs stored module-level (NOT in zustand state) so they can be cleared anytime.
// UI effects (ChatArtifactCard appends) are driven by observing status flips in C3 — not here.

import { create } from "zustand";
import type { RunFlow, RunStatus, NodeRun, ChecklistItem, StageFlowIO, WorkflowNode, StageDef } from "@/types";
import { dataProvider } from "@/services/dataProvider";
import type { WorkflowView } from "@/services/workflowClient";
// G1: all mock data (nodes / stage defs / per-stage simulate targets) is pulled
// through dataProvider into store state — the store no longer imports src/data
// directly, so the whole workbench data path is a single backend seam.

// Simulate order: s1 through s8 inclusive (L2 + L3 early stages)
const SIM_ORDER = ["s1", "s2", "s25", "s3", "s4", "s5", "s6", "s7", "s8"] as const;

// Module-level timer registry — cleared on stop/reset
let _timers: number[] = [];

function clearAllTimers() {
  for (const t of _timers) window.clearTimeout(t);
  _timers = [];
}

function schedule(fn: () => void, delayMs: number): number {
  const id = window.setTimeout(() => {
    // Remove from list once fired
    _timers = _timers.filter((t) => t !== id);
    fn();
  }, delayMs) as unknown as number;
  _timers.push(id);
  return id;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SimPhase = "idle" | "running" | "awaiting_review" | "done";

interface RunState {
  run: RunFlow;
  currentNodeId: string;
  simPhase: SimPhase;
  pendingNodeId: string | null;

  /** Editable node list — single source of truth (replaces local FlowStrip state) */
  nodes: WorkflowNode[];
  /** Stage definitions, injected from dataProvider so workbench components
   *  read stage meta from the store instead of importing src/data directly. */
  stages: Record<string, StageDef>;
  /** Per-stage simulate targets (checklist/context/counts), injected from dataProvider. */
  stageRunMock: Record<string, Partial<NodeRun>>;

  // S5-S8 后端对接
  wfId: string | null;
  runningStage: string | null;

  // Actions
  loadRun(wfId?: string): void;
  loadNodes(wfId?: string): void;
  loadStages(): void;
  toggleNode(nodeId: string): void;
  removeNode(nodeId: string): void;
  nodeStatus(nodeId: string): RunStatus;
  simulate(): void;
  stopSim(): void;
  resetSim(): void;
  approveReview(): void;
  rejectReview(): void;
  removeNodeRun(nodeId: string): void;
  runStage(stageCode: string, config?: Record<string, unknown>): Promise<void>;
  createAndRunS5(userData: string, channelDesc: string, config?: Record<string, unknown>): Promise<void>;
  approveBackend(code: string): Promise<void>;
  rejectBackend(code: string, reason: string): Promise<void>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Looks up nodeId in the store's nodes array (loaded via dataProvider before simulate runs). */
function findNode(nodeId: string, nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find((n) => n.nodeId === nodeId);
}

function isAuditNode(nodeId: string, nodes: WorkflowNode[]): boolean {
  const node = findNode(nodeId, nodes);
  // Only audit gates within s1..s8 are s3 ①, s6 ②, s8 ③
  return !!(node?.audit && SIM_ORDER.includes(nodeId as (typeof SIM_ORDER)[number]));
}

function isEnabled(nodeId: string, nodes: WorkflowNode[]): boolean {
  const node = findNode(nodeId, nodes);
  return node?.enabled !== false;
}

/** 将后端 WorkflowView 的 stages 状态同步到 runStore 的 run.nodes */
function _syncStagesToRun(wfv: WorkflowView, set: Function, get: Function) {
  const runNodes: Record<string, NodeRun> = { ...get().run.nodes };
  for (const s of wfv.stages) {
    const key = s.stage_code.toLowerCase();
    const status = s.status as RunStatus;
    const isDone = s.status === "completed" || s.status === "done";
    runNodes[key] = {
      ...runNodes[key],
      status: isDone ? "done" : status,
      percent: isDone ? 100 : status === "active" ? 50 : 0,
      doneCount: isDone ? 1 : 0,
      totalCount: 1,
    };
  }
  // 确定 currentNodeId
  let currentNodeId = get().currentNodeId;
  for (const s of wfv.stages) {
    if (s.status === "active" || s.status === "awaiting_review") {
      currentNodeId = s.stage_code.toLowerCase();
    }
  }
  set({
    run: { ...get().run, currentNodeId, nodes: runNodes },
    currentNodeId,
    pendingNodeId: wfv.stages.find(s => s.status === "awaiting_review")?.stage_code.toLowerCase() ?? null,
    simPhase: wfv.stages.find(s => s.status === "awaiting_review") ? "awaiting_review" : "idle",
  });
}

/** Build an initial NodeRun for a node entering 'active' state */
function buildActiveNodeRun(nodeId: string, stageRunMock: Record<string, Partial<NodeRun>>): NodeRun {
  const mock = stageRunMock[nodeId];
  if (!mock) {
    return { status: "active", percent: 0, doneCount: 0, totalCount: 1 };
  }

  const checklist: ChecklistItem[] = (mock.checklist ?? []).map((c) => ({
    label: c.label,
    done: false,
  }));
  const mountedContext: StageFlowIO[] = (mock.mountedContext ?? []).map((m) => ({ ...m }));

  return {
    status: "active",
    percent: 0,
    doneCount: 0,
    totalCount: mock.totalCount ?? checklist.length,
    currentItem: mock.currentItem,
    checklist,
    mountedContext,
  };
}

/**
 * Terminal S9 'active' run state — the post-S8 end state (≈ PROTO screenshot:
 * 76% · 29/38, mid-checklist). Unlike a fresh activation, S9 keeps its partial
 * progress (percent/doneCount/currentItem) and a partially-ticked checklist so
 * AgentStream / StudioPanel / LiveTab all show a real running stage, not an
 * empty 'active' node.
 */
function buildS9TerminalRun(stageRunMock: Record<string, Partial<NodeRun>>): NodeRun {
  const mock = stageRunMock["s9"];
  const srcChecklist = mock?.checklist ?? [];
  const checklist: ChecklistItem[] = srcChecklist.map((c, i, arr) => ({
    label: c.label,
    done: i < arr.length - 1, // all but the in-progress last item are done
  }));
  return {
    status: "active",
    percent: mock?.percent ?? 76,
    doneCount: mock?.doneCount ?? 29,
    totalCount: mock?.totalCount ?? 38,
    currentItem: mock?.currentItem ?? "M-018",
    checklist,
    mountedContext: (mock?.mountedContext ?? []).map((m) => ({ ...m })),
  };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useRun = create<RunState>((set, get) => {
  /** Run the simulate chain starting from a given index in SIM_ORDER */
  function runFrom(startIndex: number) {
    set({ simPhase: "running" });
    runNode(startIndex);
  }

  function runNode(index: number) {
    if (index >= SIM_ORDER.length) {
      // All sim nodes done — S9 becomes the active running stage WITH full run
      // state (percent / checklist / currentItem), matching the PROTO end state.
      const s9Run = buildS9TerminalRun(get().stageRunMock);
      set((s) => ({
        simPhase: "done",
        currentNodeId: "s9",
        run: {
          ...s.run,
          currentNodeId: "s9",
          nodes: {
            ...s.run.nodes,
            s9: s9Run,
          },
        },
      }));
      return;
    }

    const nodeId = SIM_ORDER[index];
    const storeNodes = get().nodes;

    // Skip removed nodes (not present in store nodes)
    if (storeNodes.length > 0 && !storeNodes.find((n) => n.nodeId === nodeId)) {
      schedule(() => runNode(index + 1), 50);
      return;
    }

    // Skip disabled nodes
    if (!isEnabled(nodeId, storeNodes)) {
      set((s) => ({
        run: {
          ...s.run,
          nodes: {
            ...s.run.nodes,
            [nodeId]: { status: "skipped" },
          },
        },
      }));
      schedule(() => runNode(index + 1), 50);
      return;
    }

    // Activate this node
    const activeRun = buildActiveNodeRun(nodeId, get().stageRunMock);
    set((s) => ({
      currentNodeId: nodeId,
      run: {
        ...s.run,
        currentNodeId: nodeId,
        nodes: {
          ...s.run.nodes,
          [nodeId]: activeRun,
        },
      },
    }));

    // Tick checklist items
    const checklist = activeRun.checklist ?? [];
    const totalItems = checklist.length > 0 ? checklist.length : 1;
    // Approximate 2s per stage → 500ms per checklist item (if 3 items → 1500ms, close to 2s)
    const ITEM_DELAY = 500;

    tickChecklist(nodeId, 0, totalItems, ITEM_DELAY, () => {
      onNodeComplete(nodeId, index);
    });
  }

  function tickChecklist(
    nodeId: string,
    itemIndex: number,
    totalItems: number,
    delay: number,
    onDone: () => void
  ) {
    schedule(() => {
      set((s) => {
        const node = s.run.nodes[nodeId];
        if (!node || node.status !== "active") return s; // guard: stopped

        const checklist = node.checklist ? [...node.checklist] : [];
        if (itemIndex < checklist.length) {
          checklist[itemIndex] = { ...checklist[itemIndex], done: true };
        }

        const doneCount = itemIndex + 1;
        const percent = Math.round((doneCount / totalItems) * 100);

        return {
          run: {
            ...s.run,
            nodes: {
              ...s.run.nodes,
              [nodeId]: {
                ...node,
                checklist,
                doneCount,
                percent,
              },
            },
          },
        };
      });

      if (itemIndex + 1 < totalItems) {
        tickChecklist(nodeId, itemIndex + 1, totalItems, delay, onDone);
      } else {
        // All items done
        schedule(onDone, delay);
      }
    }, delay);
  }

  function onNodeComplete(nodeId: string, index: number) {
    if (isAuditNode(nodeId, get().nodes)) {
      // Pause for human review
      set((s) => ({
        simPhase: "awaiting_review",
        pendingNodeId: nodeId,
        run: {
          ...s.run,
          nodes: {
            ...s.run.nodes,
            [nodeId]: {
              ...s.run.nodes[nodeId],
              status: "awaiting_review",
            },
          },
        },
      }));
      // Chain continues via approveReview/rejectReview
      return;
    }

    // Mark done and continue
    const producedAt = new Date().toISOString();
    set((s) => ({
      run: {
        ...s.run,
        nodes: {
          ...s.run.nodes,
          [nodeId]: {
            ...s.run.nodes[nodeId],
            status: "done",
            percent: 100,
            producedAt,
          },
        },
      },
    }));

    schedule(() => runNode(index + 1), 200);
  }

  // ── Public store ────────────────────────────────────────────────────────

  return {
    run: { currentNodeId: "s1", nodes: {} },
    currentNodeId: "s1",
    simPhase: "idle",
    pendingNodeId: null,
    nodes: [],
    stages: {},
    stageRunMock: {},
    wfId: null,
    runningStage: null,

    loadStages() {
      dataProvider.getStages().then((s) => set({ stages: s }));
    },

    loadNodes(wfId) {
      dataProvider.getWorkflowNodes(wfId).then((ns) => set({ nodes: ns }));
    },

    toggleNode(nodeId) {
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.nodeId === nodeId ? { ...n, enabled: !n.enabled } : n
        ),
      }));
    },

    removeNode(nodeId) {
      set((s) => {
        // Remove from nodes list
        const nodes = s.nodes.filter((n) => n.nodeId !== nodeId);
        // Also remove run entry
        const runNodes = { ...s.run.nodes };
        delete runNodes[nodeId];
        return {
          nodes,
          run: { ...s.run, nodes: runNodes },
        };
      });
    },

    loadRun(wfId) {
      // Load per-stage simulate targets too, so the engine has them before any
      // simulate() click (which only happens well after mount).
      dataProvider.getStageRunMock().then((m) => set({ stageRunMock: m }));
      dataProvider.getRunFlow(wfId).then((loaded) => {
        clearAllTimers();
        set({
          run: loaded,
          currentNodeId: loaded.currentNodeId,
          simPhase: "idle",
          pendingNodeId: null,
        });
      });
    },

    nodeStatus(nodeId) {
      return get().run.nodes[nodeId]?.status ?? "pending";
    },

    simulate() {
      const { simPhase } = get();
      if (simPhase === "running" || simPhase === "awaiting_review") return;

      clearAllTimers();
      // Find where to resume: first non-done node in SIM_ORDER
      const nodes = get().run.nodes;
      let startIndex = 0;
      for (let i = 0; i < SIM_ORDER.length; i++) {
        const st = nodes[SIM_ORDER[i]]?.status;
        if (st === "done" || st === "skipped") {
          startIndex = i + 1;
        } else {
          break;
        }
      }

      runFrom(startIndex);
    },

    stopSim() {
      clearAllTimers();
      set({ simPhase: "idle" });
    },

    resetSim() {
      clearAllTimers();
      set({ simPhase: "idle", pendingNodeId: null });
      get().loadRun();
    },

    approveReview() {
      const { pendingNodeId, run } = get();
      if (!pendingNodeId) return;

      const producedAt = new Date().toISOString();

      // Find the index of pendingNodeId in SIM_ORDER to continue from next
      const idx = SIM_ORDER.indexOf(pendingNodeId as (typeof SIM_ORDER)[number]);

      set({
        pendingNodeId: null,
        simPhase: "running",
        run: {
          ...run,
          nodes: {
            ...run.nodes,
            [pendingNodeId]: {
              ...run.nodes[pendingNodeId],
              status: "done",
              percent: 100,
              producedAt,
            },
          },
        },
      });

      // Resume from next node
      schedule(() => runNode(idx + 1), 200);
    },

    rejectReview() {
      const { pendingNodeId, run } = get();
      if (!pendingNodeId) return;

      set({
        simPhase: "idle",
        pendingNodeId: null,
        run: {
          ...run,
          nodes: {
            ...run.nodes,
            [pendingNodeId]: {
              ...run.nodes[pendingNodeId],
              status: "rejected",
            },
          },
        },
      });

      clearAllTimers();
    },

    removeNodeRun(nodeId) {
      set((s) => {
        const nodes = { ...s.run.nodes };
        delete nodes[nodeId];
        return {
          run: {
            ...s.run,
            nodes,
          },
        };
      });
    },

    // ===== S5-S8 后端对接 =====

    async createAndRunS5(userData: string, channelDesc: string, config: Record<string, unknown> = {}) {
      set({ simPhase: "running", runningStage: "s5" });
      try {
        const wfId = await dataProvider.createWorkflowOnly(userData, channelDesc);
        set({ wfId });
        const wfv = await dataProvider.runS5(wfId, config);
        _syncStagesToRun(wfv, set, get);
        set({ simPhase: "idle", runningStage: null });
        get().loadStages();
      } catch (e) {
        console.error("S5 failed:", e);
        set({ simPhase: "idle", runningStage: null });
      }
    },

    async runStage(stageCode: string, config: Record<string, unknown> = {}) {
      const { wfId } = get();
      if (!wfId) return;
      const key = stageCode.toLowerCase();
      set({ simPhase: "running", runningStage: key });
      try {
        let wfv;
        if (stageCode === "S5") wfv = await dataProvider.runS5(wfId, config);
        else if (stageCode === "S6") wfv = await dataProvider.runS6(wfId, config);
        else if (stageCode === "S7") wfv = await dataProvider.runS7(wfId, config);
        else if (stageCode === "S8") wfv = await dataProvider.runS8(wfId, config);
        if (wfv) {
          _syncStagesToRun(wfv, set, get);
        }
        set({ simPhase: "idle", runningStage: null });
        get().loadStages();
      } catch (e) {
        console.error(`${stageCode} failed:`, e);
        set({ simPhase: "idle", runningStage: null });
      }
    },

    async approveBackend(code: string) {
      const { wfId } = get();
      if (!wfId) return;
      try {
        const wfv = await dataProvider.approveStage(wfId, code);
        _syncStagesToRun(wfv, set, get);
        get().loadStages();
      } catch (e) {
        console.error(`Approve ${code} failed:`, e);
      }
    },

    async rejectBackend(code: string, reason: string) {
      const { wfId } = get();
      if (!wfId) return;
      try {
        const wfv = await dataProvider.rejectStage(wfId, code, reason);
        _syncStagesToRun(wfv, set, get);
        get().loadStages();
      } catch (e) {
        console.error(`Reject ${code} failed:`, e);
      }
    },
  };
});
