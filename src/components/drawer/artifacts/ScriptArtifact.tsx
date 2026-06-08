// 来源 PROTO lines 3685–3686 (renderOutput script branch)
// Container-agnostic: takes `excerpt` prop; no drawer/modal shell.

interface Props {
  excerpt: string;
}

export function ScriptArtifact({ excerpt }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans">
        {excerpt}
      </pre>
    </div>
  );
}
