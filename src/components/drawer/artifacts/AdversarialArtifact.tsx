// 来源 PROTO lines 3687–3688 (renderOutput adversarial branch)
// Container-agnostic: takes `roles` prop; no drawer/modal shell.

interface Role {
  avatar: string;
  name: string;
  issues: number;
  note: string;
}

interface Props {
  roles: Role[];
}

export function AdversarialArtifact({ roles }: Props) {
  return (
    <div className="space-y-2">
      {roles.map((r, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-3"
        >
          <div className="text-2xl">{r.avatar}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold">{r.name}</span>
              <span className="text-[10px] mono bg-gray-100 px-1.5 rounded">
                {r.issues} 条
              </span>
            </div>
            <div className="text-[10px] text-gray-600">{r.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
