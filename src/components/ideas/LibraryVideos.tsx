// 收藏视频 list — PROTO lines ~1328–1394
// guardrail: no direct src/data/* imports; enum→class via toneMaps; icons via @/components/icons.
import { cn } from "@/lib/cn";
import type { LibraryVideo } from "@/types/ideas";
import { smallBadgeToneClass, thumbGradientClass } from "./toneMaps";

interface Props {
  videos: LibraryVideo[];
}

export function LibraryVideos({ videos }: Props) {
  return (
    <div className="space-y-2">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-white border border-gray-200 rounded-xl p-3 hover:border-indigo-300 cursor-pointer transition flex items-center gap-3"
        >
          {/* Thumbnail gradient — enumerated static strings from mock */}
          <div
            className={cn(
              "w-20 h-12 rounded bg-gradient-to-br shrink-0",
              thumbGradientClass[video.gradientTone]
            )}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[12px] font-bold truncate">{video.title}</h4>
            <div className="flex items-center gap-3 text-[10px] text-gray-600 mt-0.5">
              <span className="text-emerald-700 font-bold font-mono">
                {video.outlier} outlier
              </span>
              <span>{video.views} views</span>
              <span>
                {video.creator}
                {video.creatorBadgeText && video.creatorBadgeTone && (
                  <span
                    className={cn(
                      "text-[8px] font-bold rounded px-1 ml-1",
                      smallBadgeToneClass[video.creatorBadgeTone]
                    )}
                  >
                    {video.creatorBadgeText}
                  </span>
                )}
              </span>
              {video.inboxNote && (
                <span className="text-indigo-600">{video.inboxNote}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded font-semibold">
              → 做这条
            </button>
            <button
              className="text-[12px] text-amber-500 hover:text-red-500 w-6 h-6 grid place-items-center"
              title="取消收藏"
            >
              ★
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
