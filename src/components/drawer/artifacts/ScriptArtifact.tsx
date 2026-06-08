// 来源 PROTO lines 3685–3686 (renderOutput script branch)
import { useState } from "react";
import { useRun } from "@/store/runStore";

interface Props {
  excerpt: string;
  editable?: boolean;
  onEdit?: (text: string) => void;
}

export function ScriptArtifact({ excerpt, editable = false, onEdit }: Props) {
  const editedScript = useRun((s) => s.editedScript);
  const { setEditedScript } = useRun.getState();
  const [isEditing, setIsEditing] = useState(false);

  const displayText = editedScript || excerpt;

  if (editable && isEditing) {
    return (
      <div className="bg-white rounded-lg border border-indigo-300 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-indigo-700">编辑脚本</span>
          <button
            onClick={() => setIsEditing(false)}
            className="text-[10px] text-gray-500 hover:text-gray-700"
          >
            完成编辑
          </button>
        </div>
        <textarea
          className="w-full text-[12px] leading-relaxed font-sans border border-gray-200 rounded p-2 resize-y min-h-[200px] outline-none focus:border-indigo-400"
          value={displayText}
          onChange={(e) => {
            const val = e.target.value;
            setEditedScript(val);
            onEdit?.(val);
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {editable && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-400">点击编辑脚本内容</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded"
          >
            编辑
          </button>
        </div>
      )}
      <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans">
        {displayText}
      </pre>
    </div>
  );
}
