// 关注博主 list — PROTO lines ~1213–1322
// guardrail: no direct src/data/* imports; enum→class via toneMaps; icons via @/components/icons.
import { cn } from "@/lib/cn";
import type { LibraryCreator } from "@/types/ideas";
import { smallBadgeToneClass, avatarGradientClass } from "./toneMaps";

interface Props {
  creators: LibraryCreator[];
}

export function LibraryCreators({ creators }: Props) {
  return (
    <div className="space-y-2">
      {creators.map((creator) => (
        <div
          key={creator.id}
          className="bg-white border border-gray-200 rounded-xl p-3 hover:border-indigo-300 cursor-pointer transition flex items-center gap-3"
        >
          {/* Avatar: gradient initials — gradientTone enum → class via avatarGradientClass */}
          <div
            className={cn(
              "w-10 h-10 rounded-full bg-gradient-to-br grid place-items-center text-white font-black text-[12px] shrink-0",
              avatarGradientClass[creator.gradientTone]
            )}
          >
            {creator.initials}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-[13px] font-bold">{creator.handle}</h4>
              {creator.badgeText && creator.badgeTone && (
                <span
                  className={cn(
                    "text-[10px] font-bold rounded px-1.5 py-0.5",
                    smallBadgeToneClass[creator.badgeTone]
                  )}
                >
                  {creator.badgeText}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-600">
              <span>{creator.subs} 订阅</span>
              <span className="text-gray-300">|</span>
              <span>{creator.statLine}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">
                {creator.trackEmoji} {creator.trackName}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {creator.newCount ? (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 font-semibold">
                新发 {creator.newCount} 条
              </span>
            ) : (
              <span className="text-[10px] text-gray-500">无新发</span>
            )}
            <button className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold">
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
