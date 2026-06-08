// 来源 PROTO lines 3680–3684 (renderOutput outline branch)
// Container-agnostic: takes `outline` prop; no drawer/modal shell.
// Includes the SVG tension polyline (PROTO formula).

interface OutlineChapter {
  ch: string;
  dur: string;
  tension: number;
  hook?: string;
  crisis?: boolean;
}

interface Props {
  outline: OutlineChapter[];
}

export function OutlineArtifact({ outline }: Props) {
  const len = outline.length;
  // PROTO formula: x = i*(400/(len-1)), y = 60 - tension*5
  const points = outline
    .map((c, i) => `${i * (400 / (len - 1))},${60 - c.tension * 5}`)
    .join(" ");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* Tension SVG polyline */}
      <svg viewBox="0 0 400 60" className="w-full h-16 mb-2">
        <polyline
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2"
          points={points}
        />
        {outline.map((c, i) => (
          <circle
            key={i}
            cx={i * (400 / (len - 1))}
            cy={60 - c.tension * 5}
            r="3"
            fill={c.crisis ? "#dc2626" : "#4f46e5"}
          />
        ))}
      </svg>

      {/* Chapter rows */}
      {outline.map((c, i) => (
        <div key={i} className="flex items-center gap-2 p-1.5 text-[11px]">
          <span className="mono text-[9px] text-gray-400 w-12">{c.dur}</span>
          <span className="flex-1 font-medium">{c.ch}</span>
          {c.crisis && (
            <span className="text-[9px] bg-red-50 text-red-600 px-1 rounded font-bold">
              危机点
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
