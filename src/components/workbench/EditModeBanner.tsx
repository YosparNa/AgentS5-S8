// EditModeBanner.tsx — shown only when editMode is true.
// Matches PROTO lines 2714–2724: gradient banner + action buttons.
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";

export function EditModeBanner() {
  const editMode = useUi((s) => s.editMode);
  const toggleEditMode = useUi((s) => s.toggleEditMode);
  const openModal = useUi((s) => s.openModal);

  if (!editMode) return null;

  return (
    <div
      className="edit-mode-banner bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 px-4 py-2 items-center justify-between gap-3 shrink-0"
      style={{ display: "flex" }}
    >
      <div className="flex items-center gap-2 text-[11px] text-indigo-900">
        <Icon.Pen size={12} className="text-indigo-600" />
        <span>
          <b>编辑工作流模式</b> · 拖拽 ⋮⋮ 换序 · 点 × 删除 L3 阶段 · 阶段间 + 插入新阶段 ·
          底部开关启用/禁用
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => openModal("insertStage")}
          className="text-[11px] bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded hover:bg-indigo-50 flex items-center"
        >
          <Icon.Plus size={9} className="mr-1" />
          添加阶段
        </button>
        <button
          onClick={toggleEditMode}
          className="text-[11px] bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700 flex items-center"
        >
          <Icon.Check size={9} className="mr-1" />
          完成编辑
        </button>
      </div>
    </div>
  );
}
