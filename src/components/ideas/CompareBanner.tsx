// CompareBanner — Task E3.
// Sticky compare banner displayed at top of radar pane when compareList.length > 0.
// Reproduces PROTO 641-650 + renderCompareBanner 2137-2155.
// Track titles are resolved async via getTrackDetail for fidelity.
import { useState, useEffect } from "react";
import { useUi } from "@/store/uiStore";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";
import type { TrackDetail } from "@/types/ideas";

export function CompareBanner() {
  const compareList = useUi((s) => s.compareList);
  const removeCompare = useUi((s) => s.removeCompare);
  const clearCompare = useUi((s) => s.clearCompare);
  const openModal = useUi((s) => s.openModal);

  // Map of key → {emoji, title} for chips
  const [chipData, setChipData] = useState<Record<string, Pick<TrackDetail, "emoji" | "title">>>({});

  useEffect(() => {
    // Resolve titles for any keys not yet in chipData
    const missing = compareList.filter((k) => !chipData[k]);
    if (missing.length === 0) return;
    Promise.all(missing.map((k) => dataProvider.getTrackDetail(k).then((d) => ({ k, d })))).then(
      (results) => {
        const next: Record<string, Pick<TrackDetail, "emoji" | "title">> = {};
        for (const { k, d } of results) {
          if (d) next[k] = { emoji: d.emoji, title: d.title };
        }
        setChipData((prev) => ({ ...prev, ...next }));
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareList]);

  if (compareList.length === 0) return null;

  const ready = compareList.length >= 2;

  return (
    <div className="mb-3 bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex items-center gap-2 sticky top-0 z-10">
      <Icon.Scale size={13} className="text-indigo-600 shrink-0" />
      <span className="text-[11px] text-indigo-700 font-semibold shrink-0">已加入对比:</span>

      {/* Chips */}
      <div className="flex items-center gap-1 flex-wrap text-[11px]">
        {compareList.map((k) => {
          const info = chipData[k];
          const label = info ? `${info.emoji} ${info.title}` : k;
          return (
            <span
              key={k}
              className="bg-white border border-indigo-200 rounded-full px-2 py-0.5 flex items-center gap-1 text-[11px]"
            >
              {label}
              <button
                onClick={() => removeCompare(k)}
                className="text-gray-400 hover:text-rose-600 ml-1 leading-none"
                title="移出对比"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <button
          onClick={clearCompare}
          className="text-[11px] text-gray-500 hover:text-rose-600 px-2 py-1 rounded"
        >
          清空
        </button>
        <button
          onClick={() => ready && openModal("compare")}
          disabled={!ready}
          className={
            ready
              ? "text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-bold cursor-pointer"
              : "text-[11px] bg-gray-300 text-white px-3 py-1 rounded font-bold cursor-not-allowed"
          }
        >
          {ready
            ? `查看对比 → (${compareList.length})`
            : `再加 ${2 - compareList.length} 个开始对比`}
        </button>
      </div>
    </div>
  );
}
