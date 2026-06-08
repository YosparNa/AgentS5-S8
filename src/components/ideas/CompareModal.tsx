// CompareModal — Task E3.
// 赛道对比 Modal (store-driven). Reproduces PROTO 2018-2033 + showCompareModal 2157-2196.
// Requires >= 2 tracks in compareList to display.
import { useState, useEffect } from "react";
import { useUi } from "@/store/uiStore";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { TrackDetail } from "@/types/ideas";
import { verdictToneClass, windowToneClass } from "./toneMaps";

export function CompareModal() {
  const activeModal = useUi((s) => s.activeModal);
  const compareList = useUi((s) => s.compareList);
  const closeModal = useUi((s) => s.closeModal);
  const removeCompare = useUi((s) => s.removeCompare);

  const [cards, setCards] = useState<TrackDetail[]>([]);

  const open = activeModal === "compare" && compareList.length >= 2;

  useEffect(() => {
    if (open) {
      Promise.all(compareList.map((k) => dataProvider.getTrackDetail(k))).then((ds) => {
        setCards(ds.filter((d): d is TrackDetail => d !== undefined));
      });
    }
  }, [open, compareList]);

  if (!open) return null;

  const colCount = cards.length;

  return (
    <div
      className={cn("modal-mask", open && "show")}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="bg-white rounded-2xl w-[1080px] max-w-[92vw] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header (PROTO 2021-2023) */}
        <div className="border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Icon.Scale size={14} className="text-indigo-600" />
            <h3 className="text-[15px] font-bold">
              赛道对比 · <span>{compareList.length}</span> 个赛道
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="w-7 h-7 grid place-items-center text-gray-400 hover:bg-gray-100 rounded"
          >
            <Icon.Close size={14} />
          </button>
        </div>

        {/* Body — comparison grid (PROTO showCompareModal 2164-2194) */}
        <div className="flex-1 overflow-auto p-5">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `110px repeat(${colCount}, 1fr)` }}
          >
            {/* Header row */}
            <div />
            {cards.map((d) => (
              <div key={d.key} className="bg-indigo-50 rounded-lg p-3 border border-indigo-200 relative">
                {/* Remove button */}
                <button
                  onClick={() => removeCompare(d.key)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 grid place-items-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded text-[11px]"
                  title="移出对比"
                >
                  ×
                </button>
                <div className="text-[20px] mb-1">{d.emoji}</div>
                <div className="text-[13px] font-bold leading-tight mb-1 pr-5">{d.title}</div>
                <span
                  className={cn(
                    "text-[10px] font-bold rounded px-1.5 py-0.5 border",
                    verdictToneClass[d.verdictTone]
                  )}
                >
                  {d.verdict}
                </span>
              </div>
            ))}

            {/* RPM row */}
            <div className="text-[11px] font-bold text-gray-700 px-2 py-3 flex items-center">
              RPM (美区)
            </div>
            {cards.map((d) => (
              <div key={d.key} className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="text-[18px] font-black font-mono text-emerald-700">{d.rpm}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{d.rpmNote || "广告收入 / 千次播放"}</div>
              </div>
            ))}

            {/* 活跃博主 row */}
            <div className="text-[11px] font-bold text-gray-700 px-2 py-3 flex items-center">
              活跃博主
            </div>
            {cards.map((d) => (
              <div key={d.key} className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="text-[18px] font-black font-mono">{d.creators}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">近 30d 有更新</div>
              </div>
            ))}

            {/* 月均供给 row */}
            <div className="text-[11px] font-bold text-gray-700 px-2 py-3 flex items-center">
              月均供给
            </div>
            {cards.map((d) => (
              <div key={d.key} className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="text-[18px] font-black font-mono">{d.supply}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">新视频/月</div>
              </div>
            ))}

            {/* 起号窗口 row */}
            <div className="text-[11px] font-bold text-gray-700 px-2 py-3 flex items-center">
              起号窗口
            </div>
            {cards.map((d) => (
              <div key={d.key} className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className={cn("text-[18px] font-black font-mono", windowToneClass[d.windowTone])}>
                  {d.window}
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">头部稀疏度</div>
              </div>
            ))}

            {/* 画像 / 赚钱逻辑 row */}
            <div className="text-[11px] font-bold text-gray-700 px-2 py-3 flex items-start pt-3">
              画像 / 赚钱逻辑
            </div>
            {cards.map((d) => (
              <div key={d.key} className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="text-[11px] text-gray-700 leading-relaxed">{d.tag}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer (PROTO 2028-2031) */}
        <div className="border-t border-gray-200 px-5 py-3 flex items-center justify-between shrink-0 bg-gray-50">
          <div className="text-[10px] text-gray-500">数据基于近 30d 全网快照 · snapshot 14d ●●○</div>
          <button
            onClick={closeModal}
            className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-semibold"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
