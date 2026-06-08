// LiveTab — per-stage real-time execution UI reading from runStore.
// S5/S6/S7: step checklist derived from progressPct.
// S8: reviewer role grid (5 roles, each 20% band).
// All stages: progress bar + timing + intervention card.

import { useUi } from "@/store/uiStore";
import { useRun } from "@/store/runStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

// ── Step definitions per stage ──────────────────────────────────────────────

const STAGE_STEPS: Record<string, { label: string; icon: string }[]> = {
  s5: [
    { label: "分析 S4 热点数据", icon: "🔍" },
    { label: "生成候选选题", icon: "💡" },
    { label: "多维评分排序", icon: "📊" },
    { label: "锁定最优选题", icon: "🎯" },
  ],
  s6: [
    { label: "读取选题数据", icon: "📖" },
    { label: "分析频道定位", icon: "📡" },
    { label: "生成章节结构", icon: "🏗️" },
    { label: "标注危机钩子", icon: "⚠️" },
    { label: "计算张力曲线", icon: "📈" },
  ],
  s7: [
    { label: "读取大纲结构", icon: "📖" },
    { label: "分析章节钩子", icon: "🪝" },
    { label: "生成口播内容", icon: "🎙️" },
    { label: "应用禁用词过滤", icon: "🚫" },
    { label: "添加危机点转折", icon: "⚠️" },
  ],
};

const STAGE_META: Record<string, { title: string; agentLabel: string }> = {
  s5: { title: "AI 选题 Agent", agentLabel: "选题" },
  s6: { title: "大纲生成 Agent", agentLabel: "大纲" },
  s7: { title: "口播脚本 Agent", agentLabel: "脚本" },
  s8: { title: "对抗审核 Agent", agentLabel: "对抗审核" },
};

// S8 reviewer roles
const S8_ROLES = [
  { key: "troll", label: "杠精", emoji: "😤", desc: "逻辑漏洞压力测试" },
  { key: "peer", label: "同行", emoji: "🧑‍💻", desc: "专业视角技术校验" },
  { key: "newbie", label: "小白", emoji: "😶", desc: "零基础理解力测试" },
  { key: "fan", label: "老粉", emoji: "❤️", desc: "忠实粉丝人设校验" },
  { key: "compliance", label: "合规", emoji: "⚖️", desc: "平台红线合规审查" },
] as const;

// ── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar() {
  const pct = useRun((s) => s.progressPct);
  const elapsed = useRun((s) => s.progressElapsed);
  const remaining = useRun((s) => s.progressRemaining);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
            <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          </div>
          <span className="text-[10px] text-gray-500">
            剩余: {remaining || "计算中..."}
          </span>
        </div>
        <span className="text-[11px] mono text-indigo-600 font-bold">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-150"
          style={{ width: pct + "%" }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-gray-400">已用时: {elapsed}</span>
        {pct >= 100 && (
          <span className="text-[10px] text-emerald-600 font-medium">已完成</span>
        )}
      </div>
    </div>
  );
}

// ── S5/S6/S7 Checklist ──────────────────────────────────────────────────────

function StageChecklist({ stageId }: { stageId: string }) {
  const pct = useRun((s) => s.progressPct);
  const steps = STAGE_STEPS[stageId] ?? [];
  const totalSteps = steps.length;
  const completedCount = Math.floor((pct / 100) * totalSteps);
  const isRunning = pct > 0 && pct < 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[12px] font-bold">执行步骤</div>
        <div className="text-[10px] mono text-indigo-600 font-bold">
          {Math.min(completedCount, totalSteps)}/{totalSteps}
        </div>
      </div>
      <div className="space-y-1.5">
        {steps.map((step, idx) => {
          const isDone = idx < completedCount;
          const isActive = idx === completedCount && isRunning;

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2.5 p-2 rounded-lg transition-colors",
                isActive
                  ? "bg-indigo-50 border border-indigo-200"
                  : isDone
                  ? "bg-emerald-50/50"
                  : "bg-gray-50/50"
              )}
            >
              {/* Status icon */}
              <div className="w-5 h-5 shrink-0 grid place-items-center">
                {isDone ? (
                  <Icon.CircleCheck size={16} className="text-emerald-500" />
                ) : isActive ? (
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <Icon.Circle size={16} className="text-gray-300" />
                )}
              </div>

              {/* Step emoji */}
              <span className="text-[13px] shrink-0">{step.icon}</span>

              {/* Label */}
              <div
                className={cn(
                  "text-[11px] flex-1",
                  isDone
                    ? "text-gray-600"
                    : isActive
                    ? "font-semibold text-indigo-700"
                    : "text-gray-400"
                )}
              >
                {step.label}
                {isActive && (
                  <span className="ml-1.5 text-[9px] text-indigo-500 blink">
                    执行中...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── S8 Reviewer Grid ────────────────────────────────────────────────────────

function S8ReviewerGrid() {
  const pct = useRun((s) => s.progressPct);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[12px] font-bold">审核角色</div>
        <div className="text-[10px] text-gray-500">
          {S8_ROLES.filter((_, i) => pct >= (i + 1) * 20).length}/{S8_ROLES.length} 完成
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {S8_ROLES.map((role, idx) => {
          const bandStart = idx * 20;
          const bandEnd = (idx + 1) * 20;
          const isDone = pct >= bandEnd;
          const isActive = pct >= bandStart && pct < bandEnd;
          const isWaiting = pct < bandStart;

          return (
            <div
              key={role.key}
              className={cn(
                "rounded-lg p-2.5 border transition-all",
                isDone
                  ? "border-emerald-300 bg-emerald-50"
                  : isActive
                  ? "border-indigo-300 bg-indigo-50 shadow-sm"
                  : "border-gray-200 bg-gray-50/50",
                // Last item centered if odd count
                idx === S8_ROLES.length - 1 && S8_ROLES.length % 2 !== 0
                  ? "col-span-2"
                  : ""
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[16px]">{role.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        isDone
                          ? "text-emerald-700"
                          : isActive
                          ? "text-indigo-700"
                          : "text-gray-400"
                      )}
                    >
                      {role.label}
                    </span>
                    {isDone && (
                      <Icon.CircleCheck size={12} className="text-emerald-500" />
                    )}
                    {isActive && (
                      <div className="relative w-3 h-3">
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "text-[9px]",
                  isDone
                    ? "text-emerald-600"
                    : isActive
                    ? "text-indigo-600 font-medium"
                    : "text-gray-400"
                )}
              >
                {isDone
                  ? "审核完成"
                  : isActive
                  ? "审核中..."
                  : isWaiting
                  ? "等待中"
                  : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Intervention Card ───────────────────────────────────────────────────────

function InterventionCard() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
      <div className="text-[11px] font-bold text-amber-900 mb-2">
        ✋ 立即干预
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <button className="text-[10px] bg-white border border-amber-200 rounded px-2 py-1 hover:bg-amber-100 transition-colors">
          停下，方向不对
        </button>
        <button className="text-[10px] bg-white border border-amber-200 rounded px-2 py-1 hover:bg-amber-100 transition-colors">
          改成对照型
        </button>
        <button className="text-[10px] bg-white border border-amber-200 rounded px-2 py-1 hover:bg-amber-100 transition-colors">
          回到 25 秒前
        </button>
        <button className="text-[10px] bg-white border border-amber-200 rounded px-2 py-1 hover:bg-amber-100 transition-colors">
          让小白再挑
        </button>
      </div>
      <textarea
        className="w-full text-[11px] border border-amber-200 rounded p-2 resize-none bg-white outline-none focus:border-amber-400 transition"
        rows={2}
        placeholder="或直接写一句话改方向..."
      />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function LiveTab() {
  const stageId = useUi((s) => s.stageDrawer.stageId);
  const stage = stageId?.toLowerCase() ?? "";
  const runningStage = useRun((s) => s.runningStage);
  const pct = useRun((s) => s.progressPct);
  const isRunning = runningStage === stage;
  const meta = STAGE_META[stage];

  // Determine which stage icon to show
  const StageIcon =
    stage === "s5"
      ? Icon.Sparkles
      : stage === "s6"
      ? Icon.FilePen
      : stage === "s7"
      ? Icon.Pen
      : stage === "s8"
      ? Icon.Gavel
      : Icon.Clock;

  return (
    <div className="p-4 space-y-3">
      {/* Agent title card */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-lg grid place-items-center",
              stage === "s5"
                ? "bg-indigo-100 text-indigo-600"
                : stage === "s6"
                ? "bg-blue-100 text-blue-600"
                : stage === "s7"
                ? "bg-violet-100 text-violet-600"
                : stage === "s8"
                ? "bg-amber-100 text-amber-600"
                : "bg-gray-100 text-gray-600"
            )}
          >
            <StageIcon size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold">
              {meta?.title ?? "Agent 执行中"}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {isRunning ? (
                <span className="text-indigo-600 blink">正在运行...</span>
              ) : pct >= 100 ? (
                <span className="text-emerald-600">执行完成</span>
              ) : (
                <span>等待执行</span>
              )}
            </div>
          </div>
          {isRunning && (
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Stage-specific content */}
      {(stage === "s5" || stage === "s6" || stage === "s7") && (
        <StageChecklist stageId={stage} />
      )}
      {stage === "s8" && <S8ReviewerGrid />}

      {/* Fallback for unknown stages */}
      {!STAGE_STEPS[stage] && stage !== "s8" && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-center py-6 text-gray-400">
            <Icon.Clock size={20} className="mx-auto mb-2 opacity-60" />
            <div className="text-[11px]">此阶段无实时执行面板</div>
          </div>
        </div>
      )}

      {/* Progress bar + timing */}
      <ProgressBar />

      {/* Intervention card */}
      <InterventionCard />
    </div>
  );
}
