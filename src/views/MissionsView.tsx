// MissionsView — 还原 09index #view-missions(行 531–595);切片 F1
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";
import type { MissionListRow, MissionStatus } from "@/types";

// Enum-key → full static Tailwind class strings (guardrail #9)
const missionStatusClass: Record<MissionStatus, string> = {
  running:   "bg-indigo-50 text-indigo-700 text-[10px] px-1.5 rounded",
  review:    "bg-amber-50 text-amber-700 text-[10px] px-1.5 rounded",
  published: "bg-emerald-50 text-emerald-700 text-[10px] px-1.5 rounded",
  risk:      "bg-red-50 text-red-700 text-[10px] px-1.5 rounded",
  draft:     "bg-gray-50 text-gray-600 text-[10px] px-1.5 rounded",
};

const missionStatusLabel: Record<MissionStatus, string> = {
  running:   "运行中",
  review:    "待终审",
  published: "已发布",
  risk:      "有风险",
  draft:     "草稿",
};

const auditToneClass: Record<"ok" | "risk" | "muted", string> = {
  ok:    "mono text-emerald-600",
  risk:  "mono text-red-600",
  muted: "mono text-gray-400",
};

type FilterKey = "all" | MissionStatus;

const FILTER_KEYS: FilterKey[] = ["all", "running", "review", "published", "risk", "draft"];
const FILTER_LABELS: Record<FilterKey, string> = {
  all:       "全部",
  running:   "运行中",
  review:    "待终审",
  published: "已发布",
  risk:      "有风险",
  draft:     "草稿",
};

export function MissionsView() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<MissionListRow[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    dataProvider.listMissions().then(setRows);
  }, []);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  // Derive counts from loaded data
  const countOf = (k: FilterKey) =>
    k === "all" ? rows.length : rows.filter((r) => r.status === k).length;

  return (
    <section className="h-full overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto p-8 w-full">
        <h2 className="text-[20px] font-black mb-1">全部视频任务 L3</h2>
        <p className="text-[12px] text-gray-500 mb-6">
          跨频道的所有 L3 视频任务汇总。可按频道、状态、阶段筛选。
        </p>

        {/* Filter pill row */}
        <div className="flex gap-1 mb-4 text-[12px] font-semibold">
          {FILTER_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={
                filter === k
                  ? "px-3 py-1.5 rounded-full bg-indigo-600 text-white"
                  : "px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100"
              }
            >
              {FILTER_LABELS[k]} {countOf(k)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5">任务</th>
                <th className="text-left px-4 py-2.5">频道</th>
                <th className="text-left px-4 py-2.5">阶段</th>
                <th className="text-left px-4 py-2.5">已过审核</th>
                <th className="text-left px-4 py-2.5">状态</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate("/workbench")}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-semibold">{row.title}</td>
                  <td className="px-4 py-3 text-gray-600">{row.channel}</td>
                  <td className="px-4 py-3 mono">{row.stage}</td>
                  <td className={`px-4 py-3 ${auditToneClass[row.auditTone ?? "muted"]}`}>
                    {row.audit}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`${missionStatusClass[row.status]}${row.blink ? " blink" : ""}`}>
                      {missionStatusLabel[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Icon.ChevronRight size={12} className="text-gray-300 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
