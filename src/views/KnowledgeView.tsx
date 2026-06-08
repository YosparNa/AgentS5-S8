// KnowledgeView — 还原 09index #view-knowledge(行 2514–2562);切片 F1
import { useEffect, useState } from "react";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";
import type { KnowledgeRule, KnowledgeCategory, KnowledgeRuleCandidate } from "@/types";

// Enum-key → filter label (guardrail #9: no dynamic class strings)
type CategoryFilter = "all" | KnowledgeCategory;

const CATEGORY_FILTERS: CategoryFilter[] = ["all", "title", "hook", "script", "storyboard"];

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all:        "全部",
  title:      "标题规则",
  hook:       "钩子规则",
  script:     "脚本结构",
  storyboard: "分镜技能",
  other:      "其他",
};

export function KnowledgeView() {
  const [rules, setRules] = useState<KnowledgeRule[]>([]);
  const [candidates, setCandidates] = useState<KnowledgeRuleCandidate[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    dataProvider.listKnowledgeItems().then(setRules);
    dataProvider.listKnowledgeCandidates().then(setCandidates);
  }, []);

  const filteredRules =
    filter === "all" ? rules : rules.filter((r) => r.category === filter);

  const countOf = (k: CategoryFilter) =>
    k === "all" ? rules.length : rules.filter((r) => r.category === k).length;

  const removeCandidate = (id: string) =>
    setCandidates((prev) => prev.filter((c) => c.id !== id));

  return (
    <section className="h-full overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto p-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[20px] font-black mb-1 flex items-center gap-2">
              中央经验库
              <span className="layer-pill layer-central text-[10px] font-bold px-1.5 py-0.5 rounded">
                L1
              </span>
            </h2>
            <p className="text-[12px] text-gray-500">
              跨频道复用的"行业经验"。所有频道的 L3 视频自动调用。
            </p>
          </div>
          <button className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5">
            <Icon.Plus size={10} />
            添加规则
          </button>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-1 mb-4 text-[12px] font-semibold">
          {CATEGORY_FILTERS.map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={
                filter === k
                  ? "px-3 py-1.5 rounded-full bg-purple-600 text-white"
                  : "px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100"
              }
            >
              {CATEGORY_LABELS[k]} {countOf(k)}
            </button>
          ))}
        </div>

        {/* Grid: rule cards + candidate cards */}
        <div className="grid grid-cols-2 gap-3">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border border-purple-100 rounded-xl p-4 hover:border-purple-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="mono text-[11px] font-bold text-purple-900">{rule.code}</span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                  {rule.metric}
                </span>
              </div>
              <h3 className="text-[14px] font-bold mb-1">{rule.title}</h3>
              <p className="text-[11px] text-gray-600 mb-2">{rule.desc}</p>
              <div className="text-[10px] text-gray-500">{rule.meta}</div>
            </div>
          ))}

          {/* Candidate cards — only show when filter is "all" */}
          {filter === "all" &&
            candidates.map((c) => (
              <div
                key={c.id}
                className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4"
              >
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-amber-700">
                  <Icon.Flask size={10} />
                  候选规则（待人工确认入库）
                </div>
                <h3 className="text-[13px] font-bold mb-1">{c.title}</h3>
                <p className="text-[11px] text-amber-900 mb-2">{c.desc}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => removeCandidate(c.id)}
                    className="bg-amber-600 text-white text-[10px] px-2 py-1 rounded font-semibold"
                  >
                    入库
                  </button>
                  <button
                    onClick={() => removeCandidate(c.id)}
                    className="bg-white border border-amber-200 text-amber-700 text-[10px] px-2 py-1 rounded"
                  >
                    忽略
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
