// SourceModal — Task F4.
// Opens when activeModal === 'source'. Decorative 2×2 grid of source buttons.
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function SourceModal() {
  const activeModal = useUi((s) => s.activeModal);
  const closeModal = useUi((s) => s.closeModal);

  const open = activeModal === "source";
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
          <h2 className="text-lg font-black">添加来源</h2>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center"
          >
            <Icon.Close size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 grid grid-cols-2 gap-2">
          <button className="border border-gray-200 rounded-lg p-3 hover:border-indigo-400 text-left">
            <Icon.Link size={13} className="inline text-indigo-600 mr-2" />
            <b>粘贴网址</b>
          </button>
          <button className="border border-gray-200 rounded-lg p-3 hover:border-indigo-400 text-left">
            <Icon.FileUp size={13} className="inline text-indigo-600 mr-2" />
            <b>上传文件</b>
          </button>
          <button className="border border-gray-200 rounded-lg p-3 hover:border-indigo-400 text-left">
            <Icon.Search size={13} className="inline text-indigo-600 mr-2" />
            <b>Deep Research</b>
          </button>
          <button className="border border-gray-200 rounded-lg p-3 hover:border-indigo-400 text-left">
            <Icon.MessagesSquare size={13} className="inline text-indigo-600 mr-2" />
            <b>评论区抓取</b>
          </button>
        </div>
      </div>
    </div>
  );
}
