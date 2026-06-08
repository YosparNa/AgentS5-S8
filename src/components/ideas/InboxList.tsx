// 频道收件箱 候选列表 — PROTO lines ~1444–1627
// guardrail: no direct src/data/* imports; enum→class via toneMaps; icons via @/components/icons.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import type { InboxItem, InboxSourceTone } from "@/types/ideas";
import { sourceToneClass, signalToneClass, smallBadgeToneClass } from "./toneMaps";

interface Props {
  items: InboxItem[];
}

const INITIAL_COUNT = 7;

// Filter chip definitions
const FILTER_CHIPS: Array<{ label: string; tone: InboxSourceTone | "all" }> = [
  { label: "全部", tone: "all" },
  { label: "🛰️ 雷达", tone: "indigo" },
  { label: "🔥 热点", tone: "purple" },
  { label: "💬 评论", tone: "emerald" },
  { label: "🏆 回溯", tone: "amber" },
  { label: "🤖 AI", tone: "sky" },
];

export function InboxList({ items }: Props) {
  const navigate = useNavigate();
  const [activeTone, setActiveTone] = useState<InboxSourceTone | "all">("all");
  const [expanded, setExpanded] = useState(false);

  // Filter by sourceTone
  const filtered =
    activeTone === "all"
      ? items
      : items.filter((item) => item.sourceTone === activeTone);

  // Expand/collapse
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hiddenCount = filtered.length - INITIAL_COUNT;

  return (
    <div>
      {/* Source filter chips */}
      <div className="flex items-center gap-1 mb-3 flex-wrap text-[11px]">
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeTone === chip.tone;
          return (
            <button
              key={chip.tone}
              onClick={() => {
                setActiveTone(chip.tone);
                setExpanded(false);
              }}
              className={cn(
                "px-2.5 py-1 rounded-full font-semibold transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
              )}
            >
              {chip.label}
              {chip.tone === "all" && (
                <span className="ml-1">{items.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Candidate list */}
      <div className="space-y-1.5">
        {visible.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-xl p-3 hover:border-indigo-300 cursor-pointer transition flex items-center gap-3"
          >
            {/* Source chip */}
            <span
              className={cn(
                "text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0",
                sourceToneClass[item.sourceTone]
              )}
            >
              {item.sourceLabel}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-bold truncate">{item.title}</h4>
              <div className="flex items-center gap-3 text-[10px] text-gray-600 mt-0.5 flex-wrap">
                {item.outlier && (
                  <>
                    <span>
                      <b className="text-emerald-700 font-mono">{item.outlier}</b> outlier
                    </span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {item.views && (
                  <>
                    <span>{item.views} views</span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {item.velocity && (
                  <>
                    <span>
                      velocity <b>~{item.velocity}</b>
                    </span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {item.interactRate && (
                  <>
                    <span>
                      互动 <b className="text-emerald-700">{item.interactRate}</b>
                    </span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {item.vsubs && (
                  <>
                    <span>
                      v/subs <b>{item.vsubs}</b>
                    </span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {item.trendLabel && (
                  <>
                    <span className="text-orange-600">{item.trendLabel}</span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {item.creatorHandle && (
                  <>
                    <span>
                      来源 {item.creatorHandle}
                      {item.creatorBadgeText && (
                        <span
                          className={cn(
                            "text-[8px] font-bold rounded px-1 ml-0.5",
                            // creator badges in inbox use fuchsia for 拐点, emerald for 新进 — both are CreatorBadgeTone
                            smallBadgeToneClass["fuchsia"]
                          )}
                        >
                          {item.creatorBadgeText}
                        </span>
                      )}
                    </span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {item.note && (
                  <span className="text-gray-500">{item.note}</span>
                )}
              </div>
            </div>

            {/* Score + action */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div
                  className={cn(
                    "text-[16px] font-black font-mono leading-none",
                    signalToneClass[item.signalTone]
                  )}
                >
                  {item.score.toFixed(1)}
                </div>
                <div
                  className={cn(
                    "text-[8px] mt-0.5",
                    item.signalTone === "green" ? "text-emerald-500" : "text-amber-500"
                  )}
                >
                  {item.signalTone === "green" ? "●●○" : "●○○"}
                </div>
              </div>
              <button
                onClick={() => navigate("/workbench")}
                className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded font-semibold"
              >
                启动 L3 →
              </button>
            </div>
          </div>
        ))}

        {/* Expand / collapse toggle */}
        {hiddenCount > 0 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full text-[11px] text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/40 py-2 border border-dashed border-gray-300 rounded-xl font-semibold mt-1 flex items-center justify-center gap-1.5"
          >
            <Icon.ChevronDown className="w-[9px] h-[9px]" />
            展开剩余 {hiddenCount} 条
          </button>
        )}
        {expanded && filtered.length > INITIAL_COUNT && (
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-[11px] text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/40 py-2 border border-dashed border-gray-300 rounded-xl font-semibold mt-1 flex items-center justify-center gap-1.5"
          >
            <Icon.ChevronUp className="w-[9px] h-[9px]" />
            收起
          </button>
        )}
      </div>
    </div>
  );
}
