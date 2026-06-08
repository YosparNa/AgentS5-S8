// SimulateButton.tsx — 运行按钮
import { useRun } from "@/store/runStore";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";

const AUTO_STEP_LABELS: Record<string, string> = {
  s5: "S5 选题生成中...",
  s6: "S6 大纲生成中...",
  s6_review: "S6 大纲待审核",
  s7: "S7 脚本生成中...",
  s7_edit: "S7 脚本可编辑",
  s8: "S8 对抗审核中...",
  s8_review: "S8 对抗审核待审核",
  done: "全流程完成",
};

export function SimulateButton() {
  const editMode = useUi((s) => s.editMode);
  const autoMode = useRun((s) => s.autoMode);
  const currentAutoStep = useRun((s) => s.currentAutoStep);
  const runningStage = useRun((s) => s.runningStage);
  const approveAndContinue = useRun((s) => s.approveAndContinue);
  const rejectAndRollback = useRun((s) => s.rejectAndRollback);
  const runFullWorkflow = useRun((s) => s.runFullWorkflow);

  if (editMode) return null;

  // 自动模式 UI
  if (autoMode) {
    const isRunning = !!runningStage;
    const label = AUTO_STEP_LABELS[currentAutoStep] || currentAutoStep;

    return (
      <div className="flex items-center gap-1.5">
        {isRunning && (
          <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        )}
        <span className="text-[10px] text-indigo-600 font-semibold">{label}</span>
        {!isRunning && currentAutoStep !== "done" && (
          <>
            <button onClick={() => approveAndContinue()} className="text-[11px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center gap-1">
              <Icon.ArrowRight size={10} /> 继续
            </button>
            <button onClick={() => rejectAndRollback("s5")} className="text-[11px] border border-red-300 text-red-600 px-2 py-1 rounded hover:bg-red-50">
              驳回
            </button>
          </>
        )}
        {currentAutoStep === "done" && (
          <button onClick={() => { useRun.setState({ autoMode: false, currentAutoStep: "idle" }); }}
            className="text-[11px] bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1">
            <Icon.Rotate size={11} /> 重置
          </button>
        )}
      </div>
    );
  }

  // 后端模式 —— 唯一按钮
  return (
    <button onClick={runFullWorkflow}
      className="text-[11px] bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700 flex items-center gap-1">
      <Icon.Flask size={11} /> 运行 S5-S8
    </button>
  );
}
