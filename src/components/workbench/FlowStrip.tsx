// FlowStrip.tsx — horizontal scrollable workflow node strip.
// Reads nodes from runStore (single source of truth); STAGES joined here and passed to StageNode.
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { useRun } from "@/store/runStore";
import { useUi } from "@/store/uiStore";
import { StageNode } from "./StageNode";

// Divider color lookup — full static strings, no concatenation
const DIVIDER_COLOR: Record<string, string> = {
  sky: "bg-sky-200",
  indigo: "bg-indigo-200",
};

export function FlowStrip() {
  const nodes = useRun((s) => s.nodes);
  const stages = useRun((s) => s.stages);
  const loadNodes = useRun((s) => s.loadNodes);
  const loadStages = useRun((s) => s.loadStages);
  const toggleNode = useRun((s) => s.toggleNode);
  const removeNode = useRun((s) => s.removeNode);

  const editMode = useUi((s) => s.editMode);
  const simPhase = useRun((s) => s.simPhase);
  const openModal = useUi((s) => s.openModal);

  // Load nodes + stage defs once on mount (stage meta read from store, not src/data)
  useEffect(() => {
    loadNodes();
    loadStages();
  }, [loadNodes, loadStages]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleRemove(nodeId: string, stageId: string) {
    if (simPhase === "running") return;
    const code = stages[stageId]?.code ?? stageId;
    if (!window.confirm(`确认删除阶段 ${code} ?`)) return;
    removeNode(nodeId);
  }

  function handleToggle(nodeId: string) {
    if (simPhase === "running") return;
    toggleNode(nodeId);
  }

  const sorted = [...nodes].sort((a, b) => a.order - b.order);

  return (
    <div className={cn("relative", editMode && "edit-mode")}>
      {/* Horizontal scroll row */}
      <div className="flex gap-1 overflow-x-auto pb-6 pt-3 px-0.5 items-stretch">
        {sorted.map((node, idx) => {
          const stage = stages[node.stageId];
          // Guard: stage meta not loaded yet / newly inserted stub — skip render
          if (!stage) return null;

          const dividerColor = node.dividerBefore
            ? (DIVIDER_COLOR[node.dividerBefore] ?? "bg-gray-200")
            : null;

          return (
            <div key={node.nodeId} className="contents">
              {/* Segment divider before this node */}
              {dividerColor && (
                <div className={cn("w-px mx-0.5 my-1 shrink-0", dividerColor)} />
              )}

              <StageNode
                node={node}
                stage={stage}
                onRemove={() => handleRemove(node.nodeId, node.stageId)}
                onToggle={() => handleToggle(node.nodeId)}
              />

              {/* Insert button after every node except the very last */}
              {idx < sorted.length - 1 ? (
                <button
                  className="stage-insert-btn"
                  onClick={() => openModal("insertStage")}
                  title="在这里插入新阶段"
                >
                  <Icon.Plus size={10} />
                </button>
              ) : (
                // Trailing insert after last node
                <button
                  className="stage-insert-btn"
                  onClick={() => openModal("insertStage")}
                  title="在末尾添加新阶段"
                >
                  <Icon.Plus size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-3 text-[9px] text-gray-500 mt-1 px-0.5">
        <span className="flex items-center gap-1">
          <span className="layer-dot layer-central" />
          L1
        </span>
        <span className="flex items-center gap-1">
          <span className="layer-dot layer-channel" />
          L2 复用
        </span>
        <span className="flex items-center gap-1">
          <span className="layer-dot layer-video" />
          L3 独立
        </span>
        <span className="text-amber-600">⓪ 审核</span>
        <span className="text-gray-400 italic ml-auto">
          点阶段 → 子页 / 实时执行
        </span>
      </div>
    </div>
  );
}
