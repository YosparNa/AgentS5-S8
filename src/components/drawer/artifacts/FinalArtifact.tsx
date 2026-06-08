// 来源 PROTO lines 3693–3694 (renderOutput final branch)
// Container-agnostic: takes `checklist` prop; no drawer/modal shell.

interface Props {
  checklist: string[];
}

export function FinalArtifact({ checklist }: Props) {
  return (
    <div className="space-y-1.5">
      {checklist.map((item, i) => (
        <label
          key={i}
          className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
        >
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-indigo-600"
          />
          <span className="text-[12px]">{item}</span>
        </label>
      ))}
    </div>
  );
}
