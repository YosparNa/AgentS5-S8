// 来源 PROTO lines 3882–3952 (renderBenchmarkPro + accountCard + algoBlock)
// Container-agnostic: takes `accounts` prop; no drawer/modal shell.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { Competitor } from "@/types";

interface Props {
  accounts: Competitor[];
}

// Helpers — full static strings, no dynamic concatenation
function valueScoreCls(v: number): string {
  return v >= 8 ? "text-emerald-600" : "text-amber-600";
}
function diffCls(v: number): string {
  return v >= 8 ? "text-emerald-600" : "text-amber-600";
}
function bizCls(biz: string): string {
  if (biz === "高") return "text-emerald-600";
  if (biz === "中") return "text-amber-600";
  return "text-gray-500";
}
function riskCls(risk: string): string {
  return risk === "低" ? "text-emerald-600" : "text-red-600";
}
function transCls(trans: string): string {
  return trans === "无" ? "text-emerald-600" : "text-amber-600";
}
function cardBorderCls(a: Competitor): string {
  if (a.newVid) return "border-amber-400 shadow-sm";
  if (a.alert) return "border-orange-400 shadow-sm";
  return "border-gray-200";
}

const DELTA_LABEL_MAP: Record<string, string> = {
  title: "标题",
  thumbnail: "封面",
  angle: "选题",
  duration: "时长",
  postTime: "时段",
  hook: "钩子",
  format: "形式",
  tags: "标签",
};

function AlgoBlock({ inf }: { inf: NonNullable<Competitor["inflection"]> }) {
  return (
    <details className="mb-2 mt-1" open>
      <summary className="text-[10px] font-bold text-fuchsia-700 flex items-center gap-1">
        <Icon.Sparkles size={9} />
        算法解密（拐点号专属）
        <Icon.ChevronDown size={8} className="ml-auto" />
      </summary>
      <div className="grid grid-cols-2 gap-2 mt-1.5">
        <div className="algo-col">
          <div className="text-[9px] font-bold text-emerald-600 mb-1">📈 近期爆款</div>
          <div className="text-[10px] font-semibold leading-tight">{inf.breakoutVideo}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            👁 {inf.breakoutViews} · 爆发 {inf.burstRatio}
          </div>
        </div>
        <div className="algo-col">
          <div className="text-[9px] font-bold text-gray-400 mb-1">📉 历史扑街</div>
          <div className="text-[10px] text-gray-500">中位播放 {inf.historyMedian}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">低粉判定 {inf.lowSubRatio}</div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-2 mt-2">
        <div className="text-[9px] font-bold text-gray-500 mb-1">Δ delta（变了什么）</div>
        {Object.entries(inf.delta).map(([k, v]) => (
          <div key={k} className="algo-delta">
            <span className="text-gray-400 w-9 shrink-0">{DELTA_LABEL_MAP[k] ?? k}</span>
            <span className="flex-1 text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-2 mt-2 text-[10px] text-fuchsia-900">
        <b>算法假设：</b>{inf.algoHypothesis}
      </div>
    </details>
  );
}

function AccountCard({ a }: { a: Competitor }) {
  const navigate = useNavigate();
  const [inLibrary, setInLibrary] = useState(a.pick !== false);

  return (
    <div className={cn("bg-white border rounded-lg p-3 mb-3", cardBorderCls(a))}>
      {/* Alert banner */}
      {a.alert && (
        <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-2 text-[10px] text-orange-900 flex items-center gap-2">
          <Icon.Fire size={12} className="text-orange-600" />
          <span>{a.alert}</span>
          <button
            className="ml-auto bg-orange-600 text-white text-[9px] px-2 py-0.5 rounded font-bold"
            onClick={() => navigate("/viral")}
          >
            去解构
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        <input
          type="checkbox"
          checked={inLibrary}
          onChange={e => setInLibrary(e.target.checked)}
          className="s2pick mt-1 w-3.5 h-3.5 accent-sky-600 shrink-0"
          title="勾选 = 入库"
        />
        <div className="text-2xl">{a.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[13px] font-bold truncate">{a.name}</h3>
            {a.newVid && (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold blink">
                新视频
              </span>
            )}
            {a.inflection && (
              <span className="text-[9px] bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 px-1.5 py-0.5 rounded font-bold">
                🚀 拐点信号
              </span>
            )}
          </div>
          <div className="text-[10px] text-gray-500">
            {a.plat} · {a.sub} 订阅 · 月增 {a.monthGrow}
            {a.monetize ? ` · 💰 ${a.monetize}` : ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-gray-400">对标价值</div>
          <div className={cn("text-base font-black", valueScoreCls(a.valueScore))}>
            {a.valueScore}
          </div>
        </div>
      </div>

      {/* Stat grid 1 */}
      <div className="dim-grid mb-2">
        <div><div className="num">{a.medPlay}</div><div className="lbl">中位播放</div></div>
        <div><div className="num">{a.complete}</div><div className="lbl">完播</div></div>
        <div><div className="num">{a.interact}</div><div className="lbl">互动率</div></div>
        <div><div className="num">{a.freq}</div><div className="lbl">频率</div></div>
        <div>
          <div className={cn("num", diffCls(a.diff))}>{a.diff}/10</div>
          <div className="lbl">差异度</div>
        </div>
      </div>

      {/* Stat grid 2 */}
      <div className="dim-grid mb-2">
        <div>
          <div className={cn("num", bizCls(a.biz))}>{a.biz}</div>
          <div className="lbl">商业化</div>
        </div>
        <div>
          <div className={cn("num", riskCls(a.risk))}>{a.risk}</div>
          <div className="lbl">风险</div>
        </div>
        <div>
          <div className={cn("num", transCls(a.trans))}>{a.trans}</div>
          <div className="lbl">转型</div>
        </div>
        <div>
          <div className="num text-sky-600">
            {a.sub.includes("M") ? a.sub.split("M")[0] : a.sub}
          </div>
          <div className="lbl">体量</div>
        </div>
        <div>
          <div className="num text-emerald-600">{a.monthGrow.replace("+", "")}</div>
          <div className="lbl">月增</div>
        </div>
      </div>

      {/* Algo block (inflection accounts) */}
      {a.inflection && <AlgoBlock inf={a.inflection} />}

      {/* Recent videos */}
      <details>
        <summary className="text-[10px] text-gray-600 font-bold flex items-center gap-1">
          <Icon.Video size={9} />
          近期视频 {a.recent.length} 条
          <Icon.ChevronDown size={8} className="ml-auto" />
        </summary>
        <div className="mt-1.5 space-y-1">
          {a.recent.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] bg-gray-50 rounded px-2 py-1.5">
              <span className="flex-1 truncate">{r.t}</span>
              <span className="mono text-gray-500">👁 {r.plays}</span>
              <span className="text-gray-400">{r.ago}</span>
              {r.viral && (
                <span className="bg-orange-100 text-orange-700 text-[8px] px-1 rounded font-bold">
                  爆
                </span>
              )}
            </div>
          ))}
        </div>
      </details>

      {/* Action buttons */}
      <div className="flex gap-1.5 mt-2">
        <button className="text-[10px] text-gray-500 px-2 py-1 hover:text-gray-700">移除</button>
        <button className="text-[10px] text-gray-600 px-2 py-1 hover:text-sky-600">
          <Icon.Bell size={10} className="mr-1 inline" />
          调监控
        </button>
        {a.inflection && (
          <button
            className="text-[10px] text-fuchsia-600 px-2 py-1 hover:text-fuchsia-800"
            onClick={() => navigate("/viral")}
          >
            <Icon.Sparkles size={10} className="mr-1 inline" />
            去解构
          </button>
        )}
        <button className="ml-auto bg-sky-600 hover:bg-sky-700 text-white text-[11px] px-3 py-1 rounded font-semibold">
          进档案
        </button>
      </div>
    </div>
  );
}

export function BenchmarkArtifact({ accounts }: Props) {
  return (
    <div>
      {/* Summary banner */}
      <div className="bg-sky-50 border border-sky-200 rounded p-3 text-[11px] text-sky-900 mb-3">
        <div className="font-bold mb-1">
          <Icon.Binoculars size={12} className="mr-1 inline" />
          对标账号库 · 候选 50 → 默认入库 Top 12（可勾选调整）
        </div>
        <div>
          新视频提醒 <b>3</b> · 爆款待解构 <b>2</b> · 拐点号 <b>1</b>（CodeWithLeo）· 转型预警 <b>1</b>（Theo）
        </div>
      </div>

      {/* Account cards */}
      {accounts.map(a => (
        <AccountCard key={a.name} a={a} />
      ))}

      {/* Footer button */}
      <button className="w-full bg-white border border-dashed border-gray-300 rounded-lg p-3 text-[11px] text-gray-500 hover:border-sky-400 hover:text-sky-600 mt-2">
        <Icon.Plus size={10} className="mr-1 inline" />
        + 7 个对标账号（已默认入库）
      </button>
    </div>
  );
}
