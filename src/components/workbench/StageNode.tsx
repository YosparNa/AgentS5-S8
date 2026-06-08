// StageNode.tsx — presentational workbench flow-strip node card.
// Props come from FlowStrip (joined data + callbacks). No direct data imports.
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { useRun } from "@/store/runStore";
import { useUi } from "@/store/uiStore";
import type { WorkflowNode, StageDef } from "@/types";

// ── Static color/text lookups (no dynamic class concatenation) ──────────────

const LAYER_CODE_COLOR: Record<string, string> = {
  central: "text-purple-600",
  channel: "text-sky-600",
  video: "text-indigo-600",
};

const LAYER_NUM: Record<string, string> = {
  central: "1",
  channel: "2",
  video: "3",
};

// ── Component ──────────────────────────────────────────────────────────────

interface StageNodeProps {
  node: WorkflowNode;
  stage: StageDef;
  onRemove: () => void;
  onToggle: () => void;
}

export function StageNode({ node, stage, onRemove, onToggle }: StageNodeProps) {
  const navigate = useNavigate();
  const openStage = useUi((s) => s.openStage);
  const status = useRun((s) => s.run.nodes[node.nodeId]?.status ?? "pending");
  const nr = useRun((s) => s.run.nodes[node.nodeId]);

  // ── Root class derivation ────────────────────────────────────────────────

  // width
  const widthCls = node.special
    ? "min-w-[82px]"
    : status === "active"
    ? "min-w-[72px]"
    : "min-w-[68px]";

  // status modifiers
  let statusMod = "";
  let extraCls = "";
  if (node.enabled === false) {
    statusMod = "disabled";
  } else if (node.special) {
    statusMod = "special";
  } else {
    switch (status) {
      case "done":
        statusMod = "done";
        break;
      case "active":
        statusMod = "active";
        break;
      case "awaiting_review":
        statusMod = "active";
        break;
      case "rejected":
        statusMod = "locked";
        extraCls = "ring-1 ring-red-400";
        break;
      case "skipped":
        statusMod = "disabled";
        break;
      case "pending":
      case "locked":
        if (node.layer === "video") {
          statusMod = "locked";
        } else if (node.layer === "channel") {
          statusMod = "account";
        }
        break;
    }
    // channel layer always gets account modifier (overwrite if not already set by status logic)
    if (node.layer === "channel" && statusMod !== "locked" && statusMod !== "disabled") {
      // account is a secondary modifier — add it alongside status mod
      // We compose both: e.g. "stage account done" or "stage account"
    }
  }

  const accountMod = node.layer === "channel" && !node.special ? "account" : "";

  const rootCls = cn(
    "stage border rounded-md p-1.5 shrink-0",
    widthCls,
    accountMod,
    statusMod,
    extraCls
  );

  // ── Code line color ──────────────────────────────────────────────────────
  let codeColor: string;
  if (status === "active" || status === "awaiting_review") {
    codeColor = "opacity-80";
  } else if (node.special) {
    codeColor = "text-orange-700 font-bold";
  } else if (status === "pending" || status === "locked") {
    if (node.layer === "video") {
      codeColor = "text-gray-400";
    } else {
      codeColor = LAYER_CODE_COLOR[node.layer] ?? "text-gray-400";
    }
  } else {
    codeColor = LAYER_CODE_COLOR[node.layer] ?? "text-gray-400";
  }

  // ── Code line text ───────────────────────────────────────────────────────
  const layerNum = LAYER_NUM[node.layer] ?? "";
  // For final node, stage.code is '⑦' — just show it without ·L suffix
  const codeText =
    stage.code === "⑦"
      ? stage.code
      : `${stage.code}·L${layerNum}${node.star ? " ★" : ""}${node.special ? " 🔥" : ""}`;

  const isActive = status === "active";

  // ── Badge line ───────────────────────────────────────────────────────────
  let badgeContent: React.ReactNode = null;
  if (isActive && nr?.totalCount) {
    badgeContent = (
      <span className="opacity-90">
        {nr.percent ?? 0}% · {nr.doneCount ?? 0}/{nr.totalCount}
      </span>
    );
  } else if (status === "awaiting_review") {
    badgeContent = <span className="text-amber-300">待审核</span>;
  } else if (status === "rejected") {
    badgeContent = <span className="text-red-500">驳回</span>;
  } else if (status === "done") {
    if (node.badge) {
      badgeContent = <span className={node.badge.cls}>{node.badge.text}</span>;
    } else {
      badgeContent = <span className="text-emerald-600">✓</span>;
    }
  } else if (node.badge) {
    // pending/locked L2 reuse or special badges
    badgeContent = <span className={node.badge.cls}>{node.badge.text}</span>;
  }

  // ── Click handler ────────────────────────────────────────────────────────
  function handleClick() {
    if (node.special) {
      navigate("/viral");
    } else {
      openStage(node.stageId, status === "active");
    }
  }

  return (
    <div className={rootCls} onClick={handleClick} data-stage={node.stageId}>
      {/* 1. Drag handle — CSS hides unless ancestor has edit-mode class */}
      <span className="stage-drag-handle">⋮⋮</span>

      {/* 2. Delete button — only deletable nodes */}
      {node.deletable && (
        <span
          className="stage-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="删除此阶段"
        >
          ×
        </span>
      )}

      {/* 3. Audit gate */}
      {node.audit && (
        <div
          className={cn(
            "audit-gate",
            status === "done" && "done",
            node.stageId === "final" && "final"
          )}
        >
          {node.audit}
        </div>
      )}

      {/* 4. Code line */}
      <div className={cn("text-[8px] mono mt-0.5", codeColor)}>
        {codeText}
        {node.scheduled && <Icon.Clock size={8} className="inline ml-0.5 text-purple-500" />}
        {isActive && " ▶"}
      </div>

      {/* 5. Title */}
      <div
        className={cn(
          "text-[10px] font-bold mt-0.5",
          (status === "pending" || status === "locked") &&
            node.layer === "video" &&
            "text-gray-500",
          node.special && "text-orange-900"
        )}
      >
        {stage.title}
      </div>

      {/* 6. Badge line */}
      {badgeContent !== null && (
        <div className="text-[8px] mono mt-0.5">{badgeContent}</div>
      )}

      {/* 7. Toggle wrap — only deletable nodes (L3 S5+) */}
      {node.deletable && (
        <div className="stage-toggle-wrap">
          <span>启用</span>
          <div
            className={cn("toggle", node.enabled && "on")}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          />
        </div>
      )}
    </div>
  );
}
