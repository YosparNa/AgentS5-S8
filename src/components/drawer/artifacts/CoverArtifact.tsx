// 来源 PROTO lines 3691–3692 (renderOutput cover branch)
// Container-agnostic: takes `matrix` prop; no drawer/modal shell.

interface MatrixItem {
  type: string;
  title: string;
  cover: string;
}

interface Props {
  matrix: MatrixItem[];
}

export function CoverArtifact({ matrix }: Props) {
  return (
    <div className="space-y-2">
      {matrix.map((m, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-2.5">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
              {m.type}
            </span>
            <button className="text-[10px] text-indigo-600">钦点</button>
          </div>
          <div className="text-[12px] font-semibold">{m.title}</div>
        </div>
      ))}
    </div>
  );
}
