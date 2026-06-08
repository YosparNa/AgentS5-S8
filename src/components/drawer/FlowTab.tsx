// FlowTab — reproduce renderFlow 4119–4129.
import type { StageDef } from "@/types";
import { Icon } from "@/components/icons";
import { LayerBadge } from "@/components/ui/LayerBadge";

export function FlowTab({ stage }: { stage: StageDef }) {
  const f = stage.flow;
  return (
    <div className="p-4 space-y-3">
      {/* Inputs */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="text-[10px] uppercase text-gray-400 font-bold mb-2">输入</div>
        {f.inputs.map((inp, i) => (
          <div key={i} className="flex gap-2 bg-gray-50 rounded p-2 mb-1.5 items-center">
            {inp.layer && <LayerBadge layer={inp.layer} />}
            <div className="text-[11px]">{inp.label}</div>
          </div>
        ))}
      </div>

      {/* Arrow down */}
      <div className="text-center text-gray-400">
        <Icon.ArrowRight className="inline-block rotate-90" size={14} />
      </div>

      {/* Stage box */}
      <div className="bg-indigo-600 text-white rounded-lg p-3">
        <div className="text-[10px] mono opacity-80 mb-1">{stage.code} · {stage.model}</div>
        <div className="text-[13px] font-bold">{stage.title}</div>
      </div>

      {/* Arrow down */}
      <div className="text-center text-gray-400">
        <Icon.ArrowRight className="inline-block rotate-90" size={14} />
      </div>

      {/* Outputs */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="text-[10px] uppercase text-gray-400 font-bold mb-2">输出</div>
        {f.outputs.map((out, i) => (
          <div key={i} className="flex gap-2 bg-emerald-50 rounded p-2 mb-1.5 items-start">
            <Icon.CircleCheck size={13} className="text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-[11px] font-medium">{out.label}</div>
          </div>
        ))}
      </div>

      {/* Next step */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900">
        <b>下一步：</b>{f.next}
      </div>
    </div>
  );
}
