// ===== 数据接缝 =====
// 现在:实现体从 src/data/* 读 mock。
// 后端就绪后:把每个方法实现体改为 `const r = await fetch(`${API_BASE}/api/...`); return r.json();`
// 视图只依赖本文件,不直接 import src/data/*。
//
// 每个视图切片(B–G)在此追加自己用到的 async 方法 + 接到对应 src/data 模块。
import type {
  User,
  WorkflowRun,
  Template,
  ChannelTile,
  RunningMission,
  ChannelListCard,
  ChannelDetail,
  HomeTodo,
  StageDef,
  WorkflowNode,
  RunFlow,
  NodeRun,
  ProbeModeKey,
  ProbeResult,
  Competitor,
  Hotspot,
  TrackRanking,
  TrackDetail,
  RadarSearchResult,
  InboxItem,
  LibraryData,
  MissionListRow,
  KnowledgeRule,
  KnowledgeRuleCandidate,
  AnalyticsSummary,
  ViralSample,
  ViralCandidateRule,
} from "@/types";
import {
  homeTodo,
  homeTemplates,
  myChannels,
  runningMissions,
  channelList,
  channelDetail,
  STAGES,
  WORKFLOW_NODES,
  INITIAL_RUN,
  STAGE_RUN_MOCK,
  COMPETITORS,
  HOTSPOTS,
} from "@/data";
import { WEB_SOURCES, YT_SOURCES, OWN_REFS, DEEP_TASKS } from "@/data/probe";
import { TRACK_RANKING, TRACKS } from "@/data/tracks";
import { INBOX } from "@/data/inbox";
import { LIBRARY } from "@/data/library";
import { MISSIONS } from "@/data/missions";
import { KNOWLEDGE_RULES, KNOWLEDGE_RULE_CANDIDATES } from "@/data/knowledge";
import { ANALYTICS } from "@/data/analytics";
import { VIRAL_SAMPLES, VIRAL_CANDIDATE_RULES } from "@/data/viralSamples";
import { resolveRadarQuery } from "@/lib/radar";
import * as wf from "./workflowClient";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// ===== 切片 E1:discoveredCache =====
// Tracks found via searchTracks (non-pooled radar results) are registered here
// so getTrackDetail can open their drawer without mutating the static TRACKS object.
const discoveredCache: Record<string, TrackDetail> = {};

/** mock 同步值包装成 Promise,保证未来替换 fetch 时签名不变 */
const ok = <T>(value: T): Promise<T> => Promise.resolve(value);

/** 将后端 workflow 的 stages 数据同步到 STAGES mock 对象，供 OutputTab 渲染 */
function _syncStages(wfv: wf.WorkflowView) {
  for (const s of wfv.stages) {
    const key = s.stage_code.toLowerCase();
    if (STAGES[key] && s.output_artifact) {
      STAGES[key] = { ...STAGES[key], output: s.output_artifact as Record<string, unknown> };
    }
  }
}

// ===== 认证 =====
// 当前:mock,session 缓存在 localStorage(无真实后端时也能演示登录流程)。
// 后端就绪后:把三处实现体改为对 /api/auth/* 的 fetch(务必 `credentials: "include"`,
// 因后端用 httponly cookie session、samesite=lax;需同源反代)。见
// reference/dataprovider-contract-audit.md §1。
const SESSION_KEY = "creatoros.session";

function readSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export const dataProvider = {
  /** 登录。调用 CreatorOS 后端 POST /api/auth/login。 */
  async login(username: string, password: string): Promise<User> {
    const u = username.trim();
    if (!u || !password) throw new Error("请输入账号和密码");
    await wf.login(u, password);
    const user: User = { username: u };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* ignore */ }
    return user;
  },

  /** 登出。调用 CreatorOS 后端 POST /api/auth/logout。 */
  async logout(): Promise<void> {
    await wf.logout().catch(() => {});
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  },

  /** 取当前会话用户。先尝试后端，回退本地 session。 */
  async getCurrentUser(): Promise<User | null> {
    try {
      const u = await wf.getCurrentUser();
      if (u) return { username: u.username };
    } catch { /* backend unavailable */ }
    return ok(readSession());
  },

  async listWorkflows(): Promise<WorkflowRun[]> {
    return ok<WorkflowRun[]>([]);
  },

  // ===== 切片 B:首页 + 频道 =====
  async getHomeTodo(): Promise<HomeTodo> {
    return ok(homeTodo);
  },
  async listHomeTemplates(): Promise<Template[]> {
    return ok(homeTemplates);
  },
  async listMyChannels(): Promise<ChannelTile[]> {
    return ok(myChannels);
  },
  async listRunningMissions(): Promise<RunningMission[]> {
    return ok(runningMissions);
  },
  async listChannels(): Promise<ChannelListCard[]> {
    return ok(channelList);
  },
  async getChannel(id: string): Promise<ChannelDetail> {
    // mock 仅一套;wfId/id 占位(见修正 C-4)。后端就绪后按 id 取真实频道。
    return ok({ ...channelDetail, id });
  },

  // ===== 切片 C1:工作台数据层 =====
  async getStage(id: string): Promise<StageDef | undefined> {
    return ok(STAGES[id]);
  },
  /** 整张阶段定义表;供 runStore 注入为可读状态(工作台组件不直接 import src/data)。 */
  async getStages(): Promise<Record<string, StageDef>> {
    return ok(structuredClone(STAGES));
  },
  async getWorkflowNodes(_wfId?: string): Promise<WorkflowNode[]> {
    return ok([...WORKFLOW_NODES].sort((a, b) => a.order - b.order));
  },
  async getRunFlow(_wfId?: string): Promise<RunFlow> {
    // Deep clone so store mutations don't touch the mock constant
    return ok(structuredClone(INITIAL_RUN));
  },
  /** Per-stage simulate targets (checklist/context/counts) for the run-state engine. */
  async getStageRunMock(): Promise<Record<string, Partial<NodeRun>>> {
    return ok(STAGE_RUN_MOCK);
  },

  // ===== 切片 E1:选题池 · 赛道 / 雷达 / 收件箱 / 关注库 =====
  async listTracks(): Promise<TrackRanking[]> {
    return ok(TRACK_RANKING);
  },

  async getTrackDetail(key: string): Promise<TrackDetail | undefined> {
    return ok(TRACKS[key] ?? discoveredCache[key]);
  },

  async searchTracks(q: string): Promise<RadarSearchResult> {
    const result = resolveRadarQuery(q);
    // Register non-pooled discovered clusters into discoveredCache
    // so getTrackDetail can later serve them for drawer opening.
    for (const c of result.clusters) {
      if (!c.pooled && !TRACKS[c.key] && !discoveredCache[c.key]) {
        discoveredCache[c.key] = {
          key: c.key,
          emoji: c.emoji,
          title: c.title,
          verdict: c.verdict,
          verdictTone: c.verdictTone,
          rpm: c.rpm,
          rpmNote: c.rpmNote ?? "搜索新发现",
          creators: String(c.active),
          supply: c.supply ?? "—",
          window: c.window ?? "待评估",
          windowTone: c.windowTone ?? "pending",
          tag: c.tag ?? "",
        };
      }
    }
    return ok(result);
  },

  async listInbox(_channelId?: string): Promise<InboxItem[]> {
    return ok(INBOX);
  },

  async listLibrary(): Promise<LibraryData> {
    return ok(LIBRARY);
  },

  // ===== 切片 F1:任务列表 / 经验库 / 数据分析 =====
  async listMissions(): Promise<MissionListRow[]> {
    return ok(MISSIONS);
  },
  async listKnowledgeItems(): Promise<KnowledgeRule[]> {
    return ok(KNOWLEDGE_RULES);
  },
  async listKnowledgeCandidates(_wfId?: string): Promise<KnowledgeRuleCandidate[]> {
    return ok(KNOWLEDGE_RULE_CANDIDATES);
  },
  async getAnalytics(): Promise<AnalyticsSummary> {
    return ok(ANALYTICS);
  },

  // ===== 切片 F2:爆款解构 =====
  async listViralSamples(_wfId?: string): Promise<ViralSample[]> {
    return ok(VIRAL_SAMPLES);
  },
  async getViralTeardown(id: number): Promise<ViralSample | undefined> {
    return ok(VIRAL_SAMPLES.find((s) => s.id === id));
  },
  async listViralCandidateRules(): Promise<ViralCandidateRule[]> {
    return ok(VIRAL_CANDIDATE_RULES);
  },

  // ===== 切片 D2a:对标账号 + 热点 =====
  async listCompetitors(_wfId?: string): Promise<Competitor[]> {
    return ok(COMPETITORS);
  },
  async listHotspots(_wfId?: string): Promise<Hotspot[]> {
    return ok(HOTSPOTS);
  },

  // ===== 切片 C3a:信息探针 =====
  async probe(query: string, mode: ProbeModeKey): Promise<ProbeResult> {
    const META: Record<ProbeModeKey, { modeName: string; modeIcon: string; modeColor: string; time: string }> = {
      web:  { modeName: "Web 综合",  modeIcon: "Globe",      modeColor: "text-blue-600",    time: "2.3s"    },
      yt:   { modeName: "YT 视频",   modeIcon: "Youtube",    modeColor: "text-red-600",     time: "3.1s"    },
      own:  { modeName: "本号库",    modeIcon: "Database",   modeColor: "text-emerald-600", time: "0.8s"    },
      deep: { modeName: "深度研究",  modeIcon: "Microscope", modeColor: "text-purple-600",  time: "~3 分钟" },
    };
    const m = META[mode];

    const base: ProbeResult = {
      mode,
      modeName: m.modeName,
      modeIcon: m.modeIcon,
      modeColor: m.modeColor,
      time: m.time,
      query,
    };

    if (mode === "web") {
      return ok({
        ...base,
        summary: `基于 6 个来源综合，"${query}" 的关键信息是：当前提供免费层（限 10 任务/日）、专业版 $20/月（100 任务）、企业版 $99/月。最近 24 小时讨论度上升，与 OpenAI Operator 形成正面竞争。`,
        sources: WEB_SOURCES,
      });
    }

    if (mode === "yt") {
      return ok({
        ...base,
        summary: `找到 14 个相关视频。综合发现："${query}" 是近期热门话题，主要在 4 个频道讨论，主流观点分两派。`,
        sources: YT_SOURCES,
      });
    }

    if (mode === "own") {
      return ok({
        ...base,
        ownIntro: `根据已挂载的 3 个来源，没有找到关于"${query}"的明确信息。`,
        ownRefs: OWN_REFS,
      });
    }

    // deep
    return ok({
      ...base,
      deepNote: "已分解为 4 个子任务，并行抓取中。完成后会推送通知，不必等待。",
      deepTasks: DEEP_TASKS,
    });
  },

  // ===== CreatorOS 后端对接 =====

  /** 创建并运行 video_production workflow，将结果写入 STAGES 供渲染 */
  async runWithBackend(user_data: string, channel_desc: string): Promise<string> {
    const wfv = await wf.createWorkflow({
      seed_keywords: ["AI内容"],
      platform: "youtube",
      language: "zh",
      kind: "video_production",
      user_data,
      channel_desc,
    });
    const wfId = wfv.workflow.id;
    // 运行主链 → S5 自动完成，S6 停在审核
    const r1 = await wf.runWorkflow(wfId);
    _syncStages(r1);
    return wfId;
  },

  /** 创建 workflow（不自动运行） */
  async createWorkflowOnly(user_data: string, channel_desc: string): Promise<string> {
    const wfv = await wf.createWorkflow({
      kind: "video_production",
      user_data,
      channel_desc,
    });
    return wfv.workflow.id;
  },

  /** 运行 S5 选题 */
  async runS5(wfId: string, config: Record<string, unknown> = {}): Promise<wf.WorkflowView> {
    const r = await wf.runStage(wfId, "S5", config);
    _syncStages(r);
    return r;
  },

  /** 运行 S6 大纲 */
  async runS6(wfId: string, config: Record<string, unknown> = {}): Promise<wf.WorkflowView> {
    const r = await wf.runStage(wfId, "S6", config);
    _syncStages(r);
    return r;
  },

  /** 运行 S7 脚本 */
  async runS7(wfId: string, config: Record<string, unknown> = {}): Promise<wf.WorkflowView> {
    const r = await wf.runStage(wfId, "S7", config);
    _syncStages(r);
    return r;
  },

  /** 运行 S8 对抗审核 */
  async runS8(wfId: string, config: Record<string, unknown> = {}): Promise<wf.WorkflowView> {
    const r = await wf.runStage(wfId, "S8", config);
    _syncStages(r);
    return r;
  },

  /** 驳回阶段 */
  async rejectStage(wfId: string, code: string, reason: string): Promise<wf.WorkflowView> {
    const r = await wf.rejectStage(wfId, code, reason);
    _syncStages(r);
    return r;
  },

  /** 推进 workflow（运行下一阶段） */
  async advanceWorkflow(wfId: string): Promise<wf.WorkflowView> {
    const r = await wf.runWorkflow(wfId);
    _syncStages(r);
    return r;
  },

  /** 审核通过 */
  async approveStage(wfId: string, code: string): Promise<wf.WorkflowView> {
    const r = await wf.approveStage(wfId, code);
    _syncStages(r);
    return r;
  },

  /** 获取 workflow 状态 */
  async getWorkflow(wfId: string): Promise<wf.WorkflowView> {
    const r = await wf.getWorkflow(wfId);
    _syncStages(r);
    return r;
  },
};
