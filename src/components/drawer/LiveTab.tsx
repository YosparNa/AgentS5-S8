// LiveTab — reproduce renderLive 3612–3673.
// Manus frame is static demo content (proto uses fixed M-0xx shots).
// Checklist/progress driven from runStore; falls back to static proto checklist when inactive.
import { useUi } from "@/store/uiStore";
import { useRun } from "@/store/runStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

const STATIC_CHECKLIST = [
  { label: "读取脚本 V3 + 频道分镜风格", done: true },
  { label: "应用 Skill_Storyboard_02 · 17 个 UI 对比镜头", done: true },
  { label: "生成 38 个分镜卡片", done: false, doing: true },
  { label: "输出分镜表 + 素材采购清单", done: false },
  { label: "提交审核 ④", done: false },
];

const STATIC_LIVE = {
  appName: "Storyboard Editor",
  addr: "creator-os/.../s9-storyboard",
  actionNow: "正在生成镜头 M-018「Manus 日志 UI 截图」",
};

// Reads the active stage's run state from runStore (keyed by the drawer's stageId).
export function LiveTab() {
  const stageId = useUi((s) => s.stageDrawer.stageId);
  const nr = useRun((s) => (stageId ? s.run.nodes[stageId] : undefined));

  // Build checklist from runStore, fallback to static
  const checklist =
    nr?.checklist && nr.checklist.length > 0
      ? nr.checklist.map((c) => ({ label: c.label, done: c.done, doing: false }))
      : STATIC_CHECKLIST;

  // Find "doing" index: first not-done when nr is active
  const doingIndex =
    nr?.status === "active"
      ? checklist.findIndex((c) => !c.done)
      : STATIC_CHECKLIST.findIndex((c) => (c as { doing?: boolean }).doing);

  const doneCount =
    nr?.doneCount ?? checklist.filter((c) => c.done).length;
  const totalCount = nr?.totalCount ?? checklist.length;

  return (
    <div className="p-4 space-y-3">
      {/* Manus frame */}
      <div className="manus-frame">
        {/* Head */}
        <div className="manus-frame-head">
          <div className="manus-traffic">
            <span />
            <span />
            <span />
          </div>
          <div className="manus-addr">
            <Icon.Lock size={9} />
            <span>{STATIC_LIVE.addr}</span>
          </div>
          <button className="text-[9px] text-gray-400">
            <Icon.ExternalLink size={10} />
          </button>
        </div>

        {/* Viewport */}
        <div className="manus-viewport">
          <div className="text-[10px] text-gray-500 flex items-center gap-2">
            <span className="text-amber-500">⚡</span>
            <span>
              <b className="text-gray-800">Creator OS</b> 的工作台 · 正在使用{" "}
              <b>{STATIC_LIVE.appName}</b>
            </span>
          </div>

          {/* 3×3 shot grid */}
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-gray-50 rounded-md">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
              const isActive = i === 5;
              const isDone = i < 5;
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-video rounded flex flex-col items-center justify-center text-[8px]",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : isDone
                      ? "bg-emerald-100 text-gray-500"
                      : "bg-white border border-dashed border-gray-300 text-gray-500"
                  )}
                >
                  <div className="mono font-bold">M-{String(16 + i).padStart(3, "0")}</div>
                  {isActive ? (
                    <div className="mt-0.5">写入中...</div>
                  ) : isDone ? (
                    <Icon.Check size={8} className="mt-0.5" />
                  ) : (
                    <div className="mt-0.5 opacity-40">待</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-[9px] text-gray-400 text-center">9 / 38 · 滚动查看其余镜头</div>

          {/* Narration */}
          <div className="manus-narration">
            <span className="blink">●</span>
            <span>
              {STATIC_LIVE.actionNow}
              <span className="manus-cursor" />
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="manus-timeline">
          <button className="text-gray-400">
            <Icon.SkipBack size={12} />
          </button>
          <button className="text-gray-400">
            <Icon.Play size={10} />
          </button>
          <div className="scrub-track">
            <div className="scrub-fill" style={{ width: "76%" }} />
            <div className="scrub-handle" style={{ left: "76%" }} />
          </div>
          <span className="text-[10px] mono text-gray-500">02:14 / 02:55</span>
          <button className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded font-semibold flex items-center gap-1">
            <span className="w-1 h-1 bg-white rounded-full blink" />
            跳到实时
          </button>
        </div>
      </div>

      {/* Task progress card */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex justify-between mb-2">
          <div className="text-[12px] font-bold">任务进度</div>
          <div className="text-[10px] mono text-indigo-600 font-bold">
            {doneCount}/{totalCount}
          </div>
        </div>
        <div className="space-y-1.5">
          {checklist.map((c, idx) => {
            const isDoing = idx === doingIndex && !c.done;
            return (
              <div key={idx} className="flex items-start gap-2 text-[11px]">
                {c.done ? (
                  <Icon.CircleCheck size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                ) : isDoing ? (
                  <div className="relative w-3 h-3 mt-0.5 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-200" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <Icon.Circle size={12} className="text-gray-300 mt-0.5 shrink-0" />
                )}
                <div
                  className={cn(
                    "flex-1",
                    c.done
                      ? "text-gray-600"
                      : isDoing
                      ? "font-semibold text-indigo-700"
                      : "text-gray-400"
                  )}
                >
                  {c.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 立即干预 amber card */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="text-[11px] font-bold text-amber-900 mb-2">✋ 立即干预</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button className="text-[10px] bg-white border border-amber-200 rounded px-2 py-1 hover:bg-amber-100">
            停下，方向不对
          </button>
          <button className="text-[10px] bg-white border border-amber-200 rounded px-2 py-1 hover:bg-amber-100">
            改成对照型
          </button>
          <button className="text-[10px] bg-white border border-amber-200 rounded px-2 py-1 hover:bg-amber-100">
            回到 25 秒前
          </button>
          <button className="text-[10px] bg-white border border-amber-200 rounded px-2 py-1 hover:bg-amber-100">
            让小白再挑
          </button>
        </div>
        <textarea
          className="w-full text-[11px] border border-amber-200 rounded p-2 resize-none bg-white"
          rows={2}
          placeholder="或直接写一句话改方向..."
        />
      </div>
    </div>
  );
}
