// RadarRankingCard — reproduces PROTO radarRankingCard (2365–2382) for isNew=true
// and static ranking cards (718–747) for isNew=false.
// E3 will add compare toggle — stub call kept as comment.
import { useEffect, useRef, useState } from "react";
import type { TrackRanking } from "@/types/ideas";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { scoreColor } from "@/lib/radar";
import { verdictToneClass, badgeToneClass } from "./toneMaps";
import { cn } from "@/lib/cn";

interface Props {
  track: TrackRanking;
  isNew?: boolean;
}

export function RadarRankingCard({ track, isNew }: Props) {
  const { openTrackDrawer } = useUi();
  const [followed, setFollowed] = useState(false);
  // For newly-sunk cards: highlight ring fades after 2.6 s
  const [highlighted, setHighlighted] = useState(!!isNew);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isNew) {
      setHighlighted(true);
      timerRef.current = setTimeout(() => setHighlighted(false), 2600);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isNew]);

  const wrapperCls = isNew
    ? cn(
        "bg-white rounded-xl p-4 hover:shadow-md cursor-pointer transition border",
        highlighted
          ? "border-emerald-300 ring-2 ring-emerald-200"
          : "border-gray-200"
      )
    : "bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md cursor-pointer transition";

  return (
    <div className={wrapperCls}>
      <div className="flex items-center gap-4">

        {/* rank / NEW indicator */}
        {isNew ? (
          <div className="text-[11px] font-black text-emerald-600 font-mono w-8 text-center shrink-0">
            NEW
          </div>
        ) : (
          <div className="text-[20px] font-black text-gray-300 font-mono w-8 text-center shrink-0">
            #{track.rank}
          </div>
        )}

        {/* main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[15px] font-bold">
              {track.emoji} {track.title}
            </h4>
            {/* verdict pill */}
            <span
              className={cn(
                "border text-[10px] font-bold rounded px-1.5 py-0.5",
                verdictToneClass[track.verdictTone]
              )}
            >
              {track.verdict}
            </span>
            {/* "刚加入监控" pill for newly-sunk */}
            {isNew && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded px-1.5 py-0.5">
                刚加入监控
              </span>
            )}
            {/* optional window badge */}
            {track.windowBadge && (
              <span
                className={cn(
                  "text-[10px] font-semibold rounded px-1.5 py-0.5",
                  badgeToneClass[track.windowBadge.tone]
                )}
              >
                {track.windowBadge.text}
              </span>
            )}
            {/* optional extra badge */}
            {track.badge && (
              <span
                className={cn(
                  "text-[10px] font-semibold rounded px-1.5 py-0.5",
                  badgeToneClass[track.badge.tone]
                )}
              >
                {track.badge.text}
              </span>
            )}
          </div>

          {/* metrics row — PROTO radarMetricsRow */}
          <div className="flex items-center gap-5 text-[11px] text-gray-600">
            <span>
              <b className="text-emerald-700 font-mono">{track.rpm}</b> RPM
            </span>
            <span className="text-gray-300">|</span>
            <span>
              7d 爆款 <b className="text-orange-700 font-mono">{track.hot}</b>
            </span>
            <span className="text-gray-300">|</span>
            <span>
              拐点博主 <b className="text-fuchsia-700 font-mono">{track.turning}</b>
            </span>
            <span className="text-gray-300">|</span>
            <span>
              活跃博主 <b className="font-mono">{track.active}</b>
            </span>
          </div>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 关注 button — local follow toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFollowed((f) => !f);
            }}
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
          {/* 详情 button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openTrackDrawer(track.key);
            }}
            className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-semibold"
          >
            详情 →
          </button>
        </div>

        {/* score */}
        <div className="text-right shrink-0 ml-3">
          <div
            className={cn(
              "text-[22px] font-black font-mono leading-none",
              scoreColor(track.score)
            )}
          >
            {track.score.toFixed(1)}
          </div>
          <div className="text-[9px] text-gray-400 mt-0.5">综合分</div>
        </div>

      </div>
    </div>
  );
}
