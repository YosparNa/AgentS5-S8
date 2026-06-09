// 来源 PROTO lines 3685–3686 (renderOutput script branch)
import { useState, useRef, useCallback } from "react";
import { useRun } from "@/store/runStore";

interface Props {
  excerpt: string;
  editable?: boolean;
  onEdit?: (text: string) => void;
  wordCount?: number;
}

export function ScriptArtifact({ excerpt, editable = false, onEdit, wordCount }: Props) {
  const editedScript = useRun((s) => s.editedScript);
  const { setEditedScript } = useRun.getState();
  const [isEditing, setIsEditing] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const displayText = editedScript || excerpt;
  const charCount = wordCount ?? displayText.length;

  const handleInput = useCallback(() => {
    if (preRef.current) {
      const val = preRef.current.innerText;
      setEditedScript(val);
      onEdit?.(val);
    }
  }, [setEditedScript, onEdit]);

  return (
    <div className={isEditing ? "bg-white rounded-lg border border-indigo-300 p-3" : "bg-white rounded-lg border border-gray-200 p-3"}>
      {editable && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">{isEditing ? "编辑中..." : "点击编辑脚本内容"}</span>
            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded">{charCount} 字</span>
          </div>
          <button
            onClick={() => setIsEditing(prev => !prev)}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded"
          >
            {isEditing ? "完成编辑" : "编辑"}
          </button>
        </div>
      )}
      <pre
        ref={preRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={isEditing ? handleInput : undefined}
        className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans outline-none"
        style={isEditing ? { cursor: "text", minHeight: "100px" } : undefined}
      >
        {displayText}
      </pre>
    </div>
  );
}
