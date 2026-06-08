// NewMissionModal — Task F4.
// Opens when activeModal === 'newMission'. Form to create a new video mission (L3).
import { useNavigate } from "react-router-dom";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function NewMissionModal() {
  const activeModal = useUi((s) => s.activeModal);
  const closeModal = useUi((s) => s.closeModal);
  const navigate = useNavigate();

  const open = activeModal === "newMission";
  if (!open) return null;

  return (
    <div
      className={cn("modal-mask", "show")}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between">
          <h2 className="text-lg font-black">新建视频任务</h2>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center"
          >
            <Icon.Close size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-3">
          <select className="w-full text-[13px] border border-gray-200 rounded-lg p-2.5">
            <option>📺 AI 工具频道</option>
            <option>🌸 小红书种草号</option>
            <option>📝 X 长推号</option>
          </select>
          <textarea
            className="w-full text-[13px] border border-gray-200 rounded-lg p-2.5 resize-none"
            rows={3}
            placeholder="视频目标"
          />
          <div className="bg-indigo-50 border border-indigo-200 rounded p-3 text-[11px] text-indigo-900">
            <b>自动继承：</b>本频道 L2 定位 / 对标 / 禁区 / 热点 · <b>自动调用：</b>L1 中央规则 12 条
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="text-[12px] border border-gray-200 px-3 py-1.5 rounded"
            >
              取消
            </button>
            <button
              onClick={() => { closeModal(); navigate("/workbench"); }}
              className="bg-indigo-600 text-white text-[12px] px-3 py-1.5 rounded"
            >
              创建并进入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
