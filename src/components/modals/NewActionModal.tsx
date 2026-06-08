// NewActionModal — Task F4.
// Opens when activeModal === 'newAction'. Lets user choose what to create next.
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function NewActionModal() {
  const activeModal = useUi((s) => s.activeModal);
  const closeModal = useUi((s) => s.closeModal);
  const openModal = useUi((s) => s.openModal);

  const open = activeModal === "newAction";
  if (!open) return null;

  return (
    <div
      className={cn("modal-mask", "show")}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl max-w-lg w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between">
          <h2 className="text-lg font-black">新建什么？</h2>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center"
          >
            <Icon.Close size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-2">
          {/* 新建频道 L2 */}
          <button
            onClick={() => { closeModal(); openModal("newChannel"); }}
            className="w-full border border-gray-200 rounded-lg p-3 hover:border-sky-400 text-left flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 grid place-items-center">
              <Icon.Broadcast size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold">新建频道 L2</div>
            </div>
          </button>
          {/* 新建视频任务 L3 */}
          <button
            onClick={() => { closeModal(); openModal("newMission"); }}
            className="w-full border border-gray-200 rounded-lg p-3 hover:border-indigo-400 text-left flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 grid place-items-center">
              <Icon.Clapperboard size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold">新建视频任务 L3</div>
            </div>
          </button>
          {/* 添加中央规则 L1 */}
          <button
            onClick={() => { closeModal(); }}
            className="w-full border border-gray-200 rounded-lg p-3 hover:border-purple-400 text-left flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 grid place-items-center">
              <Icon.Brain size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold">添加中央规则 L1</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
