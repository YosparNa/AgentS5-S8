// 来源 PROTO lines 3680–3684 (renderOutput outline branch)
import { useState } from "react";
import { cn } from "@/lib/cn";

interface OutlineChapter {
  ch: string;
  dur: string;
  tension: number;
  hook?: string;
  crisis?: boolean;
  description?: string;
  purpose?: string;
}

interface Props {
  outline: OutlineChapter[];
}

export function OutlineArtifact({ outline }: Props) {
  const len = outline.length;
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const points = outline
    .map((c, i) => `${i * (400 / (len - 1))},${60 - c.tension * 5}`)
    .join(" ");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* Tension SVG */}
      <svg viewBox="0 0 400 60" className="w-full h-16 mb-2">
        <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={points} />
        {outline.map((c, i) => (
          <circle key={i} cx={i * (400 / (len - 1))} cy={60 - c.tension * 5} r="3"
            fill={c.crisis ? "#dc2626" : "#4f46e5"} />
        ))}
      </svg>

      {/* Chapter rows */}
      {outline.map((c, i) => (
        <div key={i} className="border-b border-gray-100 last:border-0">
          <div
            className="flex items-center gap-2 p-2 text-[11px] cursor-pointer hover:bg-gray-50 rounded"
            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
          >
            <span className="mono text-[9px] text-gray-400 w-12 shrink-0">{c.dur}</span>
            <span className="flex-1 font-medium">{c.ch}</span>
            <span className={cn("text-[10px] mono font-bold", c.tension >= 8 ? "text-red-500" : c.tension >= 6 ? "text-amber-500" : "text-gray-400")}>
              {c.tension}
            </span>
            {c.crisis && <span className="text-[9px] bg-red-50 text-red-600 px-1 rounded font-bold">危机点</span>}
          </div>
          {expandedIdx === i && (
            <div className="px-2 pb-2 ml-14 space-y-1">
              {c.hook && <div className="text-[10px] text-amber-600"><b>钩子：</b>{c.hook}</div>}
              {c.description && <div className="text-[10px] text-gray-600">{c.description}</div>}
              {c.purpose && <div className="text-[10px] text-indigo-600"><b>目的：</b>{c.purpose}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
