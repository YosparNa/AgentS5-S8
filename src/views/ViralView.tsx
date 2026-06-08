// ViralView — 还原 09index-v7.html #view-viral (PROTO 3052–3230);切片 F2
// Data via dataProvider only — NO direct src/data/* imports.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataProvider } from "@/services/dataProvider";
import { useUi } from "@/store/uiStore";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import type { ViralSample, ViralCandidateRule, ViralThumbTone, ViralChipTone, ViralType } from "@/types";

// ── Enum-key → full static Tailwind class strings (guardrail #9) ──────────────

const viralThumbClass: Record<ViralThumbTone, string> = {
  purple:  "from-purple-700 to-indigo-900",
  rose:    "from-rose-600 to-orange-700",
  emerald: "from-emerald-600 to-teal-800",
  pink:    "from-pink-600 to-fuchsia-800",
  gray:    "from-gray-700 to-gray-900",
  indigo:  "from-indigo-600 to-purple-800",
};

const viralChipClass: Record<ViralChipTone, string> = {
  blue:    "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  purple:  "bg-purple-50 text-purple-700",
  amber:   "bg-amber-50 text-amber-700",
  indigo:  "bg-indigo-50 text-indigo-700",
};

const recommendToneClass: Record<"L1" | "L2", string> = {
  L1: "bg-purple-100 text-purple-700",
  L2: "bg-sky-100 text-sky-700",
};

// ── Filter keys (matches prototype pill row) ──────────────────────────────────

type ViralFilterKey = "all" | ViralType;

// Counts are derived from live data (G1) — never hardcoded, so the pill labels
// always match the number of samples actually rendered.
const FILTER_DEFS: { key: ViralFilterKey; label: string }[] = [
  { key: "all",         label: "全部"   },
  { key: "topic",       label: "选题型" },
  { key: "performance", label: "表现型" },
  { key: "content",     label: "内容型" },
  { key: "viral",       label: "病毒型" },
  { key: "longtail",    label: "长尾型" },
];

export function ViralView() {
  const navigate = useNavigate();
  const { openModal } = useUi();

  const [samples, setSamples]   = useState<ViralSample[]>([]);
  const [rules, setRules]       = useState<ViralCandidateRule[]>([]);
  const [filter, setFilter]     = useState<ViralFilterKey>("all");

  useEffect(() => {
    dataProvider.listViralSamples().then(setSamples);
    dataProvider.listViralCandidateRules().then(setRules);
  }, []);

  const filtered = filter === "all"
    ? samples
    : samples.filter((s) => s.typeKey === filter);

  const filterCount = (key: ViralFilterKey) =>
    key === "all" ? samples.length : samples.filter((s) => s.typeKey === key).length;

  return (
    <section className="h-full flex overflow-hidden bg-white">
      <div className="flex flex-1 overflow-hidden h-full">

        {/* ── Main column ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header (PROTO 3055–3090) */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-200 px-6 py-4 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => navigate("/workbench")}
                    className="text-[11px] text-gray-500 hover:text-indigo-600 flex items-center"
                  >
                    <Icon.ArrowLeft className="w-[10px] h-[10px] mr-1" />
                    返回工作台
                  </button>
                  <span className="text-gray-300">|</span>
                  <h1 className="text-[20px] font-black tracking-tight">爆款解构</h1>
                  <span className="bg-orange-200 text-orange-900 text-[10px] font-bold px-1.5 py-0.5 rounded mono">S2.5</span>
                  <span className="layer-pill layer-channel text-[10px] font-bold px-1.5 py-0.5 rounded">L2 频道级</span>
                </div>
                <p className="text-[12px] text-gray-600">
                  从对标账号 + 本号视频里发现的爆款样本，自动 6 维解构 → 沉淀为可复用规律
                </p>
              </div>

              {/* Right stats */}
              <div className="flex items-center gap-2">
                <div className="text-right text-[11px]">
                  <div className="text-gray-500">本月样本</div>
                  <div className="text-2xl font-black text-orange-600">{samples.length}</div>
                </div>
                <div className="w-px h-10 bg-orange-200" />
                <div className="text-right text-[11px]">
                  <div className="text-gray-500">候选规则</div>
                  <div className="text-2xl font-black text-purple-600">{rules.length}</div>
                </div>
                <div className="w-px h-10 bg-orange-200" />
                <div className="text-right text-[11px]">
                  <div className="text-gray-500">已升级 L1</div>
                  <div className="text-2xl font-black text-emerald-600">2</div>
                </div>
              </div>
            </div>

            {/* Filter pills + selects (PROTO 3076–3089) */}
            <div className="flex items-center justify-between mt-4 gap-3">
              <div className="flex gap-1 text-[11px] font-semibold">
                {FILTER_DEFS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={
                      filter === f.key
                        ? "px-2.5 py-1 rounded-full bg-orange-600 text-white"
                        : "px-2.5 py-1 rounded-full bg-white border border-orange-200 hover:bg-orange-50"
                    }
                  >
                    {f.label} {filterCount(f.key)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <select className="bg-white border border-orange-200 rounded px-2 py-1">
                  <option>近 30 天</option>
                  <option>近 7 天</option>
                  <option>近 90 天</option>
                </select>
                <select className="bg-white border border-orange-200 rounded px-2 py-1">
                  <option>所有对标账号</option>
                  <option>Matt Wolfe</option>
                  <option>Ali Abdaal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* Alert banner (PROTO 3093–3100) */}
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
              <Icon.Bell className="text-red-500 w-[18px] h-[18px] shrink-0" />
              <div className="flex-1">
                <div className="text-[12px] font-bold text-red-900">2 个新爆款待解构</div>
                <div className="text-[10px] text-red-700 mt-0.5">
                  Matt Wolfe 6h 前的视频已达爆款阈值（24h 播放 = 该号月均 3.2 倍），点开始自动 6 维解构
                </div>
              </div>
              <button className="bg-red-600 text-white text-[11px] px-3 py-1.5 rounded-lg font-semibold shrink-0">
                立即解构
              </button>
            </div>

            {/* Card grid (PROTO 3102–3174) */}
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((sample) => (
                <div
                  key={sample.id}
                  className="viral-card"
                  onClick={() => openModal("viral", sample.id)}
                >
                  <div className={cn("viral-thumb bg-gradient-to-br", viralThumbClass[sample.thumbTone])}>
                    <span className="viral-tag">{sample.type}</span>
                    <span className="viral-score">{sample.score}</span>
                    <div className="viral-play">
                      <span>👁 {sample.views}</span>
                      <span>👍 {sample.likes}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-[12px] font-bold mb-1 line-clamp-2">{sample.title}</div>
                    <div className="text-[10px] text-gray-500 mb-2">
                      {sample.author} · {sample.meta}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sample.chips.map((chip, i) => (
                        <span
                          key={i}
                          className={cn("text-[9px] px-1.5 py-0.5 rounded", viralChipClass[chip.tone])}
                        >
                          {chip.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right aside: 候选规则 (PROTO 3179–3228) ──────────────────────── */}
        <aside className="w-[340px] bg-amber-50/30 border-l border-amber-200 flex flex-col shrink-0">

          {/* Aside header */}
          <div className="px-4 py-3 bg-white border-b border-amber-200">
            <h2 className="text-[13px] font-bold flex items-center gap-2">
              <Icon.Flask className="text-amber-600 w-[13px] h-[13px]" />
              候选规则 · 待入库
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              解构后跨样本归纳的规律，由你拍板归到 L1 或 L2
            </p>
          </div>

          {/* Rule cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {rules.map((rule) => (
              <CandidateRuleCard key={rule.id} rule={rule} />
            ))}

            {/* Trailing placeholder */}
            <div className="bg-amber-50 border border-dashed border-amber-300 rounded-lg p-3 text-center">
              <Icon.Flask className="text-amber-400 w-[18px] h-[18px] mx-auto mb-1" />
              <div className="text-[11px] text-amber-700">还在积累中的潜在规律</div>
              <div className="text-[10px] text-amber-600 mt-1">需 3+ 样本才生成候选</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ── Candidate rule card (PROTO 3185–3220) ─────────────────────────────────────

function CandidateRuleCard({ rule }: { rule: ViralCandidateRule }) {
  const isL1 = rule.recommend === "L1";

  return (
    <div className="bg-white border-2 border-amber-300 rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <span className="mono text-[11px] font-bold text-amber-900">{rule.code} 候选</span>
        <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold mono", recommendToneClass[rule.recommend])}>
          推荐 {rule.recommend}
        </span>
      </div>
      <h3 className="text-[13px] font-bold mb-2">{rule.title}</h3>
      <div className="text-[10px] text-gray-600 mb-2 leading-relaxed">{rule.desc}</div>

      {/* Validation box */}
      <div className="bg-amber-50 rounded p-2 text-[10px] mb-2">
        <div className="text-amber-800">
          <b>验证：</b>{rule.validation}
        </div>
        {rule.samples && rule.samples.length > 0 && (
          <div className="text-amber-800 mt-1">
            <b>样本：</b>
            {rule.samples.map((s) => (
              <span key={s} className="bg-white px-1 rounded mr-0.5">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5">
        {isL1 ? (
          <>
            <button className="flex-1 bg-purple-600 text-white text-[10px] py-1.5 rounded font-semibold">
              升级 L1 中央
            </button>
            <button className="flex-1 bg-sky-100 text-sky-700 text-[10px] py-1.5 rounded font-semibold">
              降级 L2 本号
            </button>
            <button className="text-[10px] text-gray-500 px-2">忽略</button>
          </>
        ) : (
          <>
            <button className="flex-1 bg-purple-200 text-purple-700 text-[10px] py-1.5 rounded font-semibold">
              升级 L1（不推荐）
            </button>
            <button className="flex-1 bg-sky-600 text-white text-[10px] py-1.5 rounded font-semibold">
              归 L2 本号
            </button>
          </>
        )}
      </div>
    </div>
  );
}
