// 来源 计划 D-E ②/④
// Zustand store: workbench run state + simulate engine.
// Timer IDs stored module-level (NOT in zustand state) so they can be cleared anytime.
// UI effects (ChatArtifactCard appends) are driven by observing status flips in C3 — not here.

import { create } from "zustand";
import type { RunFlow, RunStatus, NodeRun, ChecklistItem, StageFlowIO, WorkflowNode, StageDef } from "@/types";
import { dataProvider } from "@/services/dataProvider";
import type { WorkflowView } from "@/services/workflowClient";
import { useConfig } from "@/store/configStore";
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
  stageVersion: number; // 每次阶段数据更新时递增，触发抽屉重载

  // S5 选题状态
  selectedTopicIdx: number | null;
  lockedTopicIdx: number | null;

  // S7 脚本编辑
  editedScript: string;

  // S8 回滚目标
  rollbackTarget: string | null;

  // 自动化模式
  autoMode: boolean;
  currentAutoStep: string; // 'idle' | 's5' | 's6' | 's6_review' | 's7' | 's7_edit' | 's8' | 's8_review' | 'done'

  // 进度跟踪
  progressPct: number;
  progressElapsed: string;
  progressRemaining: string;

  // 运行历史
  agentHistory: Array<{ id: string; stage: string; summary: string; timestamp: string; data: unknown }>;
  stageCurrentHist: Record<string, string>;

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
  createAndRunS5(userData: string, channelDesc: string): Promise<void>;
  createAndRunS5FromS4(): Promise<void>;
  approveBackend(code: string): Promise<void>;
  rejectBackend(code: string, reason: string, rollbackTo?: string): Promise<void>;
  navigateStage(direction: number): void;
  agentSaveHistory(stageId: string, summary: string, data: unknown): void;
  agentRollback(histId: string): void;
  selectTopic(idx: number): void;
  lockTopic(): void;
  unlockTopic(): void;
  setEditedScript(text: string): void;
  setRollbackTarget(target: string | null): void;
  runFullWorkflow(): Promise<void>;
  approveAndContinue(): Promise<void>;
  rejectAndRollback(target: string): Promise<void>;
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
    stageVersion: get().stageVersion + 1,
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
    stageVersion: 0,
    selectedTopicIdx: null,
    lockedTopicIdx: null,
    editedScript: "",
    rollbackTarget: null,
    autoMode: false,
    currentAutoStep: "idle",
    progressPct: 0,
    progressElapsed: "0s",
    progressRemaining: "",
    agentHistory: [],
    stageCurrentHist: {},

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

    async createAndRunS5FromS4() {
      // 从 S4 热点数据自动生成输入数据
      const { HOTSPOTS } = await import("@/data/hotspots");
      const hotspotText = HOTSPOTS.slice(0, 5).map(h =>
        `【${h.title}】${h.angle}（${h.expire}，来源：${h.srcs.join('、')}）`
      ).join('\n');
      const userData = `基于以下热点数据进行选题：\n\n${hotspotText}`;
      const channelDesc = "AI 工具评测频道，聚焦编程效率工具，受众是独立开发者";
      return this.createAndRunS5(userData, channelDesc);
    },

    async createAndRunS5(userData: string, channelDesc: string) {
      const STAGE_TIMES: Record<string, number> = { s5: 37, s6: 40, s7: 90, s8: 75 };
      const startTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const total = STAGE_TIMES["s5"] || 37;
        const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
        const remaining = Math.max(0, Math.round(total - elapsed));
        set({
          progressPct: pct,
          progressElapsed: elapsed < 60 ? Math.round(elapsed) + "s" : Math.floor(elapsed / 60) + "m" + Math.round(elapsed % 60) + "s",
          progressRemaining: remaining > 0 ? remaining + "s" : "即将完成...",
        });
      }, 100);
      set({ simPhase: "running", runningStage: "s5", progressPct: 0, progressElapsed: "0s", progressRemaining: "" });
      try {
        const wfId = await dataProvider.createWorkflowOnly(userData, channelDesc);
        set({ wfId });
        const s5Config = useConfig.getState().getS5Config();
        const wfv = await dataProvider.runS5(wfId, s5Config);
        clearInterval(progressTimer);
        set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });
        _syncStagesToRun(wfv, set, get);
        // 保存历史
        const topics = wfv.stages.find(s => s.stage_code === "S5")?.output_artifact?.topics;
        get().agentSaveHistory("s5", `生成 ${Array.isArray(topics) ? topics.length : 0} 个选题`, topics);
        set({ simPhase: "idle", runningStage: null });
        get().loadStages();
      } catch (e) {
        clearInterval(progressTimer);
        console.error("S5 failed:", e);
        set({ simPhase: "idle", runningStage: null, progressPct: 0 });
      }
    },

    async runStage(stageCode: string, config: Record<string, unknown> = {}) {
      const { wfId } = get();
      if (!wfId) return;
      const STAGE_TIMES: Record<string, number> = { s5: 37, s6: 40, s7: 90, s8: 75 };
      const key = stageCode.toLowerCase();
      const startTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const total = STAGE_TIMES[key] || 60;
        const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
        const remaining = Math.max(0, Math.round(total - elapsed));
        set({
          progressPct: pct,
          progressElapsed: elapsed < 60 ? Math.round(elapsed) + "s" : Math.floor(elapsed / 60) + "m" + Math.round(elapsed % 60) + "s",
          progressRemaining: remaining > 0 ? remaining + "s" : "即将完成...",
        });
      }, 100);
      set({ simPhase: "running", runningStage: key, progressPct: 0, progressElapsed: "0s", progressRemaining: "" });
      try {
        // 从 configStore 读取配置
        const cfg = useConfig.getState();
        const stageConfig = Object.keys(config).length > 0 ? config :
          stageCode === "S5" ? cfg.getS5Config() :
          stageCode === "S6" ? cfg.getS6Config() :
          stageCode === "S7" ? cfg.getS7Config() :
          stageCode === "S8" ? cfg.getS8Config() : {};

        let wfv;
        if (stageCode === "S5") wfv = await dataProvider.runS5(wfId, stageConfig);
        else if (stageCode === "S6") wfv = await dataProvider.runS6(wfId, stageConfig);
        else if (stageCode === "S7") wfv = await dataProvider.runS7(wfId, stageConfig);
        else if (stageCode === "S8") wfv = await dataProvider.runS8(wfId, stageConfig);

        clearInterval(progressTimer);
        set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });

        if (wfv) {
          _syncStagesToRun(wfv, set, get);
          // 保存历史
          const stage = wfv.stages.find(s => s.stage_code === stageCode);
          const artifact = stage?.output_artifact;
          const summary = stageCode === "S5" ? `选题 ${(artifact?.topics as unknown[])?.length || 0} 个` :
            stageCode === "S6" ? `大纲 ${(artifact?.outline as unknown[])?.length || 0} 章` :
            stageCode === "S7" ? `脚本 ${artifact?.word_count || 0} 字` :
            stageCode === "S8" ? `对抗审核 平均${artifact?.average_score || 0}分` : stageCode;
          get().agentSaveHistory(key, summary, artifact);
        }
        set({ simPhase: "idle", runningStage: null });
        get().loadStages();
      } catch (e) {
        clearInterval(progressTimer);
        console.error(`${stageCode} failed:`, e);
        set({ simPhase: "idle", runningStage: null, progressPct: 0 });
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

    async rejectBackend(code: string, reason: string, rollbackTo?: string) {
      const { wfId } = get();
      if (!wfId) return;
      try {
        const wfv = await dataProvider.rejectStage(wfId, code, reason, rollbackTo);
        _syncStagesToRun(wfv, set, get);
        get().loadStages();
      } catch (e) {
        console.error(`Reject ${code} failed:`, e);
      }
    },

    navigateStage(direction: number) {
      const ORDER = ["s5", "s6", "s7", "s8"];
      // 优先从 run.nodes 中找当前阶段（更可靠）
      let currentIdx = -1;
      const { run, currentNodeId } = get();
      for (let i = ORDER.length - 1; i >= 0; i--) {
        const nodeStatus = run.nodes[ORDER[i]]?.status;
        if (nodeStatus === "active" || nodeStatus === "awaiting_review") {
          currentIdx = i;
          break;
        }
      }
      if (currentIdx < 0) currentIdx = ORDER.indexOf(currentNodeId);
      if (currentIdx < 0) return;
      const nextIdx = currentIdx + direction;
      if (nextIdx < 0 || nextIdx >= ORDER.length) return;
      const nextId = ORDER[nextIdx];
      set((s) => ({
        currentNodeId: nextId,
        run: { ...s.run, currentNodeId: nextId },
      }));
      // 打开抽屉
      import("@/store/uiStore").then(({ useUi }) => {
        useUi.getState().openStage(nextId);
      });
    },

    agentSaveHistory(stageId: string, summary: string, data: unknown) {
      const histId = "hist_" + Date.now();
      set((s) => ({
        agentHistory: [
          { id: histId, stage: stageId, summary, timestamp: new Date().toLocaleString("zh-CN"), data },
          ...s.agentHistory,
        ].slice(0, 20),
        stageCurrentHist: { ...s.stageCurrentHist, [stageId]: histId },
      }));
    },

    agentRollback(histId: string) {
      const { agentHistory } = get();
      const hist = agentHistory.find((h) => h.id === histId);
      if (!hist) return;
      // 回滚到历史版本的产物
      set((s) => {
        const nodes = { ...s.run.nodes };
        nodes[hist.stage] = { ...nodes[hist.stage], status: "done" as RunStatus };
        return { run: { ...s.run, nodes } };
      });
      get().loadStages();
    },

    selectTopic(idx: number) {
      set({ selectedTopicIdx: idx });
    },

    lockTopic() {
      const { selectedTopicIdx } = get();
      if (selectedTopicIdx === null) return;
      set({ lockedTopicIdx: selectedTopicIdx });
    },

    unlockTopic() {
      set({ lockedTopicIdx: null });
    },

    setEditedScript(text: string) {
      set({ editedScript: text });
    },

    setRollbackTarget(target: string | null) {
      set({ rollbackTarget: target });
    },

    // ===== 自动化工作流 =====

    async runFullWorkflow() {
      set({ autoMode: true, currentAutoStep: "s5" });

      // Step 1: 从S4获取数据，创建workflow
      const { HOTSPOTS } = await import("@/data/hotspots");
      const hotspotText = HOTSPOTS.slice(0, 5).map(h =>
        `【${h.title}】${h.angle}（${h.expire}）`
      ).join("\n");
      const userData = `基于以下热点数据进行选题：\n\n${hotspotText}`;
      const channelDesc = "AI 工具评测频道";

      // Step 2: 创建workflow + 运行S5
      const STAGE_TIMES: Record<string, number> = { s5: 37, s6: 40, s7: 90, s8: 75 };
      const startTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const total = STAGE_TIMES["s5"] || 37;
        const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
        const remaining = Math.max(0, Math.round(total - elapsed));
        set({
          progressPct: pct,
          progressElapsed: elapsed < 60 ? Math.round(elapsed) + "s" : Math.floor(elapsed / 60) + "m" + Math.round(elapsed % 60) + "s",
          progressRemaining: remaining > 0 ? remaining + "s" : "即将完成...",
        });
      }, 100);

      set({ simPhase: "running", runningStage: "s5", progressPct: 0, progressElapsed: "0s", progressRemaining: "" });
      // 立即更新工作台 S5 节点为 active
      set((s) => ({ run: { ...s.run, nodes: { ...s.run.nodes, s5: { ...s.run.nodes.s5, status: "active" as RunStatus, percent: 0 } } } }));

      try {
        const wfId = await dataProvider.createWorkflowOnly(userData, channelDesc);
        set({ wfId });
        const s5Config = useConfig.getState().getS5Config();
        const wfv5 = await dataProvider.runS5(wfId, s5Config);
        clearInterval(progressTimer);
        set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });
        _syncStagesToRun(wfv5, set, get);

        // Step 3: 自动锁定最高分选题
        const topics = (wfv5.stages.find(s => s.stage_code === "S5")?.output_artifact?.topics ?? []) as Array<{ score: number }>;
        if (topics.length > 0) {
          const bestIdx = topics.reduce((maxI, t, i, arr) => t.score > arr[maxI].score ? i : maxI, 0);
          set({ selectedTopicIdx: bestIdx, lockedTopicIdx: bestIdx });
        }

        // Step 4: 自动运行S6
        set({ currentAutoStep: "s6", runningStage: "s6", progressPct: 0 });
        // S5 done → S6 active
        set((s) => ({
          run: {
            ...s.run,
            nodes: {
              ...s.run.nodes,
              s5: { ...s.run.nodes.s5, status: "done" as RunStatus, percent: 100 },
              s6: { ...s.run.nodes.s6, status: "active" as RunStatus, percent: 0 },
            },
          },
        }));
        get().loadStages();
        // 延迟 500ms 确保 UI 刷新显示 S5→S6 过渡
        await new Promise(resolve => setTimeout(resolve, 500));
        const s6Config = useConfig.getState().getS6Config();
        const wfv6 = await dataProvider.runS6(wfId, s6Config);
        _syncStagesToRun(wfv6, set, get);

        // Step 5: S6等待审核
        set({ currentAutoStep: "s6_review", simPhase: "idle", runningStage: null });
        get().loadStages();
      } catch (e) {
        clearInterval(progressTimer);
        console.error("runFullWorkflow failed:", e);
        set({ autoMode: false, currentAutoStep: "idle", simPhase: "idle", runningStage: null, progressPct: 0 });
      }
    },

    async approveAndContinue() {
      const { wfId, currentAutoStep } = get();
      if (!wfId) return;

      const STAGE_TIMES: Record<string, number> = { s7: 90, s8: 75 };

      try {
        if (currentAutoStep === "s6_review") {
          await dataProvider.approveStage(wfId, "S6");
          // S6 completed → S7 active
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s6: { ...s.run.nodes.s6, status: "done" as RunStatus, percent: 100 },
                s7: { ...s.run.nodes.s7, status: "active" as RunStatus, percent: 0 },
              },
            },
          }));
          get().loadStages();
          // 延迟 500ms 确保 UI 刷新
          await new Promise(resolve => setTimeout(resolve, 500));

          // 运行 S7 带进度
          const startTime = Date.now();
          const total = STAGE_TIMES["s7"] || 90;
          set({ currentAutoStep: "s7", simPhase: "running", runningStage: "s7", progressPct: 0 });
          // S7 → active in workbench
          set((s) => ({ run: { ...s.run, nodes: { ...s.run.nodes, s7: { ...s.run.nodes.s7, status: "active" as RunStatus, percent: 0 } } } }));
          get().loadStages();
          const progressTimer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
            const remaining = Math.max(0, Math.round(total - elapsed));
            set({ progressPct: pct, progressElapsed: Math.round(elapsed) + "s", progressRemaining: remaining + "s" });
          }, 100);

          const s7Config = useConfig.getState().getS7Config();
          const wfv7 = await dataProvider.runS7(wfId, s7Config);
          clearInterval(progressTimer);
          set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });
          _syncStagesToRun(wfv7, set, get);

          const script = (wfv7.stages.find(s => s.stage_code === "S7")?.output_artifact?.body_md as string) || "";
          set({ editedScript: script, currentAutoStep: "s7_edit", simPhase: "idle", runningStage: null, progressPct: 0 });
          get().loadStages();
          // 等待 UI 显示 S7 完成状态
          await new Promise(resolve => setTimeout(resolve, 1000));

        } else if (currentAutoStep === "s7_edit") {
          // S7 确认 → 等待 UI 刷新 → 运行 S8 带进度
          const startTime = Date.now();
          const total = STAGE_TIMES["s8"] || 75;
          set({ currentAutoStep: "s8", simPhase: "running", runningStage: "s8", progressPct: 0 });
          // S7 done → S8 active in workbench
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s7: { ...s.run.nodes.s7, status: "done" as RunStatus, percent: 100 },
                s8: { ...s.run.nodes.s8, status: "active" as RunStatus, percent: 0 },
              },
            },
          }));
          get().loadStages();
          // 延迟 500ms 确保 UI 刷新
          await new Promise(resolve => setTimeout(resolve, 500));
          const progressTimer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
            const remaining = Math.max(0, Math.round(total - elapsed));
            set({ progressPct: pct, progressElapsed: Math.round(elapsed) + "s", progressRemaining: remaining + "s" });
          }, 100);

          const s8Config = useConfig.getState().getS8Config();
          const wfv8 = await dataProvider.runS8(wfId, s8Config);
          clearInterval(progressTimer);
          set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });
          _syncStagesToRun(wfv8, set, get);
          set({ currentAutoStep: "s8_review", simPhase: "idle", runningStage: null, progressPct: 0 });
          get().loadStages();

        } else if (currentAutoStep === "s8_review") {
          await dataProvider.approveStage(wfId, "S8");
          set({ currentAutoStep: "done", autoMode: false, simPhase: "idle", runningStage: null, progressPct: 0 });
          get().loadStages();
        }
      } catch (e) {
        console.error("approveAndContinue failed:", e);
        set({ simPhase: "idle", runningStage: null, progressPct: 0 });
      }
    },

    async rejectAndRollback(target: string) {
      const { wfId } = get();
      if (!wfId) return;

      try {
        // 调用后端驳回
        await dataProvider.rejectStage(wfId, "S8", `回滚到${target}`);
        set({ rollbackTarget: target, currentAutoStep: target, simPhase: "running" });

        // 根据回滚目标重新运行
        if (target === "s5") {
          // 清空所有，重新运行S5
          set({ runningStage: "s5" });
          const s5Config = useConfig.getState().getS5Config();
          const wfv = await dataProvider.runS5(wfId, s5Config);
          _syncStagesToRun(wfv, set, get);
          // 自动锁定最高分选题
          const topics = (wfv.stages.find(s => s.stage_code === "S5")?.output_artifact?.topics ?? []) as Array<{ score: number }>;
          if (topics.length > 0) {
            const bestIdx = topics.reduce((maxI, t, i, arr) => t.score > arr[maxI].score ? i : maxI, 0);
            set({ selectedTopicIdx: bestIdx, lockedTopicIdx: bestIdx });
          }
          set({ currentAutoStep: "s6" });
        } else if (target === "s6") {
          set({ runningStage: "s6" });
          const s6Config = useConfig.getState().getS6Config();
          const wfv = await dataProvider.runS6(wfId, s6Config);
          _syncStagesToRun(wfv, set, get);
          set({ currentAutoStep: "s6_review" });
        } else if (target === "s7") {
          set({ runningStage: "s7" });
          const s7Config = useConfig.getState().getS7Config();
          const wfv = await dataProvider.runS7(wfId, s7Config);
          _syncStagesToRun(wfv, set, get);
          const script = (wfv.stages.find(s => s.stage_code === "S7")?.output_artifact?.body_md as string) || "";
          set({ editedScript: script, currentAutoStep: "s7_edit" });
        }

        set({ simPhase: "idle", runningStage: null });
        get().loadStages();
      } catch (e) {
        console.error("rejectAndRollback failed:", e);
        set({ simPhase: "idle", runningStage: null });
      }
    },
  };
});
