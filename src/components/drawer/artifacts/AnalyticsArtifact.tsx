// 来源 PROTO lines 3704–3713 (renderOutput analytics branch)
// Container-agnostic: takes `metrics`, `keywords`, `candidates` props.
// "去沉淀 →" button calls useUi.openModal('sediment') only (container closes drawer if needed).

import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useUi } from "@/store/uiStore";

interface Metric {
  name: string;
  value: string;
  base: string;
  delta: string;
  good: boolean;
}

interface Keyword {
  word: string;
  count: number;
  sentiment: "pos" | "neg";
}

interface Candidate {
  name: string;
  type: string;
  target: string;
  confidence: string;
}

interface Props {
  metrics: Metric[];
  keywords: Keyword[];
  candidates: Candidate[];
}

// Color helpers — full static strings, no dynamic concatenation
function metricValueCls(good: boolean): string {
  return good ? "text-base font-black text-emerald-600" : "text-base font-black text-red-600";
}
function metricDeltaCls(good: boolean): string {
  return good ? "text-[9px] mono text-emerald-600" : "text-[9px] mono text-red-600";
}
function sentimentCls(sentiment: "pos" | "neg"): string {
  if (sentiment === "pos")
    return "text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200";
  return "text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200";
}
function targetCls(target: string): string {
  if (target === "L1")
    return "text-[9px] px-1.5 py-0.5 rounded mono font-bold bg-purple-100 text-purple-700";
  return "text-[9px] px-1.5 py-0.5 rounded mono font-bold bg-sky-100 text-sky-700";
}

export function AnalyticsArtifact({ metrics, keywords, candidates }: Props) {
  const openModal = useUi((s) => s.openModal);

  return (
    <div>
      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-[11px] text-purple-900 mb-2 flex items-start gap-1">
        <Icon.Help size={12} className="mt-0.5 shrink-0" />
        <span>
          发布 48h 后数据。系统已识别 {candidates.length} 个经验候选。
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-2.5">
            <div className="text-[9px] text-gray-500 uppercase">{m.name}</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <div className={metricValueCls(m.good)}>{m.value}</div>
              <div className={metricDeltaCls(m.good)}>{m.delta}</div>
            </div>
            <div className="text-[9px] text-gray-400 mono">vs 均值 {m.base}</div>
          </div>
        ))}
      </div>

      {/* Keywords card */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mt-2">
        <div className="text-[10px] uppercase text-gray-400 font-bold mb-2">评论关键词</div>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((k, i) => (
            <span key={i} className={sentimentCls(k.sentiment)}>
              {k.word}
              <span className="mono ml-1 opacity-60">×{k.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Candidates card */}
      <div className="bg-white border-2 border-amber-300 rounded-lg p-3 mt-2">
        <div className="flex justify-between mb-2">
          <div className="text-[11px] font-bold text-amber-900">
            <Icon.Flask size={12} className="mr-1 inline" />
            经验候选
          </div>
          <button
            onClick={() => openModal("sediment")}
            className="text-[10px] bg-amber-600 text-white px-2 py-1 rounded font-semibold"
          >
            去沉淀 →
          </button>
        </div>
        {candidates.map((c, i) => (
          <div
            key={i}
            className={cn(
              "bg-amber-50 border border-amber-200 rounded p-2 flex items-center gap-2",
              i < candidates.length - 1 ? "mb-1.5" : ""
            )}
          >
            <div className="flex-1">
              <div className="text-[11px] font-semibold">{c.name}</div>
              <div className="text-[10px] text-gray-600">
                {c.type} · 置信度 {c.confidence}
              </div>
            </div>
            <span className={targetCls(c.target)}>推荐 {c.target}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
