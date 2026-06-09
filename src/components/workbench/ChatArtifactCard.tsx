// ChatArtifactCard.tsx — 一阶段一卡 artifact file card.
// Shown in AgentStream when a node transitions to "done".
import { artifactFileMeta } from "@/lib/artifactFileMeta";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { useUi } from "@/store/uiStore";
import { useRun } from "@/store/runStore";

interface Props {
  stageId: string;
}

const S5S8 = new Set(["s5", "s6", "s7", "s8"]);

export function ChatArtifactCard({ stageId }: Props) {
  const stage = useRun((s) => s.stages[stageId]);
  const producedAt = useRun((s) => s.run.nodes[stageId]?.producedAt);
  const openFile = useUi((s) => s.openFile);
  const setExpandedStudioCard = useUi((s) => s.setExpandedStudioCard);

  if (!stage) return null;

  const files = artifactFileMeta(stage, { stageId, nodeId: stageId, updatedAt: producedAt });
  if (files.length === 0) return null;

  function handleClick() {
    if (S5S8.has(stageId)) {
      setExpandedStudioCard(stageId);
    } else {
      openFile(stageId);
    }
  }

  return (
    <div
      className="max-w-[95%] cursor-pointer border border-gray-200 hover:border-indigo-300 rounded-xl overflow-hidden bg-white shadow-sm transition-colors"
      onClick={handleClick}
    >
      {/* Card header */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Icon.CircleCheck size={11} className="text-emerald-500 shrink-0" />
        <span className="text-[10px] font-bold mono text-gray-700">
          {stage.code} · {stage.title}
        </span>
        <span className="text-[9px] text-gray-400 ml-auto">产物</span>
      </div>

      {/* File rows */}
      <div className="px-3 py-2 space-y-1.5">
        {files.map((file) => {
          const iconKey = file.icon as IconName;
          const FileIcon = Icon[iconKey] ?? Icon.FileText;
          return (
            <div key={file.fileName} className="flex items-center gap-2">
              <FileIcon size={12} className="text-indigo-400 shrink-0" />
              <span className="text-[11px] mono text-gray-800 flex-1 truncate">{file.fileName}</span>
              <span className="text-[10px] text-gray-400 shrink-0">{file.meta}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
