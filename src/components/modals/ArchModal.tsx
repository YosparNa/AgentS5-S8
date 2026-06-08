// ArchModal — Task F4.
// Opens when activeModal === 'arch'. Shows the 3-layer Agent architecture overview.
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function ArchModal() {
  const activeModal = useUi((s) => s.activeModal);
  const closeModal = useUi((s) => s.closeModal);

  const open = activeModal === "arch";
  if (!open) return null;

  return (
    <div
      className={cn("modal-mask", "show")}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl max-w-3xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between">
          <h2 className="text-lg font-black">三层 Agent 架构</h2>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center"
          >
            <Icon.Close size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 grid grid-cols-3 gap-3">
          {/* L1 */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="w-9 h-9 bg-purple-600 text-white rounded-lg grid place-items-center font-black mb-2">
              L1
            </div>
            <div className="text-[13px] font-bold mb-1">总协调</div>
            <div className="text-[11px]">中央技能 / 跨频道战略 / 配额</div>
          </div>
          {/* L2 */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <div className="w-9 h-9 bg-sky-600 text-white rounded-lg grid place-items-center font-black mb-2">
              L2
            </div>
            <div className="text-[13px] font-bold mb-1">频道 DNA</div>
            <div className="text-[11px]">定位 / 对标 / 受众 / 热点</div>
          </div>
          {/* L3 */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-lg grid place-items-center font-black mb-2">
              L3
            </div>
            <div className="text-[13px] font-bold mb-1">视频任务</div>
            <div className="text-[11px]">S5-S17 单片生命周期</div>
          </div>
        </div>
      </div>
    </div>
  );
}
