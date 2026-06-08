// HistoryTab — reproduce renderHistory 4131–4136.
// Static content; takes no props (version history is mocked).
export function HistoryTab() {
  return (
    <div className="p-4 space-y-2">
      {/* V3 current */}
      <div className="bg-white rounded-lg border border-indigo-400 p-3 flex items-center gap-3">
        <div className="w-10 text-center">
          <div className="text-[12px] font-bold mono">V3</div>
          <div className="text-[9px] text-gray-400">刚刚</div>
        </div>
        <div className="flex-1 text-[11px]">当前版本</div>
      </div>
      {/* V2 with rollback */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
        <div className="w-10 text-center">
          <div className="text-[12px] font-bold mono">V2</div>
          <div className="text-[9px] text-gray-400">12 分前</div>
        </div>
        <div className="flex-1 text-[11px]">调整模板重跑</div>
        <button className="text-[10px] border border-gray-200 px-2 py-0.5 rounded hover:bg-gray-50">
          回滚
        </button>
      </div>
    </div>
  );
}
