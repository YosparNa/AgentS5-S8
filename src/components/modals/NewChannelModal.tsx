// NewChannelModal — Task F4.
// Opens when activeModal === 'newChannel'. Form to create a new channel (L2).
import { useNavigate } from "react-router-dom";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function NewChannelModal() {
  const activeModal = useUi((s) => s.activeModal);
  const closeModal = useUi((s) => s.closeModal);
  const navigate = useNavigate();

  const open = activeModal === "newChannel";
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
          <h2 className="text-lg font-black">新建频道</h2>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center"
          >
            <Icon.Close size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-3">
          <input
            className="w-full text-[13px] border border-gray-200 rounded-lg p-2.5"
            placeholder="频道名（如：AI 副业实操）"
          />
          <div className="bg-sky-50 border border-sky-200 rounded p-3 text-[11px] text-sky-900">
            <Icon.Info size={11} className="inline mr-1" />
            创建后自动跑 S1 赛道 → S2 对标 → S3 定位（需审①）→ S4 启动定时热点。
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="text-[12px] border border-gray-200 px-3 py-1.5 rounded"
            >
              取消
            </button>
            <button
              onClick={() => { closeModal(); navigate("/channel/new"); }}
              className="bg-indigo-600 text-white text-[12px] px-3 py-1.5 rounded"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
