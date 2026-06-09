// AgentStream.tsx — chat-style stream of agent blocks.
// 来源: PROTO 2924–2966; 计划 D-E.
import { useRun } from "@/store/runStore";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { ChatArtifactCard } from "./ChatArtifactCard";
import type { WorkflowNode } from "@/types";

// ── Layer helpers ────────────────────────────────────────────────────────────

const LAYER_NUM: Record<string, number> = {
  central: 1,
  channel: 2,
  video: 3,
};

// Full static strings — no dynamic concatenation
const LAYER_PILL_CLASS: Record<string, string> = {
  central: "layer-central",
  channel: "layer-channel",
  video: "layer-video",
};

const LAYER_LABEL: Record<string, string> = {
  central: "中央",
  channel: "频道",
  video: "本视频",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  extraUserBubbles?: string[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AgentStream({ extraUserBubbles = [] }: Props) {
  const run = useRun((s) => s.run);
  const nodes = useRun((s) => s.nodes);
  const stages = useRun((s) => s.stages);
  const simPhase = useRun((s) => s.simPhase);
  const pendingNodeId = useRun((s) => s.pendingNodeId);
  const approveAndContinue = useRun((s) => s.approveAndContinue);
  const rejectAndRollback = useRun((s) => s.rejectAndRollback);
  const currentAutoStep = useRun((s) => s.currentAutoStep);
  const openStage = useUi((s) => s.openStage);

  // Sort nodes by order; fall back to empty array
  const sorted: WorkflowNode[] = [...nodes].sort((a, b) => a.order - b.order);

  // Statuses that should appear in the stream (skip pending/locked/skipped)
  const VISIBLE_STATUSES = new Set(["done", "active", "awaiting_review", "rejected"]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 pb-28 space-y-4">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Static kickoff user bubble (PROTO 2926–2928) */}
        <div className="flex justify-end">
          <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-[12px]">
            跑分镜 Agent，UI 对比镜头用 Skill_Storyboard_02。
          </div>
        </div>

        {/* Per-node blocks */}
        {sorted.map((node) => {
          const nodeRun = run.nodes[node.nodeId];
          const status = nodeRun?.status ?? "pending";

          if (!VISIBLE_STATUSES.has(status)) return null;

          const stage = stages[node.stageId];
          if (!stage) return null;

          const layerNum = LAYER_NUM[stage.layer] ?? 3;

          return (
            <div key={node.nodeId} className="space-y-2">

              {/* Narration line */}
              <div className="text-[10px] text-gray-400 mono">
                ▶ {stage.code} {stage.title} Agent 启动
              </div>

              {/* Active / awaiting_review → full agent card (S8 awaiting_review handled separately below) */}
              {(status === "active" || (status === "awaiting_review" && node.nodeId !== "s8")) && (
                <div className="flex flex-col items-start max-w-[95%]">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-indigo-600 text-white grid place-items-center text-[10px] shrink-0">
                      <Icon.Brain size={12} />
                    </div>
                    <span className="font-bold text-[12px]">{stage.title} Agent · L{layerNum}</span>
                    <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] mono">
                      {stage.code} {nodeRun?.doneCount !== undefined ? `${nodeRun.doneCount}/${nodeRun.totalCount}` : "RUNNING"}
                    </span>
                    <button
                      onClick={() => openStage(node.stageId, true)}
                      className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-700 flex items-center gap-1"
                    >
                      <Icon.Eye size={9} />
                      看实时
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="w-full bg-white border border-gray-200 rounded-xl p-3 shadow-sm">

                    {/* Mounted context */}
                    {nodeRun?.mountedContext && nodeRun.mountedContext.length > 0 && (
                      <div className="mb-3 pb-2 border-b border-gray-100">
                        <div className="text-[10px] uppercase text-gray-400 font-bold mb-1.5">
                          已挂载上下文
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {nodeRun.mountedContext.map((m, i) => {
                            const pillKey = m.layer ?? "video";
                            const pillCls = LAYER_PILL_CLASS[pillKey] ?? "layer-video";
                            const layerLabel = LAYER_LABEL[pillKey] ?? pillKey;
                            return (
                              <span
                                key={i}
                                className={cn("layer-pill px-1.5 py-0.5 rounded", pillCls)}
                              >
                                {layerLabel} · {m.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Checklist */}
                    {nodeRun?.checklist && nodeRun.checklist.length > 0 && (
                      <div className="pl-1 space-y-2 ml-1.5 border-l-2 border-gray-100">
                        {(() => {
                          // Find the first not-done item index
                          const firstNotDone = nodeRun.checklist!.findIndex((c) => !c.done);
                          return nodeRun.checklist!.map((item, i) => {
                            if (item.done) {
                              // Done item — emerald check
                              return (
                                <div key={i} className="flex items-start gap-2 pl-3 -ml-0.5">
                                  <Icon.CircleCheck size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                                  <div className="text-[12px]">{item.label}</div>
                                </div>
                              );
                            } else if (i === firstNotDone) {
                              // Current (first not-done) — spinner + sub info
                              return (
                                <div key={i} className="flex items-start gap-2 pl-3 -ml-0.5">
                                  {/* Spinner — PROTO inline pattern */}
                                  <div className="relative w-3 h-3 mt-1 shrink-0">
                                    <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
                                    <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                                  </div>
                                  <div>
                                    <div className="text-[12px] font-medium text-indigo-700">
                                      {item.label}
                                    </div>
                                  </div>
                                </div>
                              );
                            } else {
                              // Remaining not-done — faint gray circle
                              return (
                                <div key={i} className="flex items-start gap-2 pl-3 -ml-0.5">
                                  <Icon.Circle size={10} className="text-gray-300 mt-0.5 shrink-0" />
                                  <div className="text-[12px] text-gray-400">{item.label}</div>
                                </div>
                              );
                            }
                          });
                        })()}
                      </div>
                    )}

                    {/* If no checklist, show a simple progress hint */}
                    {(!nodeRun?.checklist || nodeRun.checklist.length === 0) && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <div className="relative w-3 h-3 shrink-0">
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        </div>
                        运行中…
                      </div>
                    )}
                  </div>

                  {/* Review card — only for awaiting_review when this is the pending node */}
                  {status === "awaiting_review" && pendingNodeId === node.nodeId && (
                    <div className="mt-2 w-full border border-amber-200 bg-amber-50 rounded-xl p-3 shadow-sm">
                      <div className="text-[11px] font-bold text-amber-800 mb-2">
                        待审核 · 审核闸 {stage.audit ?? ""}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveAndContinue()}
                          className="text-[11px] bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => rejectAndRollback("s5")}
                          className="text-[11px] bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          驳回
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Done → artifact card with tiny "✓ done" prefix */}
              {status === "done" && (
                <div className="space-y-1">
                  <div className="text-[10px] text-emerald-600 mono">
                    ✓ {stage.code} 完成
                  </div>
                  <ChatArtifactCard stageId={node.stageId} />
                  {/* S7 done + s7_edit → confirm card */}
                  {node.nodeId === "s7" && currentAutoStep === "s7_edit" && (
                    <div className="mt-2 max-w-[95%] border border-amber-200 bg-amber-50 rounded-xl p-3 shadow-sm">
                      <div className="text-[11px] font-bold text-amber-800 mb-2">
                        脚本已生成 · 编辑确认后进入 S8
                      </div>
                      <button
                        onClick={() => approveAndContinue()}
                        className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded hover:bg-emerald-700"
                      >
                        确认并进入S8
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* S8 awaiting_review → review card with results */}
              {node.nodeId === "s8" && status === "awaiting_review" && pendingNodeId === "s8" && (() => {
                const s8Output = stages["s8"]?.output as Record<string, unknown> | undefined;
                const s8Roles = (s8Output?.roles ?? []) as Array<Record<string, unknown>>;
                const s8Avg = (s8Output?.average_score as number) ?? 0;
                return (
                  <div className="space-y-1">
                    <div className="text-[10px] text-emerald-600 mono">
                      ✓ {stage.code} 完成
                    </div>
                    <ChatArtifactCard stageId={node.stageId} />
                    {/* 审核结果摘要 */}
                    <div className="mt-2 max-w-[95%] bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[12px] font-bold text-gray-800">综合评分</span>
                        <span className="text-[14px] font-bold text-amber-700">{s8Avg}</span>
                        <span className="text-[11px] text-gray-500">/ 10</span>
                      </div>
                      <div className="space-y-1.5">
                        {s8Roles.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <span>{String(r.avatar ?? "")}</span>
                            <span className="font-medium">{String(r.name ?? "")}</span>
                            {r.score != null && <span className="text-gray-500">{r.score}/10</span>}
                            <span className="text-gray-400 flex-1 truncate">{String(r.summary ?? r.note ?? "")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 审核按钮 */}
                    <div className="mt-2 max-w-[95%] border border-amber-200 bg-amber-50 rounded-xl p-3 shadow-sm">
                      <div className="text-[11px] font-bold text-amber-800 mb-2">
                        请确认审核结果
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => rejectAndRollback("s7")} className="text-[11px] border border-red-300 text-red-600 px-2.5 py-1 rounded hover:bg-red-50">驳回(S7)</button>
                        <button onClick={() => rejectAndRollback("s6")} className="text-[11px] border border-red-300 text-red-600 px-2.5 py-1 rounded hover:bg-red-50">驳回(S6)</button>
                        <button onClick={() => rejectAndRollback("s5")} className="text-[11px] border border-red-300 text-red-600 px-2.5 py-1 rounded hover:bg-red-50">驳回(S5)</button>
                        <button onClick={() => approveAndContinue()} className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded hover:bg-emerald-700">通过</button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Rejected → red notice */}
              {status === "rejected" && (
                <div className="max-w-[95%] border border-red-200 bg-red-50 rounded-xl px-3 py-2 text-[11px] text-red-700">
                  ✗ {stage.code} 审核驳回 · 已停止
                </div>
              )}
            </div>
          );
        })}

        {/* sim phase "done" — all sim nodes done */}
        {simPhase === "done" && (
          <div className="text-center text-[11px] text-gray-400 py-2">
            ✓ 模拟运行完成 · 点重置可重新模拟
          </div>
        )}

        {/* Extra user bubbles from command input */}
        {extraUserBubbles.map((msg, i) => (
          <div key={`echo-${i}`} className="flex justify-end">
            <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-[12px]">
              {msg}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
