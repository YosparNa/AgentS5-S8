// 来源 PROTO lines 3689–3690 (renderOutput storyboard branch)
// Container-agnostic: takes `shots` prop; no drawer/modal shell.

import { cn } from "@/lib/cn";

interface Shot {
  id: string;
  dur: string;
  desc: string;
  template: string;
  active?: boolean;
}

interface Props {
  shots: Shot[];
}

function borderCls(active: boolean): string {
  return active ? "border-indigo-400" : "border-gray-200";
}

export function StoryboardArtifact({ shots }: Props) {
  return (
    <div className="space-y-2">
      {shots.map((sh, i) => (
        <div
          key={i}
          className={cn(
            "bg-white border rounded-lg p-2 flex items-start gap-2",
            borderCls(!!sh.active)
          )}
        >
          <span className="mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
            {sh.id}
          </span>
          <div className="flex-1">
            <div className="text-[11px]">{sh.desc}</div>
          </div>
          {sh.active && (
            <span className="text-[9px] text-indigo-600 blink shrink-0">▶</span>
          )}
        </div>
      ))}
    </div>
  );
}
