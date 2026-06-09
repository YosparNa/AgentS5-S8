// StageDrawer — Task D1.
// Drawer shell: header, tab bar (5 tabs), body, footer.
// Mask + aside rendered as siblings via React fragment.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { StageDef, RunStatus, Layer } from "@/types";
import { useUi, type ModalId } from "@/store/uiStore";
import { useRun } from "@/store/runStore";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";
import { LayerBadge } from "@/components/ui/LayerBadge";
import { cn } from "@/lib/cn";
import { OutputTab } from "./OutputTab";
import { LiveTab } from "./LiveTab";
import { ConfigTab } from "./ConfigTab";
import { FlowTab } from "./FlowTab";
import { HistoryTab } from "./HistoryTab";

// ── Badge helpers ────────────────────────────────────────────────────────────

function layerBadge(layer: Layer) {
  return <LayerBadge layer={layer} />;
}

type StatusBadgeConfig = { label: string; cls: string; blink?: boolean };
const STATUS_MAP: Record<RunStatus, StatusBadgeConfig> = {
  done:             { label: "已完成", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  active:           { label: "运行中", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", blink: true },
  awaiting_review:  { label: "待审核", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  rejected:         { label: "已驳回", cls: "bg-red-50 text-red-700 border-red-200" },
  skipped:          { label: "已跳过", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  pending:          { label: "待执行", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  locked:           { label: "待执行", cls: "bg-gray-50 text-gray-500 border-gray-200" },
};

function StatusBadge({ status }: { status: RunStatus }) {
  const m = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded border",
        m.cls,
        m.blink ? "blink" : undefined
      )}
    >
      {m.label}
    </span>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

interface FooterProps {
  stage: StageDef;
  status: RunStatus;
  closeDrawer: () => void;
  openModal: (id: ModalId, viralId?: number) => void;
  navigate: ReturnType<typeof useNavigate>;
}

function DrawerFooter({ stage, status, closeDrawer, openModal, navigate }: FooterProps) {
  const kind = stage.config.kind as string;

  const BtnRerun = (
    <button className="text-[11px] border border-gray-200 px-2.5 py-1.5 rounded hover:bg-gray-50">
      重跑
    </button>
  );
  const BtnSkip = (
    <button className="text-[11px] border border-gray-200 px-2.5 py-1.5 rounded hover:bg-gray-50">
      跳过
    </button>
  );

  // —— S1 赛道分析：单选锁定 ——
  if (kind === "niche") {
    const output = stage.output as { lockedId?: string; scorecard?: { id: string; name: string }[] } | undefined;
    const lockedId = output?.lockedId;
    const scorecard = output?.scorecard ?? [];
    const c = scorecard.find((x) => x.id === lockedId);
    return (
      <>
        <div className="flex gap-2 items-center">
          {BtnRerun}
          {BtnSkip}
        </div>
        <button
          onClick={closeDrawer}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Icon.Lock size={10} />
          确认锁定：{c ? c.name : "—"}
        </button>
      </>
    );
  }

  // —— S2 对标挖掘：多选入库 ——
  if (kind === "benchmark-pro") {
    return (
      <>
        <div className="flex gap-2 items-center">
          {BtnRerun}
          {BtnSkip}
        </div>
        <button
          onClick={closeDrawer}
          className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Icon.Inbox size={10} />
          确认入库（已选 12）
        </button>
      </>
    );
  }

  // —— S2.5 爆款解构：进子页 + 批量沉淀 ——
  if (kind === "viral-hub") {
    return (
      <>
        <div className="flex gap-2 items-center">
          {BtnRerun}
          {BtnSkip}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { closeDrawer(); navigate("/viral"); }}
            className="text-[11px] border border-orange-300 text-orange-700 px-2.5 py-1.5 rounded hover:bg-orange-50 flex items-center gap-1"
          >
            <Icon.ExternalLink size={10} />
            进入子页
          </button>
          <button
            onClick={() => { closeDrawer(); openModal("sediment"); }}
            className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
          >
            <Icon.LayerGroup size={10} />
            批量沉淀入库
          </button>
        </div>
      </>
    );
  }

  // —— S4 每日热点：采纳入池 / 立即刷新 ——
  if (kind === "hot-pro") {
    return (
      <>
        <div className="flex gap-2 items-center">
          <button className="text-[11px] border border-gray-200 px-2.5 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1">
            <Icon.Rotate size={10} />
            立即刷新
          </button>
          {BtnSkip}
        </div>
        <button
          onClick={closeDrawer}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Icon.Check size={10} />
          采纳入池（已选 0）
        </button>
      </>
    );
  }

  // —— S5-S8: Agent 生成按钮 ——
  const isS5S8 = ["topic", "outline", "script", "adversarial"].includes(kind);
  if (isS5S8) {
    const runStore = useRun();
    const stageKey = stage.code.toLowerCase();
    const isRunning = runStore.runningStage === stageKey;
    const selectedIdx = runStore.selectedTopicIdx;
    const lockedIdx = runStore.lockedTopicIdx;

    // 进度条
    const ProgressBar = isRunning ? (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500">{runStore.progressRemaining || "预计..."}</span>
          <span className="text-[10px] mono text-gray-400">{runStore.progressElapsed}</span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-100" style={{ width: runStore.progressPct + "%" }} />
        </div>
      </div>
    ) : null;

    // S5 选题
    if (kind === "topic") {
      if (status === "pending" || status === "active") {
        return (
          <>
            {ProgressBar || <div />}
            <button
              disabled={isRunning}
              onClick={async () => {
                await runStore.createAndRunS5FromS4();
                closeDrawer();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
            >
              <Icon.Sparkles size={10} />
              {isRunning ? "生成中..." : "AI 生成选题（从S4热点）"}
            </button>
          </>
        );
      }
      if (status === "done") {
        const isLocked = lockedIdx !== null;
        return (
          <>
            <div className="flex gap-2 items-center">
              <button className="text-[11px] border border-gray-200 px-2.5 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1"
                onClick={async () => { await runStore.runStage("S5"); closeDrawer(); }}>
                <Icon.Rotate size={10} /> 重跑
              </button>
              {isLocked ? (
                <button className="text-[11px] border border-indigo-300 text-indigo-600 px-2.5 py-1.5 rounded hover:bg-indigo-50 flex items-center gap-1"
                  onClick={() => { runStore.unlockTopic(); }}>
                  <Icon.Lock size={10} /> 取消锁定
                </button>
              ) : (
                <button
                  disabled={selectedIdx === null}
                  className="text-[11px] border border-indigo-300 text-indigo-600 px-2.5 py-1.5 rounded hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  onClick={() => { runStore.lockTopic(); }}>
                  <Icon.Lock size={10} /> 锁定选题
                </button>
              )}
            </div>
            <button
              disabled={!isLocked}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
              onClick={() => { closeDrawer(); runStore.navigateStage(1); }}>
              <Icon.ArrowRight size={10} /> 确认并进入S6
            </button>
          </>
        );
      }
    }

    // S6 大纲
    if (kind === "outline") {
      if (status === "pending" || status === "active") {
        return (
          <>
            {ProgressBar || <div />}
            <button
              disabled={isRunning}
              onClick={async () => { await runStore.runStage("S6"); closeDrawer(); }}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
            >
              <Icon.Sparkles size={10} />
              {isRunning ? "生成中..." : "生成大纲"}
            </button>
          </>
        );
      }
      if (status === "awaiting_review") {
        return (
          <>
            <div className="flex gap-2 items-center flex-wrap">
              <button className="text-[11px] border border-gray-200 px-2.5 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1"
                onClick={async () => { await runStore.runStage("S6"); closeDrawer(); }}>
                <Icon.Rotate size={10} /> 重新生成大纲
              </button>
              <button className="text-[11px] border border-amber-300 text-amber-600 px-2.5 py-1.5 rounded hover:bg-amber-50"
                onClick={async () => { await runStore.rejectBackend("S6", "用户驳回到S5", "s5"); runStore.navigateStage(-1); closeDrawer(); }}>
                回到S5重新选题
              </button>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
              onClick={async () => {
                if (runStore.autoMode) {
                  await runStore.approveAndContinue();
                } else {
                  await runStore.approveBackend("S6");
                }
                closeDrawer();
              }}>
              <Icon.Check size={10} /> 审核通过
            </button>
          </>
        );
      }
    }

    // S7 脚本
    if (kind === "script") {
      if (status === "pending" || status === "active") {
        return (
          <>
            {ProgressBar || <div />}
            <button
              disabled={isRunning}
              onClick={async () => { await runStore.runStage("S7"); closeDrawer(); }}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
            >
              <Icon.Sparkles size={10} />
              {isRunning ? "生成中..." : "生成脚本"}
            </button>
          </>
        );
      }
      if (status === "done") {
        return (
          <>
            <button className="text-[11px] border border-gray-200 px-2.5 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1"
              onClick={async () => { await runStore.runStage("S7"); closeDrawer(); }}>
              <Icon.Rotate size={10} /> 重跑
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
              onClick={async () => {
                closeDrawer();
                if (runStore.autoMode && runStore.currentAutoStep === "s7_edit") {
                  await runStore.approveAndContinue();
                } else {
                  await runStore.runStage("S8");
                }
              }}>
              <Icon.ArrowRight size={10} /> 确认并进入S8
            </button>
          </>
        );
      }
    }

    // S8 对抗审核
    if (kind === "adversarial") {
      if (status === "pending" || status === "active") {
        return (
          <>
            {ProgressBar || <div />}
            <button
              disabled={isRunning}
              onClick={async () => { await runStore.runStage("S8"); closeDrawer(); }}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
            >
              <Icon.Sparkles size={10} />
              {isRunning ? "审核中..." : "运行对抗审核"}
            </button>
          </>
        );
      }
      if (status === "awaiting_review") {
        return (
          <>
            <div className="flex gap-1.5 items-center flex-wrap">
              <button className="text-[10px] border border-red-300 text-red-600 px-2 py-1 rounded hover:bg-red-50"
                onClick={async () => { await runStore.rejectBackend("S8", "驳回到S5", "s5"); closeDrawer(); }}>
                驳回(S5)
              </button>
              <button className="text-[10px] border border-red-300 text-red-600 px-2 py-1 rounded hover:bg-red-50"
                onClick={async () => { await runStore.rejectBackend("S8", "驳回到S6", "s6"); closeDrawer(); }}>
                驳回(S6)
              </button>
              <button className="text-[10px] border border-red-300 text-red-600 px-2 py-1 rounded hover:bg-red-50"
                onClick={async () => { await runStore.rejectBackend("S8", "驳回到S7", "s7"); closeDrawer(); }}>
                驳回(S7)
              </button>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
              onClick={async () => {
                if (runStore.autoMode) {
                  await runStore.approveAndContinue();
                } else {
                  await runStore.approveBackend("S8");
                }
                closeDrawer();
              }}>
              <Icon.Check size={10} /> 审核通过
            </button>
          </>
        );
      }
    }
  }

  // —— Else: branch by status ——
  if (status === "active") {
    return (
      <>
        <div className="flex gap-2">
          <button className="text-[11px] border border-gray-200 px-2.5 py-1.5 rounded flex items-center gap-1">
            <Icon.Pause size={10} />
            暂停
          </button>
          <button className="text-[11px] border border-gray-200 px-2.5 py-1.5 rounded flex items-center gap-1">
            <Icon.Rotate size={10} />
            重跑
          </button>
        </div>
        <button className="bg-indigo-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1">
          <Icon.Send size={10} />
          注入指令
        </button>
      </>
    );
  }

  if (status === "done") {
    return (
      <>
        <div className="flex gap-2 items-center">
          {BtnRerun}
          {BtnSkip}
        </div>
        <button
          onClick={() => { closeDrawer(); openModal("sediment"); }}
          className="bg-purple-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Icon.Brain size={10} />
          沉淀经验...
        </button>
      </>
    );
  }

  // Default (pending / locked / awaiting_review / rejected / skipped)
  return (
    <>
      <div className="flex gap-2">
        {BtnSkip}
      </div>
      <button className="bg-indigo-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded">
        立即执行
      </button>
    </>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TAB_DEFS = [
  { key: "output" as const,  label: "产物" },
  { key: "live"   as const,  label: "实时执行" },
  { key: "config" as const,  label: "配置" },
  { key: "flow"   as const,  label: "上下游链路" },
  { key: "history"as const,  label: "运行历史" },
] as const;

// ── Main component ────────────────────────────────────────────────────────────

export function StageDrawer() {
  const { open, wide, stageId, tab } = useUi((s) => s.stageDrawer);
  const closeDrawer = useUi((s) => s.closeDrawer);
  const switchTab = useUi((s) => s.switchDrawerTab);
  const openModal = useUi((s) => s.openModal);

  const [stage, setStage] = useState<StageDef | undefined>(undefined);
  const stageVersion = useRun((s) => s.stageVersion);

  useEffect(() => {
    if (stageId) {
      dataProvider.getStage(stageId).then(setStage);
    }
  }, [stageId, stageVersion]);

  const status = useRun((s) => (stageId ? s.nodeStatus(stageId) : "pending"));

  const navigate = useNavigate();

  // Effective tab: if tab===live but not active, fall back to output
  const effectiveTab = tab === "live" && status !== "active" ? "output" : tab;

  return (
    <>
      {/* Mask */}
      <div
        className={cn("drawer-mask", open && "show")}
        onClick={closeDrawer}
      />

      {/* Drawer aside */}
      <aside className={cn("drawer flex flex-col", open && "open", wide && "wide")}>
        {stage ? (
          <>
            {/* ── Header ── */}
            <div className="px-5 py-3 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Meta row */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="mono text-[10px] text-gray-500">{stage.code}</span>
                    {layerBadge(stage.layer)}
                    <StatusBadge status={status} />
                    {stage.audit && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        审核 {stage.audit}
                      </span>
                    )}
                    {stage.star && (
                      <span className="bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        ★ 人审
                      </span>
                    )}
                  </div>
                  <h2 className="text-[15px] font-bold">{stage.title}</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {stage.subtitle} · <span className="mono">{stage.model}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    {stage.layer === "central" ? (
                      <Icon.Building size={9} />
                    ) : (
                      <Icon.Broadcast size={9} />
                    )}
                    {stage.layer === "central" ? "工作区：星辰MCN" : "频道：AI 工具频道"}
                  </p>
                </div>
                {/* Close button */}
                <button
                  onClick={closeDrawer}
                  className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center shrink-0"
                >
                  <Icon.Close size={14} />
                </button>
              </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="px-5 pt-3 border-b border-gray-200 bg-white shrink-0">
              <div className="flex gap-4 text-[12px] -mb-px">
                {TAB_DEFS.map(({ key, label }) => {
                  // Live tab: hidden when not active
                  if (key === "live" && status !== "active") return null;
                  return (
                    <button
                      key={key}
                      onClick={() => switchTab(key)}
                      className={cn(
                        "tab py-2 font-semibold text-[12px] flex items-center gap-1",
                        effectiveTab === key ? "active" : "text-gray-500"
                      )}
                    >
                      {key === "live" && <Icon.Monitor size={10} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {effectiveTab === "output"  && <OutputTab  stage={stage} />}
              {effectiveTab === "live"    && <LiveTab />}
              {effectiveTab === "config"  && <ConfigTab  stage={stage} />}
              {effectiveTab === "flow"    && <FlowTab    stage={stage} />}
              {effectiveTab === "history" && <HistoryTab />}
            </div>

            {/* ── Footer ── */}
            <div className="px-5 py-3 border-t border-gray-200 bg-white shrink-0 flex items-center justify-between gap-2">
              <DrawerFooter
                stage={stage}
                status={status}
                closeDrawer={closeDrawer}
                openModal={openModal}
                navigate={navigate}
              />
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}
