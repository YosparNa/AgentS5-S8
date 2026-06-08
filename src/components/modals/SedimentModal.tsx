// SedimentModal — Task F4.
// Opens when activeModal === 'sediment'. Scrollable modal to sediment task experience.
import { useState } from "react";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

type SedTarget = "L1" | "L2" | "L3";

export function SedimentModal() {
  const activeModal = useUi((s) => s.activeModal);
  const closeModal = useUi((s) => s.closeModal);

  const open = activeModal === "sediment";

  const [checked1, setChecked1] = useState(true);
  const [checked2, setChecked2] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<SedTarget>("L2");

  if (!open) return null;

  return (
    <div
      className={cn("modal-mask", "show")}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Card — scrollable */}
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black">沉淀本任务经验</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              系统已识别 2 个高价值候选，你来决定归到哪一层
            </p>
          </div>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center"
          >
            <Icon.Close size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Section 1: 勾选片段 */}
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2">
              1️⃣ 勾选要沉淀的片段
            </div>
            <div className="space-y-2">
              {/* Fragment 1 */}
              <label className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked1}
                  onChange={(e) => setChecked1(e.target.checked)}
                  className="mt-1 w-3.5 h-3.5 accent-emerald-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold">S7 脚本"派系战争"框架</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded mono font-bold">
                      ★★★
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    竞品包装成"派系对立"而非"功能比较"
                  </div>
                </div>
              </label>
              {/* Fragment 2 */}
              <label className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked2}
                  onChange={(e) => setChecked2(e.target.checked)}
                  className="mt-1 w-3.5 h-3.5 accent-emerald-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold">S5 独特视角自查三问</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded mono font-bold">
                      ★★★
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    让 AI 模拟 ChatGPT 答，再要求差异化
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: 沉淀层 */}
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2">
              2️⃣ 沉淀到哪一层？
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* L1 */}
              <div
                onClick={() => setSelectedTarget("L1")}
                className={cn("sed-target", selectedTarget === "L1" && "active")}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-lg grid place-items-center font-black text-[12px]">
                    L1
                  </div>
                  <div>
                    <div className="text-[12px] font-bold">中央 L1</div>
                    <div className="text-[10px] text-purple-600 mono">跨所有频道</div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  多个赛道都成立时选这里。需 L1 审核。
                </p>
              </div>
              {/* L2 — default active */}
              <div
                onClick={() => setSelectedTarget("L2")}
                className={cn("sed-target", selectedTarget === "L2" && "active")}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-sky-600 text-white rounded-lg grid place-items-center font-black text-[12px]">
                    L2
                  </div>
                  <div>
                    <div className="text-[12px] font-bold">本频道 L2</div>
                    <div className="text-[10px] text-sky-600 mono">仅 AI 工具频道</div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  只在本频道生效时选。立即生效。
                </p>
              </div>
              {/* L3 */}
              <div
                onClick={() => setSelectedTarget("L3")}
                className={cn("sed-target", selectedTarget === "L3" && "active")}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg grid place-items-center font-black text-[12px]">
                    L3
                  </div>
                  <div>
                    <div className="text-[12px] font-bold">仅本视频</div>
                    <div className="text-[10px] text-indigo-600 mono">仅备份</div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  不确定能否复用时选。不污染规则库。
                </p>
              </div>
            </div>
          </div>

          {/* AI 推荐 */}
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900">
            <div className="font-bold mb-1">
              <Icon.WandSparkles size={11} className="inline mr-1" />
              AI 推荐
            </div>
            <div>
              "派系战争"建议先归 <b>L2 本频道</b>。等再用 2-3 次成功后再升 L1。
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="text-[12px] border border-gray-200 px-3 py-1.5 rounded"
            >
              取消
            </button>
            <button
              onClick={closeModal}
              className="bg-indigo-600 text-white text-[12px] px-4 py-1.5 rounded font-semibold"
            >
              <Icon.Check size={10} className="inline mr-1" />
              沉淀到 L2 本频道
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
