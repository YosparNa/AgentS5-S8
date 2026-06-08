// 来源 PROTO lines 3678–3679 (renderOutput topic branch)
import { cn } from "@/lib/cn";
import { useRun } from "@/store/runStore";

interface Topic {
  rank: number;
  title: string;
  score: number;
  locked?: boolean;
  unique?: string;
}

interface Props {
  topics: Topic[];
}

function scoreCls(score: number): string {
  if (score >= 8) return "text-emerald-600";
  return "text-gray-500";
}

export function TopicArtifact({ topics }: Props) {
  const selectedIdx = useRun((s) => s.selectedTopicIdx);
  const lockedIdx = useRun((s) => s.lockedTopicIdx);
  const { selectTopic } = useRun.getState();

  return (
    <div className="space-y-2">
      {topics.map((t, i) => {
        const isSelected = selectedIdx === i;
        const isLocked = lockedIdx === i;
        return (
          <div
            key={t.rank}
            className={cn(
              "bg-white border-2 rounded-lg p-3 hover:border-indigo-300 transition relative",
              isLocked ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100 shadow-md cursor-default"
                : isSelected ? "border-emerald-400 ring-2 ring-emerald-100 cursor-pointer"
                : "border-gray-200 cursor-pointer"
            )}
            onClick={() => { if (!isLocked) selectTopic(i); }}
          >
            {isLocked && (
              <div className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow">🔒</div>
            )}
            <div className="flex justify-between mb-1">
              <span className={cn("mono text-[10px] px-1.5 py-0.5 rounded", isLocked ? "bg-indigo-100 text-indigo-700" : "bg-gray-100")}>#{t.rank}</span>
              <span className={cn("text-[11px] mono font-bold", scoreCls(t.score))}>{t.score}</span>
            </div>
            <div className="text-[12px] font-semibold">{t.title}</div>
            {t.unique && (
              <div className="mt-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded p-1.5"><b>独特视角：</b>{t.unique}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
