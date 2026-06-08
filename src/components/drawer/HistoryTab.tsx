// HistoryTab — 运行历史，从 runStore.agentHistory 读取
import { useRun } from "@/store/runStore";
import { useUi } from "@/store/uiStore";

export function HistoryTab() {
  const stageId = useUi((s) => s.stageDrawer.stageId);
  const history = useRun((s) => s.agentHistory.filter((h) => h.stage === stageId));
  const currentHistId = useRun((s) => s.stageCurrentHist[stageId || ""]);

  if (!history.length) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-400">
          <div className="text-2xl mb-2">🕐</div>
          <div className="text-[12px]">暂无运行历史</div>
          <div className="text-[10px] mt-1">生成内容后会自动保存历史记录</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {history.map((hist, i) => {
        const isCurrent = hist.id === currentHistId;
        return (
          <div
            key={hist.id}
            className={`bg-white rounded-lg ${isCurrent ? "border border-indigo-400" : "border border-gray-200"} p-3 flex items-center gap-3`}
          >
            <div className="w-16 text-center shrink-0">
              <div className="text-[12px] font-bold mono">{isCurrent ? "当前" : "V" + (history.length - i)}</div>
              <div className="text-[9px] text-gray-400">{hist.timestamp}</div>
            </div>
            <div className="flex-1 text-[11px]">{hist.summary}</div>
            {!isCurrent && (
              <button
                onClick={() => useRun.getState().agentRollback(hist.id)}
                className="text-[10px] border border-gray-200 px-2 py-0.5 rounded hover:bg-gray-50 shrink-0"
              >
                回滚
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
