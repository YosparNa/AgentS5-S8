// 来源 PROTO lines 3721–3730 (renderOutput viral-hub branch)
// Container-agnostic: no props needed; navigates to /viral.

import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/icons";

export function ViralHubArtifact() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Info banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-[11px] text-orange-900 mb-2">
        <Icon.Fire size={12} className="mr-1 inline" />
        S2.5 是 L2 频道级独立子页，承担"样本流"沉淀。点下方进入完整子页查看 14 个样本 + 6 维解构 + 候选规则。
      </div>

      {/* Navigate button */}
      <button
        onClick={() => navigate("/viral")}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[12px] font-semibold py-2.5 rounded-lg hover:from-orange-600 hover:to-amber-600"
      >
        <Icon.ExternalLink size={10} className="mr-1 inline" />
        进入 S2.5 爆款解构子页
      </button>

      {/* Monthly overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mt-2">
        <div className="text-[10px] uppercase text-gray-400 font-bold mb-2">本月概览</div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="bg-orange-50 rounded p-2">
            <div className="text-base font-black text-orange-600">14</div>
            <div className="text-gray-500">样本</div>
          </div>
          <div className="bg-purple-50 rounded p-2">
            <div className="text-base font-black text-purple-600">3</div>
            <div className="text-gray-500">候选</div>
          </div>
          <div className="bg-emerald-50 rounded p-2">
            <div className="text-base font-black text-emerald-600">2</div>
            <div className="text-gray-500">已升 L1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
