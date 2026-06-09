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
let _histCounter = 0;

// 模拟模式：跳过等待，快速完成（与后端 MOCK_MODE 联动）
const MOCK_MODE = true;
const MOCK_STAGE_TIMES: Record<string, number> = { s5: 2, s6: 2, s7: 2, s8: 2 };

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
  agentHistory: Record<string, Array<{ id: string; stage: string; summary: string; timestamp: string; data: unknown }>>;
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
  _initStageChecklist(stageId: string): void;
  _updateChecklistProgress(stageId: string, pct: number): void;
  _forceLoadStages(): void;
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

/** 生成历史记录摘要 */
function _historySummary(stageId: string, output: Record<string, unknown> | null | undefined): string {
  if (!output || Object.keys(output).length === 0) return `${stageId.toUpperCase()} 完成`;
  if (stageId === "s5") {
    const topics = (output.topics ?? []) as Array<{ score: number; title: string }>;
    const best = topics.length > 0 ? Math.max(...topics.map(t => t.score)) : 0;
    return `生成 ${topics.length} 个选题，最高 ${best} 分`;
  }
  if (stageId === "s6") {
    const outline = (output.outline ?? []) as Array<unknown>;
    const dur = output.total_duration as string | undefined;
    return `大纲 ${outline.length} 章${dur ? `，${dur}` : ""}`;
  }
  if (stageId === "s7") {
    const wc = (output.word_count as number) ?? 0;
    return `脚本 ${wc.toLocaleString()} 字`;
  }
  if (stageId === "s8") {
    const roles = (output.roles ?? []) as Array<unknown>;
    const avg = output.average_score as number | undefined;
    return `${roles.length} 角色审核，综合 ${avg ?? "?"} 分`;
  }
  return `${stageId.toUpperCase()} 完成`;
}

/** S8 预计时间：每个启用角色 20s */
function _s8Time(): number {
  if (MOCK_MODE) return 2;
  const cfg = useConfig.getState().getS8Config();
  const count = Object.values(cfg).filter(v => v !== false).length;
  return Math.max(count, 1) * 20;
}

/** 将后端 WorkflowView 的 stages 状态同步到 runStore 的 run.nodes */
function _syncStagesToRun(wfv: WorkflowView, set: Function, get: Function) {
  const runNodes: Record<string, NodeRun> = { ...get().run.nodes };
  const currentAutoStep = get().currentAutoStep;

  // 不要覆盖正在运行或待确认的阶段
  const protectedStages = new Set<string>();
  if (currentAutoStep === "s7" || currentAutoStep === "s7_edit") protectedStages.add("s7");
  if (currentAutoStep === "s8" || currentAutoStep === "s8_review") protectedStages.add("s8");

  for (const s of wfv.stages) {
    const key = s.stage_code.toLowerCase();

    // 跳过受保护的阶段，避免覆盖正在进行的状态
    if (protectedStages.has(key)) continue;

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
    agentHistory: {},
    stageCurrentHist: {},

    loadStages() {
      dataProvider.getStages().then((s) => set({ stages: s }));
    },
    _forceLoadStages() {
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
      // 自动模式运行中不要重新加载，避免覆盖实时状态
      if (get().autoMode && get().runningStage) return;
      // 如果 wfId 未改变且 run 已有状态，则跳过重新加载（避免状态重置）
      if (wfId && get().wfId === wfId && Object.keys(get().run.nodes).length > 0) {
        return;
      }
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
      const STAGE_TIMES: Record<string, number> = MOCK_MODE ? MOCK_STAGE_TIMES : { s5: 47, s6: 55, s7: 120, s8: 75 };
      const startTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const total = STAGE_TIMES["s5"] || 47;
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
      const STAGE_TIMES: Record<string, number> = MOCK_MODE ? MOCK_STAGE_TIMES : { s5: 47, s6: 55, s7: 120, s8: 75 };
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
      const histId = "hist_" + Date.now() + "_" + (++_histCounter);
      const item = { id: histId, stage: stageId, summary, timestamp: new Date().toLocaleString("zh-CN"), data };
      set((s) => {
        const existing = s.agentHistory[stageId] ?? [];
        return {
          agentHistory: {
            ...s.agentHistory,
            [stageId]: [item, ...existing].slice(0, 10),
          },
          stageCurrentHist: { ...s.stageCurrentHist, [stageId]: histId },
        };
      });
    },

    async agentRollback(histId: string) {
      const { agentHistory } = get();
      // 在所有阶段中查找该历史记录
      let hist: { id: string; stage: string; summary: string; timestamp: string; data: unknown } | undefined;
      for (const items of Object.values(agentHistory)) {
        hist = items.find((h) => h.id === histId);
        if (hist) break;
      }
      if (!hist) return;
      // 恢复产物数据到 STAGES
      const stageDef = await dataProvider.getStage(hist.stage);
      if (stageDef && hist.data) {
        stageDef.output = hist.data as Record<string, unknown>;
      }
      // 更新节点状态
      set((s) => {
        const nodes = { ...s.run.nodes };
        nodes[hist.stage] = { ...nodes[hist.stage], status: "done" as RunStatus };
        return { run: { ...s.run, nodes }, stageVersion: s.stageVersion + 1 };
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

    // 初始化阶段 checklist（工作台 AgentStream 渲染用）
    _initStageChecklist(stageId: string) {
      const STEPS: Record<string, { label: string; icon: string }[]> = {
        s5: [
          { label: "分析 S4 热点数据", icon: "🔍" },
          { label: "生成候选选题", icon: "💡" },
          { label: "多维评分排序", icon: "📊" },
          { label: "锁定最优选题", icon: "🎯" },
        ],
        s6: [
          { label: "读取选题数据", icon: "📖" },
          { label: "分析频道定位", icon: "📡" },
          { label: "生成章节结构", icon: "🏗️" },
          { label: "标注危机钩子", icon: "⚠️" },
          { label: "计算张力曲线", icon: "📈" },
        ],
        s7: [
          { label: "读取大纲结构", icon: "📖" },
          { label: "分析章节钩子", icon: "🪝" },
          { label: "生成口播内容", icon: "🎙️" },
          { label: "应用禁用词过滤", icon: "🚫" },
          { label: "添加危机点转折", icon: "⚠️" },
        ],
        s8: [
          { label: "加载审核脚本", icon: "📖", configKey: null },
          { label: "杠精逻辑压力测试", icon: "😤", configKey: "nitpicker" },
          { label: "同行专业审核", icon: "🧑‍💻", configKey: "peer" },
          { label: "小白易懂性测试", icon: "😶", configKey: "novice" },
          { label: "老粉人设校验", icon: "❤️", configKey: "fan" },
          { label: "合规红线审查", icon: "⚖️", configKey: "compliance" },
        ].filter(s => {
          if (!s.configKey) return true; // "加载审核脚本" 始终显示
          const cfg = useConfig.getState().getS8Config();
          return cfg[s.configKey as keyof typeof cfg] !== false;
        }),
      };
      const steps = STEPS[stageId] ?? [];
      const checklist: ChecklistItem[] = steps.map(s => ({ label: `${s.icon} ${s.label}`, done: false }));
      set((s) => ({
        run: {
          ...s.run,
          nodes: {
            ...s.run.nodes,
            [stageId]: {
              ...s.run.nodes[stageId],
              status: "active" as RunStatus,
              percent: 0,
              checklist,
              doneCount: 0,
              totalCount: checklist.length,
              currentItem: checklist[0]?.label ?? "",
            },
          },
        },
      }));
    },

    // 根据 progressPct 更新 checklist 完成状态
    _updateChecklistProgress(stageId: string, pct: number) {
      const node = get().run.nodes[stageId];
      if (!node?.checklist || node.checklist.length === 0) return;
      const total = node.checklist.length;
      const doneCount = Math.min(Math.floor((pct / 100) * total), total);
      const updated = node.checklist.map((item, i) => ({ ...item, done: i < doneCount }));
      const currentItem = doneCount < total ? updated[doneCount].label : "";
      set((s) => ({
        run: {
          ...s.run,
          nodes: {
            ...s.run.nodes,
            [stageId]: {
              ...s.run.nodes[stageId],
              checklist: updated,
              doneCount,
              totalCount: total,
              currentItem,
              percent: pct,
            },
          },
        },
      }));
    },

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
      const STAGE_TIMES: Record<string, number> = MOCK_MODE ? MOCK_STAGE_TIMES : { s5: 47, s6: 55, s7: 120, s8: 75 };
      const startTime = Date.now();

      set({ simPhase: "running", runningStage: "s5", progressPct: 0, progressElapsed: "0s", progressRemaining: "" });
      // 初始化 checklist 并更新工作台 S5 节点为 active
      get()._initStageChecklist("s5");

      let progressTimer: ReturnType<typeof setInterval> | undefined;
      try {
        const wfId = await dataProvider.createWorkflowOnly(userData, channelDesc);
        set({ wfId });
        const s5Config = useConfig.getState().getS5Config();

        // 进度更新（含 checklist 同步）
        if (MOCK_MODE) {
          set({ progressPct: 0, progressElapsed: "", progressRemaining: "" });
          // mock模式：API返回后直接设100
        } else {
          progressTimer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const total = STAGE_TIMES["s5"] || 47;
            const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
            const remaining = Math.max(0, Math.round(total - elapsed));
            set({
              progressPct: pct,
              progressElapsed: elapsed < 60 ? Math.round(elapsed) + "s" : Math.floor(elapsed / 60) + "m" + Math.round(elapsed % 60) + "s",
              progressRemaining: remaining > 0 ? remaining + "s" : "即将完成...",
            });
            get()._updateChecklistProgress("s5", pct);
          }, 100);
        }

        const wfv5 = await dataProvider.runS5(wfId, s5Config);
        clearInterval(progressTimer);
        set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });
        get()._updateChecklistProgress("s5", 100);
        _syncStagesToRun(wfv5, set, get);

        // 保存 S5 产物到历史记录
        const s5Stage = await dataProvider.getStage("s5");
        get().agentSaveHistory("s5", _historySummary("s5", s5Stage?.output), s5Stage?.output ?? null);

        // Step 3: 自动锁定最高分选题
        const topics = (wfv5.stages.find(s => s.stage_code === "S5")?.output_artifact?.topics ?? []) as Array<{ score: number }>;
        if (topics.length > 0) {
          const bestIdx = topics.reduce((maxI, t, i, arr) => t.score > arr[maxI].score ? i : maxI, 0);
          set({ selectedTopicIdx: bestIdx, lockedTopicIdx: bestIdx });
        }

        // Step 4: 自动运行S6（带进度）
        const s6StartTime = Date.now();
        const s6Total = STAGE_TIMES["s6"] || 55;
        set({ currentAutoStep: "s6", runningStage: "s6", progressPct: 0 });
        // S5 done → S6 active + checklist
        set((s) => ({
          run: {
            ...s.run,
            nodes: {
              ...s.run.nodes,
              s5: { ...s.run.nodes.s5, status: "done" as RunStatus, percent: 100 },
            },
          },
        }));
        get()._initStageChecklist("s6");
        get().loadStages();
        if (!MOCK_MODE) await new Promise(resolve => setTimeout(resolve, 500));

        let s6ProgressTimer: ReturnType<typeof setInterval> | undefined;
        if (MOCK_MODE) {
          set({ progressPct: 0, progressElapsed: "", progressRemaining: "" });
          // mock模式：API返回后直接设100
        } else {
          s6ProgressTimer = setInterval(() => {
            const elapsed = (Date.now() - s6StartTime) / 1000;
            const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (s6Total - 1)) * 92), 95);
            const remaining = Math.max(0, Math.round(s6Total - elapsed));
            set({ progressPct: pct, progressElapsed: Math.round(elapsed) + "s", progressRemaining: remaining + "s" });
            get()._updateChecklistProgress("s6", pct);
          }, 100);
        }

        const s6Config = useConfig.getState().getS6Config();
        const wfv6 = await dataProvider.runS6(wfId, s6Config);
        clearInterval(s6ProgressTimer);
        set({ progressPct: 100, progressElapsed: Math.round((Date.now() - s6StartTime) / 1000) + "s", progressRemaining: "已完成" });
        get()._updateChecklistProgress("s6", 100);
        _syncStagesToRun(wfv6, set, get);

        // 保存 S6 产物到历史记录
        const s6Stage = await dataProvider.getStage("s6");
        get().agentSaveHistory("s6", _historySummary("s6", s6Stage?.output), s6Stage?.output ?? null);

        // Step 5: S6等待审核
        set({ currentAutoStep: "s6_review", simPhase: "idle", runningStage: null });
        get()._forceLoadStages();
      } catch (e) {
        if (progressTimer) clearInterval(progressTimer);
        console.error("runFullWorkflow failed:", e);
        set({ autoMode: false, currentAutoStep: "idle", simPhase: "idle", runningStage: null, progressPct: 0 });
      }
    },

    async approveAndContinue() {
      const { wfId, currentAutoStep } = get();
      if (!wfId) return;

      const STAGE_TIMES: Record<string, number> = MOCK_MODE ? MOCK_STAGE_TIMES : { s7: 120, s8: 75 };

      try {
        if (currentAutoStep === "s6_review") {
          await dataProvider.approveStage(wfId, "S6");
          // S6 completed → S7 active + checklist
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s6: { ...s.run.nodes.s6, status: "done" as RunStatus, percent: 100 },
              },
            },
          }));
          get()._initStageChecklist("s7");
          get().loadStages();
          if (!MOCK_MODE) await new Promise(resolve => setTimeout(resolve, 500));

          // 运行 S7 带进度 + checklist
          const startTime = Date.now();
          const total = STAGE_TIMES["s7"] || 120;
          set({ currentAutoStep: "s7", simPhase: "running", runningStage: "s7", progressPct: 0 });
          let progressTimer: ReturnType<typeof setInterval> | undefined;
          if (MOCK_MODE) {
            set({ progressPct: 0, progressElapsed: "", progressRemaining: "" });
            // mock模式：API返回后直接设100
          } else {
            progressTimer = setInterval(() => {
              const elapsed = (Date.now() - startTime) / 1000;
              const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
              const remaining = Math.max(0, Math.round(total - elapsed));
              set({ progressPct: pct, progressElapsed: Math.round(elapsed) + "s", progressRemaining: remaining + "s" });
              get()._updateChecklistProgress("s7", pct);
            }, 100);
          }

          const s7Config = useConfig.getState().getS7Config();
          const wfv7 = await dataProvider.runS7(wfId, s7Config);
          clearInterval(progressTimer);
          set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });
          get()._updateChecklistProgress("s7", 100);

          // 保存 S7 产物到历史记录
          const s7Stage = await dataProvider.getStage("s7");
          get().agentSaveHistory("s7", _historySummary("s7", s7Stage?.output), s7Stage?.output ?? null);

          // S7 完成后，手动设置 S7=done, S8=pending（不使用 _syncStagesToRun，
          // 因为后端返回的 workflow 会把 S8 标记为 active，跳过用户确认阶段）
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s7: { ...s.run.nodes.s7, status: "done" as RunStatus, percent: 100, doneCount: 1, totalCount: 1 },
                s8: { ...s.run.nodes.s8, status: "pending" as RunStatus, percent: 0, doneCount: 0, totalCount: 1 },
              },
            },
          }));

          const script = (wfv7.stages.find(s => s.stage_code === "S7")?.output_artifact?.body_md as string) || "";
          set({ editedScript: script, currentAutoStep: "s7_edit", simPhase: "idle", runningStage: null, progressPct: 0 });
          get().loadStages();
          // 等待 UI 显示 S7 完成状态
          await new Promise(resolve => setTimeout(resolve, 1000));

        } else if (currentAutoStep === "s7_edit") {
          // S7 确认 → 运行 S8 带进度 + checklist
          const startTime = Date.now();
          const total = _s8Time();
          set({ currentAutoStep: "s8", simPhase: "running", runningStage: "s8", progressPct: 0 });
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s7: { ...s.run.nodes.s7, status: "done" as RunStatus, percent: 100 },
              },
            },
          }));
          get()._initStageChecklist("s8");
          get().loadStages();
          if (!MOCK_MODE) await new Promise(resolve => setTimeout(resolve, 500));
          let s8ProgressTimer: ReturnType<typeof setInterval> | undefined;
          if (MOCK_MODE) {
            set({ progressPct: 0, progressElapsed: "", progressRemaining: "" });
            // mock模式：API返回后直接设100
          } else {
            s8ProgressTimer = setInterval(() => {
              const elapsed = (Date.now() - startTime) / 1000;
              const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
              const remaining = Math.max(0, Math.round(total - elapsed));
              set({ progressPct: pct, progressElapsed: Math.round(elapsed) + "s", progressRemaining: remaining + "s" });
              get()._updateChecklistProgress("s8", pct);
            }, 100);
          }

          const s8Config = useConfig.getState().getS8Config();
          const wfv8 = await dataProvider.runS8(wfId, s8Config);
          if (s8ProgressTimer) clearInterval(s8ProgressTimer);
          set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });
          get()._updateChecklistProgress("s8", 100);

          // 保存 S8 产物到历史记录
          const s8Stage = await dataProvider.getStage("s8");
          get().agentSaveHistory("s8", _historySummary("s8", s8Stage?.output), s8Stage?.output ?? null);

          // 不用 _syncStagesToRun（后端会标 S8=completed 导致跳过审核）
          // 手动设 S8=awaiting_review，等待用户审核
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s7: { ...s.run.nodes.s7, status: "done" as RunStatus, percent: 100 },
                s8: { ...s.run.nodes.s8, status: "awaiting_review" as RunStatus, percent: 100, doneCount: 1, totalCount: 1 },
              },
            },
          }));
          set({ currentAutoStep: "s8_review", simPhase: "idle", runningStage: null, progressPct: 0, pendingNodeId: "s8" });
          get().loadStages();

        } else if (currentAutoStep === "s8_review") {
          await dataProvider.approveStage(wfId, "S8");
          // S8 完成，不跳转 S9（S9 未实现）
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s8: { ...s.run.nodes.s8, status: "done" as RunStatus, percent: 100 },
              },
            },
            currentAutoStep: "done",
            autoMode: false,
            simPhase: "idle",
            runningStage: null,
            progressPct: 0,
            pendingNodeId: null,
          }));
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

      const STAGE_TIMES: Record<string, number> = MOCK_MODE ? MOCK_STAGE_TIMES : { s5: 47, s6: 55, s7: 120, s8: 75 };
      const ROLLBACK_STAGES = ["s5", "s6", "s7", "s8"];
      const targetIdx = ROLLBACK_STAGES.indexOf(target);
      if (targetIdx < 0) return;

      try {
        // 1. 保存被丢弃的后续阶段产物快照到历史记录（不含目标阶段，目标阶段会重新生成）
        for (const sid of ROLLBACK_STAGES.slice(targetIdx + 1)) {
          const node = get().run.nodes[sid];
          if (node?.status === "done") {
            const stageDef = await dataProvider.getStage(sid);
            get().agentSaveHistory(sid, `驳回前 ${sid.toUpperCase()} 产物`, stageDef?.output ?? null);
          }
        }

        // 2. 调用后端驳回
        await dataProvider.rejectStage(wfId, "S8", `回滚到${target}`, target.toUpperCase());

        // 3. 清理被回滚阶段的 STAGES artifact 数据（避免 StudioPanel/抽屉显示旧产物）
        for (const sid of ROLLBACK_STAGES.slice(targetIdx)) {
          const stageDef = await dataProvider.getStage(sid);
          if (stageDef) {
            stageDef.output = {};
          }
        }

        // 4. 重置目标阶段到 S8 的工作台节点为 pending
        set((s) => {
          const nodes = { ...s.run.nodes };
          for (const sid of ROLLBACK_STAGES.slice(targetIdx)) {
            nodes[sid] = {
              ...nodes[sid],
              status: "pending" as RunStatus,
              percent: 0,
              doneCount: 0,
              totalCount: 0,
              checklist: [],
              currentItem: "",
            };
          }
          return { run: { ...s.run, nodes } };
        });

        // 5. 初始化目标阶段 checklist + 设置为 active
        get()._initStageChecklist(target);
        set({ rollbackTarget: target, currentAutoStep: target, simPhase: "running", runningStage: target, progressPct: 0, progressElapsed: "0s", progressRemaining: "" });
        get().loadStages();

        // 6. 带进度运行目标阶段
        const startTime = Date.now();
        const total = target === "s8" ? _s8Time() : (STAGE_TIMES[target] || 40);
        let progressTimer: ReturnType<typeof setInterval> | undefined;
        if (MOCK_MODE) {
          set({ progressPct: 0, progressElapsed: "", progressRemaining: "" });
          // mock模式：API返回后直接设100
        } else {
          progressTimer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (total - 1)) * 92), 95);
            const remaining = Math.max(0, Math.round(total - elapsed));
            set({
            progressPct: pct,
            progressElapsed: Math.round(elapsed) + "s",
            progressRemaining: remaining + "s",
          });
          get()._updateChecklistProgress(target, pct);
        }, 100);
        }

        let wfv;
        if (target === "s5") {
          const s5Config = useConfig.getState().getS5Config();
          wfv = await dataProvider.runS5(wfId, s5Config);
        } else if (target === "s6") {
          const s6Config = useConfig.getState().getS6Config();
          wfv = await dataProvider.runS6(wfId, s6Config);
        } else if (target === "s7") {
          const s7Config = useConfig.getState().getS7Config();
          wfv = await dataProvider.runS7(wfId, s7Config);
        }

        clearInterval(progressTimer);
        set({ progressPct: 100, progressElapsed: Math.round((Date.now() - startTime) / 1000) + "s", progressRemaining: "已完成" });
        get()._updateChecklistProgress(target, 100);

        if (wfv) {
          // 不调用 _syncStagesToRun（后端自动推进会导致后续阶段变为 active）
          // 各分支手动设状态
        }

        // 7. 设置下一步状态
        if (target === "s5") {
          // S5 完成后自动继续跑 S6（和 runFullWorkflow 一致）
          const topics = (wfv?.stages.find(s => s.stage_code === "S5")?.output_artifact?.topics ?? []) as Array<{ score: number }>;
          if (topics.length > 0) {
            const bestIdx = topics.reduce((maxI, t, i, arr) => t.score > arr[maxI].score ? i : maxI, 0);
            set({ selectedTopicIdx: bestIdx, lockedTopicIdx: bestIdx });
          }
          const s5Stage = await dataProvider.getStage("s5");
          get().agentSaveHistory("s5", _historySummary("s5", s5Stage?.output), s5Stage?.output ?? null);

          // 自动运行 S6
          const s6StartTime = Date.now();
          const s6Total = STAGE_TIMES["s6"] || 55;
          set({ currentAutoStep: "s6", runningStage: "s6", progressPct: 0 });
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s5: { ...s.run.nodes.s5, status: "done" as RunStatus, percent: 100 },
              },
            },
          }));
          get()._initStageChecklist("s6");
          get().loadStages();
          if (!MOCK_MODE) await new Promise(resolve => setTimeout(resolve, 500));

          const s6ProgressTimer = setInterval(() => {
            const elapsed = (Date.now() - s6StartTime) / 1000;
            const pct = elapsed < 1 ? Math.round(elapsed * 3) : Math.min(3 + Math.round(((elapsed - 1) / (s6Total - 1)) * 92), 95);
            const remaining = Math.max(0, Math.round(s6Total - elapsed));
            set({ progressPct: pct, progressElapsed: Math.round(elapsed) + "s", progressRemaining: remaining + "s" });
            get()._updateChecklistProgress("s6", pct);
          }, 100);

          const s6Config = useConfig.getState().getS6Config();
          const wfv6 = await dataProvider.runS6(wfId, s6Config);
          clearInterval(s6ProgressTimer);
          set({ progressPct: 100, progressElapsed: Math.round((Date.now() - s6StartTime) / 1000) + "s", progressRemaining: "已完成" });
          get()._updateChecklistProgress("s6", 100);
          // 手动设 S6=done, S7/S8=pending（不用 _syncStagesToRun 避免后端自动推进）
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s5: { ...s.run.nodes.s5, status: "done" as RunStatus, percent: 100 },
                s6: { ...s.run.nodes.s6, status: "awaiting_review" as RunStatus, percent: 100, doneCount: 1, totalCount: 1 },
                s7: { ...s.run.nodes.s7, status: "pending" as RunStatus, percent: 0 },
                s8: { ...s.run.nodes.s8, status: "pending" as RunStatus, percent: 0 },
              },
            },
          }));

          const s6Stage = await dataProvider.getStage("s6");
          get().agentSaveHistory("s6", _historySummary("s6", s6Stage?.output), s6Stage?.output ?? null);

          set({ currentAutoStep: "s6_review", simPhase: "idle", runningStage: null, progressPct: 0 });
          get().loadStages();

        } else if (target === "s6") {
          // 手动设 S6=awaiting_review，S7/S8=pending（不依赖后端自动推进）
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s6: { ...s.run.nodes.s6, status: "awaiting_review" as RunStatus, percent: 100, doneCount: 1, totalCount: 1 },
                s7: { ...s.run.nodes.s7, status: "pending" as RunStatus, percent: 0 },
                s8: { ...s.run.nodes.s8, status: "pending" as RunStatus, percent: 0 },
              },
            },
          }));
          const s6Stage = await dataProvider.getStage("s6");
          get().agentSaveHistory("s6", _historySummary("s6", s6Stage?.output), s6Stage?.output ?? null);
          set({ currentAutoStep: "s6_review", simPhase: "idle", runningStage: null, progressPct: 0, pendingNodeId: "s6" });
          get().loadStages();

        } else if (target === "s7") {
          // 手动设 S7=done，S8=pending（不依赖后端自动推进）
          const script = (wfv?.stages.find(s => s.stage_code === "S7")?.output_artifact?.body_md as string) || "";
          set((s) => ({
            run: {
              ...s.run,
              nodes: {
                ...s.run.nodes,
                s7: { ...s.run.nodes.s7, status: "done" as RunStatus, percent: 100, doneCount: 1, totalCount: 1 },
                s8: { ...s.run.nodes.s8, status: "pending" as RunStatus, percent: 0 },
              },
            },
          }));
          const s7Stage = await dataProvider.getStage("s7");
          get().agentSaveHistory("s7", _historySummary("s7", s7Stage?.output), s7Stage?.output ?? null);
          set({ editedScript: script, currentAutoStep: "s7_edit", simPhase: "idle", runningStage: null, progressPct: 0 });
          get().loadStages();
        }
      } catch (e) {
        console.error("rejectAndRollback failed:", e);
        set({ simPhase: "idle", runningStage: null, progressPct: 0 });
      }
    },
  };
});
