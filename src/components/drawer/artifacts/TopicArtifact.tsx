// 来源 PROTO lines 3678–3679 (renderOutput topic branch)
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useRun } from "@/store/runStore";

interface Topic {
  rank: number;
  title: string;
  angle?: string;
  score: number;
  scores?: Record<string, number>;
  unique?: string;
  keywords?: string[];
  hook_idea?: string;
  competitors_covered?: string[];
  predicted_views?: string;
  risk_notes?: string[] | string;
  locked?: boolean;
}

interface Props {
  topics: Topic[];
}

const SCORE_LABELS: Record<string, string> = {
  hotness: "热度",
  relevance: "相关度",
  videoability: "可视频化",
  differentiation: "差异化",
  risk: "风险",
  opportunity: "机会",
};

function scoreCls(score: number): string {
  if (score >= 8) return "text-emerald-600";
  return "text-gray-500";
}

export function TopicArtifact({ topics }: Props) {
  const selectedIdx = useRun((s) => s.selectedTopicIdx);
  const lockedIdx = useRun((s) => s.lockedTopicIdx);
  const { selectTopic } = useRun.getState();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {topics.map((t, i) => {
        const isSelected = selectedIdx === i;
        const isLocked = lockedIdx === i;
        const isExpanded = expandedIdx === i;
        return (
          <div
            key={t.rank}
            className={cn(
              "bg-white border-2 rounded-lg p-3 hover:border-indigo-300 transition relative",
              isLocked ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100 shadow-md cursor-default"
                : isSelected ? "border-emerald-400 ring-2 ring-emerald-100 cursor-pointer"
                : "border-gray-200 cursor-pointer"
            )}
            onClick={() => {
              if (!isLocked) selectTopic(i);
              setExpandedIdx(isExpanded ? null : i);
            }}
          >
            {isLocked && (
              <div className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow">🔒</div>
            )}
            <div className="flex justify-between mb-1">
              <span className={cn("mono text-[10px] px-1.5 py-0.5 rounded", isLocked ? "bg-indigo-100 text-indigo-700" : "bg-gray-100")}>#{t.rank}</span>
              <span className={cn("text-[11px] mono font-bold", scoreCls(t.score))}>{t.score}</span>
            </div>
            <div className="text-[12px] font-semibold">{t.title}</div>
            {t.angle && (
              <div className="mt-1 text-[10px] text-gray-600">{t.angle}</div>
            )}

            {/* 展开详情 */}
            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                {/* 六维评分 */}
                {t.scores && Object.keys(t.scores).length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 mb-1">六维评分</div>
                    <div className="grid grid-cols-3 gap-1">
                      {Object.entries(t.scores).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1 text-[10px]">
                          <span className="text-gray-500">{SCORE_LABELS[k] ?? k}</span>
                          <span className={cn("font-bold", v >= 8 ? "text-emerald-600" : v >= 6 ? "text-amber-600" : "text-red-500")}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {t.unique && (
                  <div className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded p-1.5"><b>独特视角：</b>{t.unique}</div>
                )}

                {t.hook_idea && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-1.5"><b>开头钩子：</b>{t.hook_idea}</div>
                )}

                {t.keywords && t.keywords.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 mb-0.5">关键词</div>
                    <div className="flex flex-wrap gap-1">
                      {t.keywords.map((kw, j) => (
                        <span key={j} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {t.predicted_views && (
                  <div className="text-[10px] text-gray-600"><b>预估播放：</b>{t.predicted_views}</div>
                )}

                {t.competitors_covered && t.competitors_covered.length > 0 && (
                  <div className="text-[10px] text-gray-600"><b>竞品覆盖：</b>{t.competitors_covered.join("、")}</div>
                )}

                {t.risk_notes && (
                  <div className="text-[10px] text-red-600">
                    <b>风险提示：</b>
                    {Array.isArray(t.risk_notes) ? t.risk_notes.join("；") : t.risk_notes}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
