// AnalyticsView — 还原 09index #view-analytics(行 2565–2586);切片 F1
import { useEffect, useState } from "react";
import { dataProvider } from "@/services/dataProvider";
import type { AnalyticsSummary, DeltaTone, BarTone } from "@/types";

// Enum-key → full static Tailwind class strings (guardrail #9)
const deltaToneClass: Record<DeltaTone, string> = {
  up:   "text-[10px] text-emerald-600 mt-1",
  down: "text-[10px] text-red-600 mt-1",
  flat: "text-[10px] text-amber-600 mt-1",
};

const barToneClass: Record<BarTone, string> = {
  indigo:  "h-full bg-indigo-500",
  pink:    "h-full bg-pink-500",
  emerald: "h-full bg-emerald-500",
  amber:   "h-full bg-amber-500",
};

const EMPTY: AnalyticsSummary = { kpis: [], contributions: [] };

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsSummary>(EMPTY);

  useEffect(() => {
    dataProvider.getAnalytics().then(setData);
  }, []);

  return (
    <section className="h-full overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto p-8 w-full">
        <h2 className="text-[20px] font-black mb-1">跨频道数据看板</h2>
        <p className="text-[12px] text-gray-500 mb-6">
          L1 视角的全工作区 KPI · 各频道横向对比
        </p>

        {/* KPI tiles grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {data.kpis.map((kpi, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-[10px] text-gray-500 uppercase">{kpi.label}</div>
              <div className="text-2xl font-black mt-1">{kpi.value}</div>
              <div className={deltaToneClass[kpi.deltaTone]}>{kpi.delta}</div>
            </div>
          ))}
        </div>

        {/* Channel contribution card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="text-[12px] font-bold mb-3">各频道贡献</div>
          <div className="space-y-2">
            {data.contributions.map((ch, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-32 text-[11px]">
                  {ch.emoji} {ch.name}
                </div>
                <div className="flex-1 h-3 bg-gray-100 rounded overflow-hidden">
                  {/* inline style for width pct is permitted (only class names must be static) */}
                  <div
                    className={barToneClass[ch.barTone]}
                    style={{ width: `${ch.pct}%` }}
                  />
                </div>
                <div className="w-20 text-right text-[11px] mono">{ch.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* D-B fill: 近 7 日趋势 mini table */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] font-bold mb-3">近 7 日趋势概览</div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day, i) => {
              const vals = [4800, 5100, 4600, 5900, 6200, 7400, 4400];
              const maxVal = 7400;
              const pct = Math.round((vals[i] / maxVal) * 100);
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div className="w-full h-16 bg-gray-100 rounded flex items-end overflow-hidden">
                    <div
                      className="w-full bg-indigo-400 rounded-t"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-gray-500">{day}</div>
                  <div className="text-[9px] mono text-gray-700">
                    {(vals[i] / 1000).toFixed(1)}K
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
