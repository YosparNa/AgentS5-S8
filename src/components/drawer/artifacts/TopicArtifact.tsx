// 来源 PROTO lines 3678–3679 (renderOutput topic branch)
// Container-agnostic: takes `topics` prop; no drawer/modal shell.

import { cn } from "@/lib/cn";

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

// Score color helper — full static strings (no dynamic concatenation)
function scoreCls(score: number): string {
  if (score >= 8) return "text-emerald-600";
  return "text-gray-500";
}

function borderCls(locked: boolean): string {
  return locked
    ? "border-indigo-400 ring-2 ring-indigo-100"
    : "border-gray-200";
}

export function TopicArtifact({ topics }: Props) {
  return (
    <div className="space-y-2">
      {topics.map((t) => (
        <div
          key={t.rank}
          className={cn("bg-white border rounded-lg p-3", borderCls(!!t.locked))}
        >
          <div className="flex justify-between mb-1">
            <span className="mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
              #{t.rank}
            </span>
            <span className={cn("text-[11px] mono font-bold", scoreCls(t.score))}>
              {t.score}
            </span>
          </div>
          <div className="text-[12px] font-semibold">{t.title}</div>
          {t.unique && (
            <div className="mt-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded p-1.5">
              <b>独特视角：</b>{t.unique}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
