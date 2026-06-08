// 来源 PROTO lines 3811–3879 (renderHotPro + hotCard)
// Container-agnostic: takes `hotspots` prop; no drawer/modal shell.
// Reuses ui/Spark for sparkline (props: trend: number[], stroke?: string).

import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { Spark } from "@/components/ui/Spark";
import type { Hotspot } from "@/types";

interface Props {
  hotspots: Hotspot[];
}

// Score color helpers — full static strings
function scoreCls(score: number): string {
  if (score >= 30) return "text-emerald-600";
  if (score >= 28) return "text-amber-600";
  return "text-gray-500";
}
function dnaFitCls(v: number): string {
  return v >= 7 ? "text-emerald-600" : "text-amber-600";
}
function dimCls(v: number): string {
  return v >= 7 ? "text-emerald-600" : "text-amber-600";
}
function compStatusCls(a: string): string {
  if (a === "已做") return "text-emerald-600";
  if (a === "在做") return "text-amber-600";
  return "text-gray-400";
}

function HotCard({ h }: { h: Hotspot }) {
  return (
    <div className="hot-card mb-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <input
            type="checkbox"
            className="s4pick mt-1 w-3.5 h-3.5 accent-indigo-600 shrink-0"
            title="勾选 = 采纳入池"
          />
          <span className="text-2xl">{h.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-bold leading-tight">{h.title}</h3>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {h.srcs.map(s => (
                <span key={s} className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded mono">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={cn("text-2xl font-black", scoreCls(h.score))}>{h.score}</div>
          <div className="text-[9px] text-gray-400 mono">/40</div>
          {h.dnaFit ? (
            <div className={cn("text-[9px] mt-1", dnaFitCls(h.dnaFit))}>
              DNA {h.dnaFit}/10
            </div>
          ) : null}
          {h.expire ? (
            <div className="text-[9px] text-orange-500 mono">
              <Icon.Clock size={9} className="inline mr-0.5" />
              {h.expire}
            </div>
          ) : null}
        </div>
      </div>

      {/* Sparkline + peak label */}
      <div className="flex items-center gap-2 mb-3">
        <Spark trend={h.trend} stroke="#f97316" />
        <span className="text-[10px] text-orange-700 font-semibold">{h.peak}</span>
      </div>

      {/* 4-dim grid */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-[10px]">
        <div className="bg-gray-50 rounded p-1.5 text-center">
          <div className="font-bold text-emerald-600">{h.dims[0]}</div>
          <div className="text-gray-500 text-[9px]">时效</div>
        </div>
        <div className="bg-gray-50 rounded p-1.5 text-center">
          <div className="font-bold text-emerald-600">{h.dims[1]}</div>
          <div className="text-gray-500 text-[9px]">相关</div>
        </div>
        <div className="bg-gray-50 rounded p-1.5 text-center">
          <div className={cn("font-bold", dimCls(h.dims[2]))}>{h.dims[2]}</div>
          <div className="text-gray-500 text-[9px]">差异</div>
        </div>
        <div className="bg-gray-50 rounded p-1.5 text-center">
          <div className={cn("font-bold", dimCls(h.dims[3]))}>{h.dims[3]}</div>
          <div className="text-gray-500 text-[9px]">商业</div>
        </div>
      </div>

      {/* Competitors details */}
      <details className="mb-2">
        <summary className="text-[10px] font-bold text-gray-600 mb-1 flex items-center gap-1">
          <Icon.Binoculars size={9} />
          对标动向（{h.competitors.length}）
          <Icon.ChevronDown size={8} className="ml-auto" />
        </summary>
        <div className="mt-1.5 space-y-1">
          {h.competitors.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] bg-gray-50 rounded px-2 py-1">
              <span>
                <span className="font-semibold">{c.n}</span>
                {" · "}
                <span className={compStatusCls(c.a)}>{c.a}</span>
                {c.t ? <span className="text-gray-400"> {c.t}</span> : null}
              </span>
              {c.type ? <span className="text-gray-500">{c.type}</span> : null}
            </div>
          ))}
        </div>
      </details>

      {/* AI recommended angle */}
      <div className="bg-indigo-50 border border-indigo-100 rounded p-2 mb-2">
        <div className="text-[10px] font-bold text-indigo-900 mb-1 flex items-center gap-1">
          <Icon.Sparkles size={9} className="text-indigo-600" />
          AI 推荐角度
        </div>
        <div className="text-[11px] text-indigo-800 leading-relaxed">{h.angle}</div>
      </div>

      {/* Suggested titles */}
      {h.titles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded p-2 mb-2">
          <div className="text-[10px] font-bold text-gray-600 mb-1">
            <Icon.Heading size={9} className="mr-1 inline" />
            建议标题（{h.titles.length}）
          </div>
          {h.titles.map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] py-0.5">
              <span className="text-[8px] text-indigo-400 shrink-0">◉</span>
              <span className="flex-1">{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Risk */}
      <div className="text-[10px] text-red-600 mb-3 flex items-center gap-1">
        <Icon.Warning size={9} />
        {h.risk}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5">
        <button className="text-[10px] text-gray-500 px-2 py-1 hover:text-gray-700">忽略</button>
        <button className="text-[10px] text-gray-600 px-2 py-1 hover:text-indigo-600">
          <Icon.Bookmark size={10} className="mr-1 inline" />
          收藏
        </button>
        <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold py-1.5 rounded">
          <Icon.Rocket size={10} className="mr-1 inline" />
          启动 L3 选题
        </button>
      </div>
    </div>
  );
}

export function HotspotArtifact({ hotspots }: Props) {
  return (
    <div>
      {/* Summary banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 mb-3">
        <div className="font-bold mb-1">
          <Icon.Megaphone size={12} className="mr-1 inline" />
          今晨 06:00 抓取 · 共扫描 487 条信号 · 过滤后精选 5 条
        </div>
        <div>本频道赛道相关 38 条 · 去重 -12 · 禁区拦截 -3 · 评分 ≥ 28 入选 5 条</div>
      </div>

      {/* Hot cards */}
      {hotspots.map((h, i) => (
        <HotCard key={i} h={h} />
      ))}

      {/* Footer button */}
      <button className="w-full bg-white border border-dashed border-gray-300 rounded-lg p-3 text-[11px] text-gray-500 hover:border-amber-400 hover:text-amber-600 mt-2">
        <Icon.Clock size={10} className="mr-1 inline" />
        查看历史抓取（含未入选的 482 条）
      </button>
    </div>
  );
}
