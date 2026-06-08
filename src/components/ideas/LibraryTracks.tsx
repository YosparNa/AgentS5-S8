// 已关注赛道 list — PROTO lines ~1137–1210
// guardrail: no direct src/data/* imports; enum→class via toneMaps; icons via @/components/icons.
import { useUi } from "@/store/uiStore";
import { cn } from "@/lib/cn";
import type { LibraryTrack } from "@/types/ideas";
import { alertToneClass } from "./toneMaps";

interface Props {
  tracks: LibraryTrack[];
}

export function LibraryTracks({ tracks }: Props) {
  const { openTrackDrawer, setIdeasMode } = useUi();

  return (
    <div className="space-y-2">
      {tracks.map((track) => (
        <div
          key={track.key}
          className="bg-white border border-gray-200 rounded-xl p-3.5 hover:border-indigo-300 cursor-pointer transition flex items-center gap-3"
        >
          {/* Emoji */}
          <div className="text-[18px] shrink-0">{track.emoji}</div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-[14px] font-bold">{track.title}</h4>
              {track.alertText && track.alertTone && (
                <span
                  className={cn(
                    "text-[10px] font-bold rounded px-1.5 py-0.5",
                    alertToneClass[track.alertTone]
                  )}
                >
                  {track.alertText}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-[11px] text-gray-600">
              <span>
                <b className="text-emerald-700 font-mono">{track.rpm}</b> RPM
              </span>
              <span className="text-gray-300">|</span>
              <span>
                7d 爆款 <b className="text-orange-700 font-mono">{track.hot}</b>
              </span>
              <span className="text-gray-300">|</span>
              <span>
                拐点 <b className="text-fuchsia-700 font-mono">{track.turning}</b>
              </span>
              <span className="text-gray-300">|</span>
              {track.channelName ? (
                <span className="text-gray-500">
                  已对接 <b>{track.channelName}</b> · 库内{" "}
                  {track.inboxCount ?? 0} 条
                </span>
              ) : track.watchDays ? (
                <span className="text-gray-500">
                  未对接 · 观察期 {track.watchDays}d
                </span>
              ) : (
                <span className="text-amber-700">未对接频道</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {track.channelName ? (
              <button
                onClick={() => setIdeasMode("inbox")}
                className="text-[11px] text-indigo-600 hover:underline font-semibold"
              >
                看收件箱 →
              </button>
            ) : (
              <button className="text-[11px] text-gray-500 hover:text-indigo-600 font-semibold">
                + 建频道
              </button>
            )}
            <button
              onClick={() => openTrackDrawer(track.key)}
              className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold"
            >
              详情
            </button>
            <button
              className="text-[12px] text-amber-500 hover:text-red-500 w-6 h-6 grid place-items-center"
              title="取消关注"
            >
              ★
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
