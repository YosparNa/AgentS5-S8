// ProbePanel — left aside, width 310px
// C3b: 信息探测 / 来源 panel
// PROTO lines 2640–2709 (structure) + 4204–4280 (result branches)

import { useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useUi, type ProbeMode } from "@/store/uiStore";
import { dataProvider } from "@/services/dataProvider";
import type { ProbeResult, ProbeSource } from "@/types/views";

// ── Helper: add-button with local check state ─────────────────────────────

function AddButton() {
  const [added, setAdded] = useState(false);
  return (
    <button
      onClick={() => setAdded(true)}
      className={cn(
        "w-6 h-6 rounded grid place-items-center text-[10px] shrink-0 transition-colors",
        added
          ? "bg-emerald-500 text-white"
          : "bg-indigo-600 hover:bg-indigo-700 text-white"
      )}
    >
      {added ? <Icon.Check size={10} /> : <Icon.Plus size={10} />}
    </button>
  );
}

// ── Result branches ───────────────────────────────────────────────────────

function WebResult({
  result,
  onSwitchDeep,
}: {
  result: ProbeResult;
  onSwitchDeep: () => void;
}) {
  return (
    <>
      <div className="text-[12px] leading-relaxed mb-3 text-gray-800">
        <span className="typing">{result.summary}</span>
      </div>
      <div className="text-[10px] text-gray-500 mb-1 flex items-center justify-between">
        <span>来源（{result.sources?.length ?? 0}）</span>
        <button onClick={onSwitchDeep} className="text-purple-600 hover:underline">
          ▸ 切深度研究
        </button>
      </div>
      <div className="space-y-1.5">
        {(result.sources ?? []).map((s: ProbeSource) => (
          <div key={s.i} className="src-card flex items-start gap-2">
            <span className="cite shrink-0">{s.i}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold truncate">{s.title}</div>
              {s.url && (
                <div className="text-[9px] text-gray-500 mono truncate">{s.url}</div>
              )}
              {s.desc && (
                <div className="text-[9px] text-gray-500">{s.desc}</div>
              )}
            </div>
            <AddButton />
          </div>
        ))}
      </div>
    </>
  );
}

function YtResult({ result }: { result: ProbeResult }) {
  return (
    <>
      <div className="text-[12px] leading-relaxed mb-3 text-gray-800">
        {result.summary}
      </div>
      <div className="space-y-2">
        {(result.sources ?? []).map((s: ProbeSource) => (
          <div key={s.i} className="src-card flex items-start gap-2">
            <span className="cite shrink-0">{s.i}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold truncate">{s.title}</div>
              <div className="text-[9px] text-gray-500">
                {s.channel && `@${s.channel}`}
                {s.views && ` · ${s.views}`}
                {s.angle && ` · ${s.angle}`}
              </div>
            </div>
            <AddButton />
          </div>
        ))}
      </div>
    </>
  );
}

function OwnResult({
  result,
  onSwitchWeb,
}: {
  result: ProbeResult;
  onSwitchWeb: () => void;
}) {
  return (
    <>
      <div className="text-[12px] leading-relaxed mb-3">
        <p className="text-gray-800">
          <span className="typing">{result.ownIntro}</span>
        </p>
        <p className="text-gray-600 text-[11px] mt-1">
          建议切到{" "}
          <button onClick={onSwitchWeb} className="text-indigo-600 underline">
            Web 模式
          </button>{" "}
          重新探测。
        </p>
      </div>
      <div className="text-[10px] text-gray-500 mb-1">参考片段（从本视频已挂载的来源）</div>
      <div className="space-y-1.5">
        {(result.ownRefs ?? []).map((ref, idx) => (
          <div key={idx} className="src-card text-[10px]">
            <b className="text-emerald-700">{ref.label}</b>
            <br />
            {ref.body}
          </div>
        ))}
      </div>
    </>
  );
}

function DeepResult({ result }: { result: ProbeResult }) {
  return (
    <>
      <div className="bg-purple-50 border border-purple-200 rounded p-2 text-[11px] text-purple-900 mb-2">
        <span className="flex items-center gap-1.5 font-bold mb-1">
          <Icon.Microscope size={11} />
          深度研究中...
        </span>
        <div className="text-[10px] mt-1">{result.deepNote}</div>
      </div>
      <div className="space-y-1 text-[10px] text-gray-600">
        {(result.deepTasks ?? []).map((task, idx) => (
          <div
            key={idx}
            className={cn("flex items-center gap-2", task.state === "pending" && "opacity-50")}
          >
            {task.state === "done" && (
              <Icon.CircleCheck size={12} className="text-emerald-500 shrink-0" />
            )}
            {task.state === "running" && (
              <div className="relative w-3 h-3 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-purple-200" />
                <div className="absolute inset-0 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
              </div>
            )}
            {task.state === "pending" && (
              <Icon.Circle size={12} className="text-gray-300 shrink-0" />
            )}
            <span>{task.label}</span>
          </div>
        ))}
      </div>
      <button className="w-full mt-2 text-[10px] bg-white border border-purple-200 text-purple-700 rounded py-1.5 hover:bg-purple-50">
        通知我完成 · 不阻塞当前工作
      </button>
    </>
  );
}

// ── ProbeResultArea ────────────────────────────────────────────────────────

function ProbeResultArea({
  result,
  onClose,
  onSwitchDeep,
  onSwitchWeb,
}: {
  result: ProbeResult;
  onClose: () => void;
  onSwitchDeep: () => void;
  onSwitchWeb: () => void;
}) {
  const modeIconMap: Record<string, React.ReactNode> = {
    Globe: <Icon.Globe size={11} className={result.modeColor} />,
    Youtube: <Icon.Youtube size={11} className={result.modeColor} />,
    Database: <Icon.Database size={11} className={result.modeColor} />,
    Microscope: <Icon.Microscope size={11} className={result.modeColor} />,
  };

  return (
    <div className="border-b border-gray-100 px-3 py-2 overflow-y-auto" style={{ maxHeight: "50%" }}>
      <div className="probe-result-card p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            {modeIconMap[result.modeIcon] ?? <Icon.Globe size={11} />}
            <span className="font-bold">{result.modeName}</span>
            <span className="text-gray-400">· {result.time}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-[11px]">
            <Icon.Close size={12} />
          </button>
        </div>

        {/* Query */}
        <div className="text-[12px] font-bold mb-2 text-gray-800">"{result.query}"</div>

        {/* Body by mode */}
        {result.mode === "web" && (
          <WebResult result={result} onSwitchDeep={onSwitchDeep} />
        )}
        {result.mode === "yt" && <YtResult result={result} />}
        {result.mode === "own" && (
          <OwnResult result={result} onSwitchWeb={onSwitchWeb} />
        )}
        {result.mode === "deep" && <DeepResult result={result} />}
      </div>
    </div>
  );
}

// ── Source Tabs ────────────────────────────────────────────────────────────

type SrcTab = "video" | "channel" | "central";

function SourceTabs({
  srcTab,
  setSrcTab,
  onOpenStage,
}: {
  srcTab: SrcTab;
  setSrcTab: (t: SrcTab) => void;
  onOpenStage: (id: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tab headers */}
      <div className="flex text-[11px] font-medium border-b border-gray-100">
        <button
          onClick={() => setSrcTab("video")}
          className={cn(
            "srctab tab flex-1 py-1.5 text-center",
            srcTab === "video" ? "active" : "text-gray-500"
          )}
        >
          <span className="layer-dot layer-video mr-1" />
          本视频
          <span className="mono text-[9px] ml-0.5 opacity-60">4</span>
        </button>
        <button
          onClick={() => setSrcTab("channel")}
          className={cn(
            "srctab tab flex-1 py-1.5 text-center",
            srcTab === "channel" ? "active" : "text-gray-500"
          )}
        >
          <span className="layer-dot layer-channel mr-1" />
          频道
        </button>
        <button
          onClick={() => setSrcTab("central")}
          className={cn(
            "srctab tab flex-1 py-1.5 text-center",
            srcTab === "central" ? "active" : "text-gray-500"
          )}
        >
          <span className="layer-dot layer-central mr-1" />
          中央
        </button>
      </div>

      {/* Tab bodies */}

      {/* video tab */}
      <div className={cn("flex-1 overflow-y-auto px-2 py-2 space-y-1", srcTab !== "video" && "hidden")}>
        <label className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" defaultChecked className="mt-1 w-3 h-3 accent-indigo-600" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <Icon.FileText size={10} className="text-red-500" />
              <span className="truncate text-[11px] font-medium">NotebookLM 官方指南</span>
            </div>
            <div className="text-[9px] text-gray-400">PDF · 引 5</div>
          </div>
        </label>
        <label className="flex items-start gap-2 p-2 rounded bg-indigo-50/40 border border-indigo-100">
          <input type="checkbox" defaultChecked className="mt-1 w-3 h-3 accent-indigo-600" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <Icon.Globe size={10} className="text-blue-500" />
              <span className="truncate text-[11px] font-medium text-indigo-900">Manus 1.6 Lite 产品页</span>
            </div>
            <div className="text-[9px] text-indigo-500">网页 · 引 4</div>
          </div>
        </label>
        <label className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" defaultChecked className="mt-1 w-3 h-3 accent-indigo-600" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <Icon.Youtube size={10} className="text-red-600" />
              <span className="truncate text-[11px] font-medium">Ali Abdaal NotebookLM 评测</span>
            </div>
            <div className="text-[9px] text-gray-400">YT · 引 2</div>
          </div>
        </label>
        <div className="mt-3 px-2 text-[9px] text-gray-400 uppercase font-semibold">本视频独有洞察</div>
        <div className="bg-indigo-50/50 border border-indigo-100 rounded p-2 text-[10px] text-indigo-900">
          <div className="font-bold mb-1 flex items-center gap-1">
            <Icon.Binoculars size={9} />
            差异化切角
          </div>
          Manus = Action 引擎，NotebookLM = Grounding 空间
        </div>
      </div>

      {/* channel tab */}
      <div className={cn("flex-1 overflow-y-auto px-2 py-2 space-y-2", srcTab !== "channel" && "hidden")}>
        <button
          onClick={() => onOpenStage("s1")}
          className="w-full bg-white border border-sky-100 rounded-lg p-2 hover:border-sky-300 text-left"
        >
          <div className="text-[10px] font-bold text-sky-900">赛道分析</div>
          <div className="text-[10px] text-gray-600">AI 生产力 · 蓝海</div>
        </button>
        <button
          onClick={() => onOpenStage("s2")}
          className="w-full bg-white border border-sky-100 rounded-lg p-2 hover:border-sky-300 text-left"
        >
          <div className="text-[10px] font-bold text-sky-900">对标 ×12</div>
        </button>
        <button
          onClick={() => onOpenStage("s3")}
          className="w-full bg-white border border-sky-100 rounded-lg p-2 hover:border-sky-300 text-left"
        >
          <div className="text-[10px] font-bold text-sky-900">定位 + 人设 ✓审①</div>
        </button>
        <button
          onClick={() => onOpenStage("s4")}
          className="w-full bg-white border border-sky-100 rounded-lg p-2 hover:border-sky-300 text-left"
        >
          <div className="text-[10px] font-bold text-sky-900">热点 5 · 06:00</div>
        </button>
      </div>

      {/* central tab */}
      <div className={cn("flex-1 overflow-y-auto px-2 py-2 space-y-2", srcTab !== "central" && "hidden")}>
        <button className="w-full bg-white border border-purple-100 rounded-lg p-2 hover:border-purple-300 text-left">
          <div className="text-[10px] mono font-bold text-purple-900">Rule_Hk_01</div>
          <div className="text-[11px]">反常识开场白</div>
        </button>
        <button className="w-full bg-white border border-purple-100 rounded-lg p-2 hover:border-purple-300 text-left">
          <div className="text-[10px] mono font-bold text-purple-900">Rule_Title_04</div>
          <div className="text-[11px]">冲突型标题</div>
        </button>
        <button className="w-full bg-white border border-purple-100 rounded-lg p-2 hover:border-purple-300 text-left">
          <div className="text-[10px] mono font-bold text-purple-900">Skill_Storyboard_02</div>
          <div className="text-[11px]">UI 对照分镜</div>
        </button>
      </div>
    </div>
  );
}

// ── ProbePanel ─────────────────────────────────────────────────────────────

const MODE_CONFIG: Array<{
  mode: ProbeMode;
  icon: React.ReactNode;
  label: string;
}> = [
  { mode: "web", icon: <Icon.Globe size={8} />, label: "Web" },
  { mode: "yt", icon: <Icon.Youtube size={8} />, label: "YT" },
  { mode: "own", icon: <Icon.Database size={8} />, label: "本号库" },
  { mode: "deep", icon: <Icon.Microscope size={8} />, label: "深度" },
];

const HISTORY_ITEMS = [
  { text: "Sora 2 商用条款", meta: "2h 前", pinned: false },
  { text: "NotebookLM Studio 新功能", meta: "昨天", pinned: false },
  { text: "Manus 1.6 Lite 限制", meta: "已固定", pinned: true },
];

export function ProbePanel() {
  const probeMode = useUi((s) => s.probeMode);
  const setProbeMode = useUi((s) => s.setProbeMode);
  const openModal = useUi((s) => s.openModal);
  const openStage = useUi((s) => s.openStage);

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [srcTab, setSrcTab] = useState<SrcTab>("video");

  function doProbe(q?: string) {
    const q2 = (q ?? query).trim();
    if (!q2) return;
    setQuery(q2);
    setShowHistory(false);
    dataProvider.probe(q2, probeMode).then(setResult);
  }

  function switchToDeep() {
    setProbeMode("deep");
    dataProvider.probe(query.trim(), "deep").then(setResult);
  }

  function switchToWeb() {
    setProbeMode("web");
    dataProvider.probe(query.trim(), "web").then(setResult);
  }

  return (
    <aside className="w-[310px] bg-white border-r border-gray-200 flex flex-col shrink-0">

      {/* ── Top probe box ── */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 shrink-0">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800 text-[12px] flex items-center gap-1.5">
            <Icon.SatelliteDish size={10} className="text-indigo-500" />
            信息探测 / 来源
          </h2>
          <button
            onClick={() => openModal("source")}
            className="text-[10px] text-gray-500 hover:text-indigo-600 flex items-center gap-0.5"
          >
            <Icon.Paperclip size={9} />
            结构化导入
          </button>
        </div>

        {/* Probe shell */}
        <div className="probe-shell">
          <div className="flex items-center gap-2 mb-2">
            <Icon.Search size={11} className="text-indigo-500 shrink-0" />
            <input
              className="probe-input"
              placeholder="例：Manus 最新定价 / Cursor vs Copilot 实测 / Sora 2 商用条款"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") doProbe();
              }}
            />
            <button
              onClick={() => doProbe()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-6 h-6 rounded grid place-items-center shrink-0"
            >
              <Icon.ArrowUp size={10} />
            </button>
          </div>

          {/* Mode pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {MODE_CONFIG.map(({ mode, icon, label }) => (
              <button
                key={mode}
                className={cn("mode-pill", probeMode === mode && "active")}
                onClick={() => setProbeMode(mode)}
              >
                <span className="mr-0.5">{icon}</span>
                {label}
              </button>
            ))}
            <button
              className="ml-auto text-[10px] text-gray-400 hover:text-gray-700"
              title="探测历史"
              onClick={() => setShowHistory((v) => !v)}
            >
              <Icon.Clock size={12} />
            </button>
          </div>
        </div>

        {/* History dropdown */}
        {showHistory && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg p-2 text-[11px] space-y-1">
            <div className="text-[9px] uppercase text-gray-400 font-bold mb-1">最近探测</div>
            {HISTORY_ITEMS.map((item) => (
              <button
                key={item.text}
                onClick={() => doProbe(item.text)}
                className="block w-full text-left px-2 py-1 hover:bg-gray-50 rounded"
              >
                {item.pinned ? (
                  <Icon.Star size={8} className="text-amber-500 mr-1 inline" />
                ) : (
                  <Icon.Clock size={8} className="text-gray-400 mr-1 inline" />
                )}
                {item.text}
                <span className="text-[9px] text-gray-400 ml-1">{item.meta}</span>
              </button>
            ))}
          </div>
        )}

        {/* Stage suggest */}
        <div className="mt-2 text-[10px] text-gray-500 leading-relaxed">
          <Icon.Lightbulb size={9} className="text-amber-400 inline mr-0.5" />
          当前 <b className="text-indigo-600">S9 分镜</b> · 建议查：
          <button
            onClick={() => doProbe("Manus UI 截图素材")}
            className="text-indigo-600 hover:underline"
          >
            UI 截图
          </button>·
          <button
            onClick={() => doProbe("对照分镜模板变种")}
            className="text-indigo-600 hover:underline"
          >
            对照分镜变种
          </button>·
          <button
            onClick={() => doProbe("NotebookLM 演示动画")}
            className="text-indigo-600 hover:underline"
          >
            演示动画
          </button>
        </div>
      </div>

      {/* ── Probe result area ── */}
      {result !== null && (
        <ProbeResultArea
          result={result}
          onClose={() => setResult(null)}
          onSwitchDeep={switchToDeep}
          onSwitchWeb={switchToWeb}
        />
      )}

      {/* ── Source tabs (shown when no result) ── */}
      {result === null && (
        <SourceTabs
          srcTab={srcTab}
          setSrcTab={setSrcTab}
          onOpenStage={openStage}
        />
      )}
    </aside>
  );
}
