// RadarResultCard — reproduces PROTO radarResultCard (2340–2363).
// Props: cluster, onSink callback, sunk flag.
import { useState } from "react";
import type { RadarCluster } from "@/types/ideas";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { scoreColor } from "@/lib/radar";
import { verdictToneClass, badgeToneClass } from "./toneMaps";
import { cn } from "@/lib/cn";

interface Props {
  cluster: RadarCluster;
  onSink: (key: string) => void;
  sunk: boolean;
}

export function RadarResultCard({ cluster: c, onSink, sunk }: Props) {
  const { openTrackDrawer } = useUi();
  const [followed, setFollowed] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition">
      <div className="flex items-center gap-4">

        {/* left badge: already-pooled vs new discovery */}
        <div className="w-12 text-center shrink-0">
          {c.pooled ? (
            <>
              <div className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded px-1 py-0.5">
                已在池
              </div>
              {c.rank != null && (
                <div className="text-[12px] font-black text-gray-400 font-mono mt-1">
                  #{c.rank}
                </div>
              )}
            </>
          ) : (
            <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5">
              新发现
            </div>
          )}
        </div>

        {/* main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[15px] font-bold">
              {c.emoji} {c.title}
            </h4>
            {/* verdict pill */}
            <span
              className={cn(
                "border text-[10px] font-bold rounded px-1.5 py-0.5",
                verdictToneClass[c.verdictTone]
              )}
            >
              {c.verdict}
            </span>
            {/* optional badge */}
            {c.badge && (
              <span
                className={cn(
                  "text-[10px] font-semibold rounded px-1.5 py-0.5",
                  badgeToneClass[c.badge.tone]
                )}
              >
                {c.badge.text}
              </span>
            )}
          </div>

          {/* metrics row */}
          <div className="flex items-center gap-5 text-[11px] text-gray-600">
            <span>
              <b className="text-emerald-700 font-mono">{c.rpm}</b> RPM
            </span>
            <span className="text-gray-300">|</span>
            <span>
              7d 爆款 <b className="text-orange-700 font-mono">{c.hot}</b>
            </span>
            <span className="text-gray-300">|</span>
            <span>
              拐点博主 <b className="text-fuchsia-700 font-mono">{c.turning}</b>
            </span>
            <span className="text-gray-300">|</span>
            <span>
              活跃博主 <b className="font-mono">{c.active}</b>
            </span>
          </div>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 关注 toggle */}
          <button
            onClick={() => setFollowed((f) => !f)}
            className={cn(
              "text-[11px] text-amber-700 px-2.5 py-1 rounded font-semibold flex items-center gap-0.5",
              followed
                ? "bg-amber-200 hover:bg-amber-300"
                : "bg-amber-50 hover:bg-amber-100"
            )}
          >
            {followed ? (
              <Icon.Bookmark className="w-[10px] h-[10px] fill-amber-700" />
            ) : (
              <Icon.Bookmark className="w-[10px] h-[10px]" />
            )}
            关注
          </button>

          {/* sink / locate button */}
          {c.pooled ? (
            /* pooled → 定位排行榜 (decorative / no-op) */
            <button className="text-[11px] bg-sky-50 hover:bg-sky-100 text-sky-700 px-2.5 py-1 rounded font-semibold">
              定位排行榜
            </button>
          ) : sunk ? (
            /* already sunk → disabled */
            <button
              disabled
              className="text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded font-semibold cursor-default flex items-center gap-0.5"
            >
              <Icon.Check className="w-[10px] h-[10px]" />
              已入池
            </button>
          ) : (
            /* not pooled → sink button */
            <button
              onClick={() => onSink(c.key)}
              className="text-[11px] bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-2.5 py-1 rounded font-semibold flex items-center gap-0.5"
            >
              <Icon.Download className="w-[10px] h-[10px]" />
              沉淀进监控池
            </button>
          )}

          {/* 详情 */}
          <button
            onClick={() => openTrackDrawer(c.key)}
            className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-semibold"
          >
            详情 →
          </button>
        </div>

        {/* score */}
        <div className="text-right shrink-0 ml-2">
          <div
            className={cn(
              "text-[22px] font-black font-mono leading-none",
              scoreColor(c.score)
            )}
          >
            {c.score.toFixed(1)}
          </div>
          <div className="text-[9px] text-gray-400 mt-0.5">综合分</div>
        </div>

      </div>
    </div>
  );
}
