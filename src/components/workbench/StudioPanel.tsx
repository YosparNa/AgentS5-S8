// StudioPanel — right aside, width 320px
// C3b: Studio 产物 panel
// PROTO lines 2969–3047

import { useState, useEffect } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useUi } from "@/store/uiStore";
import { useRun } from "@/store/runStore";
import { dataProvider } from "@/services/dataProvider";
import type { RunStatus, StageDef } from "@/types";
import { TopicArtifact } from "@/components/drawer/artifacts/TopicArtifact";
import { OutlineArtifact } from "@/components/drawer/artifacts/OutlineArtifact";

// ── Product card config ────────────────────────────────────────────────────

type CardColor = "emerald" | "indigo" | "gray" | "pink" | "blue" | "purple";

interface ProductCard {
  gate: string;
  label: string;
  stageId: string;
  /** 关联的多个阶段（按顺序，取第一个未完成阶段的状态显示） */
  linkedStages?: string[];
  files?: string[];
  color: CardColor;
  /** Show 76% progress bar when active (分镜+图像 card) */
  progress?: boolean;
}

const PRODUCT_CARDS: ProductCard[] = [
  {
    gate: "②",
    label: "选题 + 大纲",
    stageId: "s6",
    linkedStages: ["s5", "s6"],
    color: "emerald",
  },
  {
    gate: "③",
    label: "脚本 + 对抗",
    stageId: "s8",
    linkedStages: ["s7", "s8"],
    color: "emerald",
  },
  {
    gate: "④",
    label: "分镜 + 图像",
    stageId: "s9",
    files: ["分镜 · 29/38", "图像 · 待 S10"],
    color: "indigo",
    progress: true,
  },
  {
    gate: "⑤",
    label: "语音",
    stageId: "s11",
    color: "gray",
  },
  {
    gate: "⑥",
    label: "字幕",
    stageId: "s12",
    color: "gray",
  },
  {
    gate: "⑦",
    label: "人工终审",
    stageId: "final",
    files: ["成片+封面+质检"],
    color: "pink",
  },
  {
    gate: "S16",
    label: "运营发布",
    stageId: "s16",
    files: ["YouTube · 05-13 20:00", "X · 长推同步", "Shorts ×5"],
    color: "blue",
  },
  {
    gate: "S17",
    label: "数据复盘",
    stageId: "s17",
    color: "purple",
  },
];

// ── cardClasses: returns full static Tailwind class strings per color+status ──
// Must NOT build class names by concatenation — all strings must be complete literals.

function cardClasses(
  color: CardColor,
  status: RunStatus
): {
  wrapper: string;
  header: string;
  gateBg: string;
  gateText: string;
  labelText: string;
  statusText: string;
  fileIcon: string;
} {
  if (status === "done") {
    switch (color) {
      case "emerald":
        return {
          wrapper: "w-full text-left mb-2 bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-300",
          header: "px-2 py-1.5 bg-emerald-50/60 border-b border-emerald-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-emerald-500 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-emerald-900",
          statusText: "text-[9px] text-emerald-600 mono",
          fileIcon: "text-emerald-500",
          labelText: "text-[10px] font-bold text-emerald-900",
        };
      case "indigo":
        return {
          wrapper: "w-full text-left mb-2 bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300",
          header: "px-2 py-1.5 bg-indigo-50/60 border-b border-indigo-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-indigo-500 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-indigo-900",
          statusText: "text-[9px] text-indigo-600 mono",
          fileIcon: "text-indigo-500",
          labelText: "text-[10px] font-bold text-indigo-900",
        };
      case "pink":
        return {
          wrapper: "w-full text-left mb-2 bg-white border border-pink-200 rounded-lg overflow-hidden hover:border-pink-300",
          header: "px-2 py-1.5 bg-pink-50/50 border-b border-pink-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-pink-500 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-pink-900",
          statusText: "text-[9px] text-pink-600 mono",
          fileIcon: "text-pink-500",
          labelText: "text-[10px] font-bold text-pink-900",
        };
      case "blue":
        return {
          wrapper: "w-full text-left mb-2 bg-white border border-blue-200 rounded-lg overflow-hidden hover:border-blue-300",
          header: "px-2 py-1.5 bg-blue-50/60 border-b border-blue-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-blue-500 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-blue-900",
          statusText: "text-[9px] text-blue-600 mono",
          fileIcon: "text-blue-500",
          labelText: "text-[10px] font-bold text-blue-900",
        };
      case "purple":
        return {
          wrapper: "w-full text-left mb-2 bg-white border border-purple-200 rounded-lg overflow-hidden hover:border-purple-300",
          header: "px-2 py-1.5 bg-purple-50/60 border-b border-purple-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-purple-500 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-purple-900",
          statusText: "text-[9px] text-purple-600 mono",
          fileIcon: "text-purple-500",
          labelText: "text-[10px] font-bold text-purple-900",
        };
      default: // gray done
        return {
          wrapper: "w-full text-left mb-2 bg-white border border-gray-200 rounded-lg overflow-hidden hover:opacity-100",
          header: "px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-gray-400 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-gray-700",
          statusText: "text-[9px] text-gray-500 mono",
          fileIcon: "text-gray-400",
          labelText: "text-[10px] font-bold text-gray-700",
        };
    }
  }

  if (status === "active") {
    switch (color) {
      case "indigo":
        return {
          wrapper: "w-full text-left mb-2 bg-white border-2 border-indigo-300 rounded-lg overflow-hidden shadow-sm",
          header: "px-2 py-1.5 bg-indigo-50 border-b border-indigo-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-amber-400 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-indigo-900",
          statusText: "text-[9px] text-indigo-600 mono blink",
          fileIcon: "text-indigo-600",
          labelText: "text-[10px] font-bold text-indigo-900",
        };
      case "emerald":
        return {
          wrapper: "w-full text-left mb-2 bg-white border-2 border-emerald-300 rounded-lg overflow-hidden shadow-sm",
          header: "px-2 py-1.5 bg-emerald-50 border-b border-emerald-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-amber-400 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-emerald-900",
          statusText: "text-[9px] text-emerald-600 mono blink",
          fileIcon: "text-emerald-500",
          labelText: "text-[10px] font-bold text-emerald-900",
        };
      case "pink":
        return {
          wrapper: "w-full text-left mb-2 bg-white border-2 border-pink-300 rounded-lg overflow-hidden shadow-sm",
          header: "px-2 py-1.5 bg-pink-50 border-b border-pink-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-amber-400 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-pink-900",
          statusText: "text-[9px] text-pink-600 mono blink",
          fileIcon: "text-pink-500",
          labelText: "text-[10px] font-bold text-pink-900",
        };
      case "blue":
        return {
          wrapper: "w-full text-left mb-2 bg-white border-2 border-blue-300 rounded-lg overflow-hidden shadow-sm",
          header: "px-2 py-1.5 bg-blue-50 border-b border-blue-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-amber-400 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-blue-900",
          statusText: "text-[9px] text-blue-600 mono blink",
          fileIcon: "text-blue-500",
          labelText: "text-[10px] font-bold text-blue-900",
        };
      case "purple":
        return {
          wrapper: "w-full text-left mb-2 bg-white border-2 border-purple-300 rounded-lg overflow-hidden shadow-sm",
          header: "px-2 py-1.5 bg-purple-50 border-b border-purple-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-amber-400 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-purple-900",
          statusText: "text-[9px] text-purple-600 mono blink",
          fileIcon: "text-purple-500",
          labelText: "text-[10px] font-bold text-purple-900",
        };
      default: // gray active
        return {
          wrapper: "w-full text-left mb-2 bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm",
          header: "px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex justify-between",
          gateBg: "w-4 h-4 rounded bg-amber-400 text-white grid place-items-center text-[9px] font-bold",
          gateText: "text-[10px] font-bold text-gray-900",
          statusText: "text-[9px] text-gray-600 mono blink",
          fileIcon: "text-gray-400",
          labelText: "text-[10px] font-bold text-gray-900",
        };
    }
  }

  // pending / locked / default
  switch (color) {
    case "pink":
      return {
        wrapper: "w-full text-left mb-2 bg-white border border-pink-200 rounded-lg overflow-hidden opacity-70 hover:opacity-100",
        header: "px-2 py-1.5 bg-pink-50/50 border-b border-pink-100 flex justify-between",
        gateBg: "w-4 h-4 rounded bg-pink-500 text-white grid place-items-center text-[9px] font-bold",
        gateText: "text-[10px] font-bold text-pink-900",
        statusText: "text-[9px] text-pink-500 mono",
        fileIcon: "text-gray-400",
        labelText: "text-[10px] font-bold text-pink-900",
      };
    case "blue":
      return {
        wrapper: "w-full text-left mb-2 bg-white border border-gray-200 rounded-lg overflow-hidden opacity-70 hover:opacity-100 hover:border-blue-300",
        header: "px-2 py-1.5 bg-blue-50/60 border-b border-blue-100 flex justify-between",
        gateBg: "w-4 h-4 rounded bg-blue-500 text-white grid place-items-center text-[9px] font-bold",
        gateText: "text-[10px] font-bold text-blue-900",
        statusText: "text-[9px] text-gray-400 mono",
        fileIcon: "text-gray-500",
        labelText: "text-[10px] font-bold text-blue-900",
      };
    case "purple":
      return {
        wrapper: "w-full text-left mb-2 bg-white border border-gray-200 rounded-lg overflow-hidden opacity-70 hover:opacity-100 hover:border-purple-300",
        header: "px-2 py-1.5 bg-purple-50/60 border-b border-purple-100 flex justify-between",
        gateBg: "w-4 h-4 rounded bg-purple-500 text-white grid place-items-center text-[9px] font-bold",
        gateText: "text-[10px] font-bold text-purple-900",
        statusText: "text-[9px] text-gray-400 mono",
        fileIcon: "text-gray-400",
        labelText: "text-[10px] font-bold text-purple-900",
      };
    case "emerald":
      return {
        wrapper: "w-full text-left mb-2 bg-white border border-gray-200 rounded-lg overflow-hidden opacity-60 hover:opacity-100",
        header: "px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex justify-between",
        gateBg: "w-4 h-4 rounded bg-gray-300 text-white grid place-items-center text-[9px] font-bold",
        gateText: "text-[10px] font-bold",
        statusText: "text-[9px] text-gray-400 mono",
        fileIcon: "text-gray-400",
        labelText: "text-[10px] font-bold",
      };
    case "indigo":
      return {
        wrapper: "w-full text-left mb-2 bg-white border border-gray-200 rounded-lg overflow-hidden opacity-60 hover:opacity-100",
        header: "px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex justify-between",
        gateBg: "w-4 h-4 rounded bg-gray-300 text-white grid place-items-center text-[9px] font-bold",
        gateText: "text-[10px] font-bold",
        statusText: "text-[9px] text-gray-400 mono",
        fileIcon: "text-gray-400",
        labelText: "text-[10px] font-bold",
      };
    default: // gray pending
      return {
        wrapper: "w-full text-left mb-2 bg-white border border-gray-200 rounded-lg overflow-hidden opacity-60 hover:opacity-100",
        header: "px-2 py-1.5 bg-gray-50 border-b border-gray-100 flex justify-between",
        gateBg: "w-4 h-4 rounded bg-gray-300 text-white grid place-items-center text-[9px] font-bold",
        gateText: "text-[10px] font-bold",
        statusText: "text-[9px] text-gray-400 mono",
        fileIcon: "text-gray-400",
        labelText: "text-[10px] font-bold",
      };
  }
}

// ── File icon resolver ─────────────────────────────────────────────────────

function FileIcon({ label, cls }: { label: string; cls: string }) {
  if (label.startsWith("脚本")) return <Icon.FilePen size={10} className={cls} />;
  if (label.startsWith("角色") || label.includes("质疑")) return <Icon.Gavel size={10} className={cls} />;
  if (label.startsWith("分镜")) return <Icon.Film size={10} className={cls} />;
  if (label.startsWith("图像")) return <Icon.Images size={10} className={cls} />;
  if (label.startsWith("YouTube") || label.startsWith("Shorts")) return <Icon.Youtube size={10} className={cls} />;
  if (label.startsWith("X ·")) return <Icon.Send size={10} className={cls} />;
  return <Icon.FileText size={10} className={cls} />;
}

// ── ProductCard component ──────────────────────────────────────────────────

function ProductCardItem({
  card,
}: {
  card: ProductCard;
}) {
  const nodeStatuses = useRun((s) => s.run.nodes);
  const stageVersion = useRun((s) => s.stageVersion);
  const expandedStudioCard = useUi((s) => s.expandedStudioCard);
  const setExpandedStudioCard = useUi((s) => s.setExpandedStudioCard);

  const [expanded, setExpanded] = useState(false);
  const [allStageData, setAllStageData] = useState<Record<string, StageDef>>({});

  const linkedStages = card.linkedStages ?? [card.stageId];
  const isS5S8 = linkedStages.some(s => ["s5", "s6", "s7", "s8"].includes(s));

  // 找到第一个未完成的阶段（用于状态显示）
  const effectiveStageId = linkedStages.find(sid => {
    const st = nodeStatuses[sid]?.status;
    return st !== "done" && st !== "completed";
  }) ?? linkedStages[linkedStages.length - 1];

  const effectiveStatus = nodeStatuses[effectiveStageId]?.status ?? "pending";
  const effectivePercent = nodeStatuses[effectiveStageId]?.percent ?? 0;

  // Auto-expand when expandedStudioCard matches
  useEffect(() => {
    if (linkedStages.includes(expandedStudioCard ?? "")) {
      setExpanded(true);
      setExpandedStudioCard(null);
    }
  }, [expandedStudioCard, linkedStages, setExpandedStudioCard]);

  // Load all linked stage data
  useEffect(() => {
    if (isS5S8) {
      Promise.all(linkedStages.map(sid => dataProvider.getStage(sid))).then(results => {
        const map: Record<string, StageDef> = {};
        results.forEach(sd => { if (sd) map[sd.code.toLowerCase()] = sd; });
        setAllStageData(map);
      });
    }
  }, [stageVersion, isS5S8, linkedStages]);

  function statusLabel(): string {
    if (effectiveStatus === "done") return "已通过";
    if (effectiveStatus === "awaiting_review") return "待审核";
    if (effectiveStatus === "active") return `${effectivePercent}%`;
    if (effectiveStatus === "skipped") return "已跳过";
    if (effectiveStatus === "rejected") return "已驳回";
    return `待 ${effectiveStageId.toUpperCase()}`;
  }

  const cls = cardClasses(card.color, effectiveStatus);

  // 每个关联阶段的独立信息
  function stageLines(): { icon: string; label: string; statusText: string; isDone: boolean; clickable?: boolean; sid?: string }[] {
    if (!isS5S8) {
      const files = card.files ?? [];
      return files.map(f => ({ icon: f, label: f, statusText: "", isDone: false }));
    }
    return linkedStages.map(sid => {
      const st = nodeStatuses[sid]?.status ?? "pending";
      const sd = allStageData[sid];
      const output = sd?.output as Record<string, unknown> | undefined;
      const hasOutput = output && Object.keys(output).length > 0;
      const kind = sd?.config.kind;

      let label = `待 ${sid.toUpperCase()}`;
      if (hasOutput) {
        if (kind === "topic") {
          const topics = (output!.topics ?? []) as Array<{ score: number }>;
          const best = topics.length > 0 ? Math.max(...topics.map(t => t.score)) : 0;
          label = `选题卡 · ${best} 分`;
        } else if (kind === "outline") {
          const outline = (output!.outline ?? []) as Array<unknown>;
          label = `大纲 · ${outline.length} 章`;
        } else if (kind === "script") {
          const wc = (output!.word_count as number) ?? 0;
          label = `脚本 · ${wc.toLocaleString()} 字`;
        } else if (kind === "adversarial") {
          const roles = (output!.roles ?? []) as Array<unknown>;
          label = `${roles.length} 角色质疑`;
        }
      }

      let statusText = "";
      if (st === "done" || st === "completed") statusText = "✓";
      else if (st === "active") statusText = `${nodeStatuses[sid]?.percent ?? 0}%`;
      else if (st === "awaiting_review") statusText = "待审";
      else statusText = `待${sid.toUpperCase()}`;

      // S7/S8 有产物时可点击打开 FileModal
      const clickable = hasOutput && (kind === "script" || kind === "adversarial");

      return { icon: label, label, statusText, isDone: st === "done" || st === "completed", clickable, sid };
    });
  }

  const lines = stageLines();

  function handleExpand() {
    setExpanded(prev => !prev);
  }

  return (
    <div className="mb-1.5">
      <button onClick={() => { handleExpand(); }} className={cls.wrapper}>
        {/* Header */}
        <div className={cls.header}>
          <div className="flex items-center gap-1.5">
            <span className={cls.gateBg}>{card.gate}</span>
            <span className={cls.labelText}>{card.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cls.statusText}>{statusLabel()}</span>
            {isS5S8 && (
              <Icon.ChevronDown size={10} className={cn("text-gray-400 transition-transform", expanded && "rotate-180")} />
            )}
          </div>
        </div>

        {/* Body: per-stage lines */}
        {lines.length > 0 && (
          <div className="p-2 text-[10px] space-y-0.5">
            {lines.map((line, i) => {
              const content = (
                <>
                  <FileIcon label={line.label} cls={cls.fileIcon} />
                  <span className="flex-1">{line.label}</span>
                  <span className={cn("mono", line.isDone ? "text-emerald-600" : "text-gray-400")}>{line.statusText}</span>
                  {line.clickable && <span className="text-[9px] text-indigo-500">点击查看</span>}
                </>
              );
              if (line.clickable && line.sid) {
                return (
                  <div key={i}
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-indigo-50 rounded px-1 py-0.5 transition"
                    onClick={(e) => { e.stopPropagation(); useUi.getState().openFile(line.sid!); }}
                  >
                    {content}
                  </div>
                );
              }
              return <div key={i} className="flex items-center gap-1.5">{content}</div>;
            })}
          </div>
        )}
      </button>

      {/* Inline artifact expansion — 显示所有关联阶段的产物 */}
      {expanded && isS5S8 && (() => {
        const hasAnyOutput = linkedStages.some(sid => {
          const o = allStageData[sid]?.output as Record<string, unknown> | undefined;
          return o && Object.keys(o).length > 0;
        });
        if (!hasAnyOutput) return null;
        return (
          <div className="border border-gray-200 border-t-0 rounded-b-lg bg-white px-2 pb-2 max-h-[400px] overflow-y-auto space-y-3">
            {linkedStages.map(sid => {
              const sd = allStageData[sid];
              const o = sd?.output as Record<string, unknown> | undefined;
              if (!o || Object.keys(o).length === 0) return null;
              const kind = sd?.config.kind;
              return (
                <div key={sid}>
                  <div className="text-[10px] font-bold text-gray-500 mb-1 pt-1">{sid.toUpperCase()} 产物</div>
                  {kind === "topic" && (() => {
                    const topics = o.topics as Parameters<typeof TopicArtifact>[0]["topics"];
                    return topics?.length ? <TopicArtifact topics={topics} /> : null;
                  })()}
                  {kind === "outline" && (() => {
                    const outline = o.outline as Parameters<typeof OutlineArtifact>[0]["outline"];
                    return outline?.length ? (
                      <OutlineArtifact outline={outline} totalDuration={o.total_duration as string} crisisPoints={o.crisis_points as number[]} climaxPosition={o.climax_position as string} />
                    ) : null;
                  })()}
                  {kind === "script" && (() => {
                    const useUi_ = useUi.getState();
                    return (
                      <button
                        onClick={(e) => { e.stopPropagation(); useUi_.openFile(sid); }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-3 py-1.5 hover:bg-indigo-50 transition w-full text-left"
                      >
                        📄 点击查看脚本
                      </button>
                    );
                  })()}
                  {kind === "adversarial" && (() => {
                    const useUi_ = useUi.getState();
                    return (
                      <button
                        onClick={(e) => { e.stopPropagation(); useUi_.openFile(sid); }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-3 py-1.5 hover:bg-indigo-50 transition w-full text-left"
                      >
                        ⚔️ 点击查看审核结果
                      </button>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// ── StudioPanel ────────────────────────────────────────────────────────────

export function StudioPanel() {
  const openStage = useUi((s) => s.openStage);
  const openModal = useUi((s) => s.openModal);

  return (
    <aside className="w-[320px] bg-[#f8fafc] border-l border-gray-200 flex flex-col shrink-0">

      {/* Header */}
      <div className="px-3 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-[12px] flex items-center gap-1.5">
          <Icon.Boxes size={11} className="text-indigo-500" />
          Studio 产物
        </h2>
        <span className="text-[9px] text-gray-400 mono">点 → 子页</span>
      </div>

      {/* Scroll body */}
      <div className="flex-1 overflow-y-auto">

        {/* 频道资产 */}
        <details className="border-b border-gray-200" open>
          <summary className="px-3 py-2 bg-sky-50/50 flex items-center justify-between hover:bg-sky-50 cursor-pointer list-none">
            <div className="flex items-center gap-1.5">
              <span className="layer-dot layer-channel" />
              <span className="text-[11px] font-bold text-sky-900 uppercase">频道资产</span>
              <span className="text-[9px] mono text-sky-600">L2 复用</span>
            </div>
            <Icon.ChevronDown size={9} className="text-sky-500" />
          </summary>
          <div className="p-2 space-y-1.5 bg-sky-50/20">
            <button
              onClick={() => openStage("s3")}
              className="w-full bg-white border border-sky-100 rounded-md p-2 hover:shadow-sm text-left"
            >
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold">频道定位档案</span>
                <span className="text-[9px] text-emerald-600">审①✓</span>
              </div>
            </button>
            <button
              onClick={() => openStage("s2")}
              className="w-full bg-white border border-sky-100 rounded-md p-2 hover:shadow-sm text-left"
            >
              <div className="text-[11px] font-semibold">对标矩阵 ×12</div>
            </button>
            <button
              onClick={() => openStage("s4")}
              className="w-full bg-white border border-sky-100 rounded-md p-2 hover:shadow-sm text-left"
            >
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold">今日热点 5 条</span>
                <span className="text-[9px] text-purple-600 flex items-center gap-0.5">
                  <Icon.Clock size={8} />
                  06:00
                </span>
              </div>
            </button>
          </div>
        </details>

        {/* 本视频产物 */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="layer-dot layer-video" />
              <span className="text-[11px] font-bold text-indigo-900 uppercase">本视频产物</span>
            </div>
            <span className="text-[9px] text-indigo-500 mono">7 审核 + 发布 + 数据</span>
          </div>

          {PRODUCT_CARDS.map((card) => (
            <ProductCardItem key={card.stageId} card={card} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-gray-200 bg-white">
        <button
          onClick={() => openModal("sediment")}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5"
        >
          <Icon.Brain size={10} className="text-amber-300" />
          沉淀本任务经验...
        </button>
        <div className="text-[9px] text-center text-gray-400 mt-1">系统已识别 2 个高价值候选</div>
      </div>
    </aside>
  );
}
