// SimulateButton.tsx — 运行按钮：连接后端时创建真实 workflow，否则走 mock 模拟
import { useState } from "react";
import { useRun } from "@/store/runStore";
import { useUi } from "@/store/uiStore";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";

export function SimulateButton() {
  const editMode = useUi((s) => s.editMode);
  const simPhase = useRun((s) => s.simPhase);
  const simulate = useRun((s) => s.simulate);
  const stopSim = useRun((s) => s.stopSim);
  const resetSim = useRun((s) => s.resetSim);

  const [wfId, setWfId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  if (editMode) return null;

  const hasBackend = !!import.meta.env.VITE_API_BASE || true; // 默认连接后端

  async function handleRun() {
    setLoading(true);
    setStatus("创建 workflow...");
    try {
      const id = await dataProvider.runWithBackend("测试数据：年轻人消费趋势", "科技生活区UP主");
      setWfId(id);
      setStatus("S5 完成，S6 待审核");

      // 自动推进 S6 审核 → S7 → S8
      setStatus("审核 S6...");
      await dataProvider.approveStage(id, "S6");
      setStatus("S7 生成中...");
      await dataProvider.advanceWorkflow(id);
      setStatus("S8 审核中...");
      await dataProvider.approveStage(id, "S8");
      // 再推进一步让 S8 完成审核
      const final = await dataProvider.advanceWorkflow(id);
      setStatus(`完成！当前: ${final.workflow.current_stage || "全部完成"}`);

      // 触发 UI 刷新
      useRun.getState().loadStages();
    } catch (e: unknown) {
      setStatus(`错误: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <button disabled className="text-[11px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded flex items-center gap-1">
        <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        {status || "运行中..."}
      </button>
    );
  }

  if (wfId && status.includes("完成")) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-emerald-600 font-semibold">✅ {status}</span>
        <button
          onClick={() => { setWfId(null); setStatus(""); }}
          className="text-[11px] bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"
        >
          <Icon.Rotate size={11} />
          重置
        </button>
      </div>
    );
  }

  // Mock 模式（无后端时）
  if (!hasBackend) {
    switch (simPhase) {
      case "idle":
        return (
          <button onClick={simulate} className="text-[11px] bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700 flex items-center gap-1">
            <Icon.Flask size={11} /> 模拟运行
          </button>
        );
      case "running":
        return (
          <button onClick={stopSim} className="text-[11px] bg-gray-100 text-red-600 border border-red-200 px-2.5 py-1 rounded hover:bg-red-50 flex items-center gap-1">
            <Icon.Pause size={11} /> 停止
          </button>
        );
      case "awaiting_review":
        return (
          <button className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded flex items-center gap-1 cursor-default" disabled>
            <Icon.Clock size={11} /> 待审核
          </button>
        );
      case "done":
        return (
          <button onClick={resetSim} className="text-[11px] bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded hover:bg-gray-200 flex items-center gap-1">
            <Icon.Rotate size={11} /> 重置
          </button>
        );
      default:
        return null;
    }
  }

  // 真实后端模式
  return (
    <button
      onClick={handleRun}
      className="text-[11px] bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700 flex items-center gap-1"
    >
      <Icon.Flask size={11} />
      {status || "运行 S5-S8"}
    </button>
  );
}
