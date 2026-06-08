// SearchFlow — search box + streaming-log panel.
// Reproduces PROTO 665–713 + doRadarSearch / closeRadarSearch (2391–2444).
// Timer refs are cleaned up on unmount and on every new search run.
import { useEffect, useRef, useState } from "react";
import type { RadarCluster, RadarSearchResult } from "@/types/ideas";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";
import { RadarResultCard } from "./RadarResultCard";

type Phase = "idle" | "scanning" | "done" | "empty";

interface LogLine {
  id: number;
  html: string; // text only, rendered via className coloring
  text: string;
  variant: "gray" | "emerald";
}

interface Props {
  onSink: (cluster: RadarCluster) => void;
}

let _lineId = 0;

export function SearchFlow({ onSink }: Props) {
  const [keyword, setKeyword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [result, setResult] = useState<RadarSearchResult | null>(null);
  const [sunkKeys, setSunkKeys] = useState<Set<string>>(new Set());

  // All pending timer ids — cleared on new search + unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  async function runSearch(q: string) {
    clearTimers();
    const trimmed = q.trim();

    if (!trimmed) {
      setKeyword("(空)");
      setPhase("empty");
      setLogLines([]);
      setResult(null);
      return;
    }

    setKeyword(trimmed);
    setPhase("scanning");
    setLogLines([]);
    setResult(null);

    // Fetch result immediately (mock is sync but wrapped in Promise)
    const res = await dataProvider.searchTracks(trimmed);

    // Build the 8 streaming log lines from PROTO 2418–2427
    const lines: Array<{ t: number; text: string; variant: "gray" | "emerald" }> = [
      { t: 250,  text: `> 全网抓取 YouTube / TikTok 近 90d「${trimmed}」相关视频 …`, variant: "gray" },
      { t: 550,  text: `✓ 命中 ${res.raw.toLocaleString()} 条原始视频 · ${res.creatorsScanned} 个博主`, variant: "emerald" },
      { t: 800,  text: "> LLM 聚类归并相似选题 …", variant: "gray" },
      { t: 1050, text: `✓ 收敛为 ${res.clusters.length} 个候选赛道簇`, variant: "emerald" },
      { t: 1280, text: "> 数据评分:RPM × 爆款密度 × 起号窗口 × 供需差 …", variant: "gray" },
      { t: 1520, text: "✓ 4 维打分完成 · 套用首屏排行榜同一评分模型", variant: "emerald" },
      { t: 1720, text: "> 比对 68 个在监控赛道(去重)…", variant: "gray" },
      { t: 1920, text: `✓ ${res.newCount} 个全新赛道 · ${res.pooledCount} 个已在监控池`, variant: "emerald" },
    ];

    lines.forEach(({ t, text, variant }) => {
      const tid = setTimeout(() => {
        setLogLines((prev) => [
          ...prev,
          { id: _lineId++, html: text, text, variant },
        ]);
      }, t);
      timersRef.current.push(tid);
    });

    // At 2120 ms: switch to done + show results
    const doneTid = setTimeout(() => {
      setResult(res);
      setPhase("done");
    }, 2120);
    timersRef.current.push(doneTid);
  }

  function handleSink(key: string) {
    setSunkKeys((prev) => new Set([...prev, key]));
    const cluster = result?.clusters.find((c) => c.key === key);
    if (cluster) onSink(cluster);
  }

  function handleClose() {
    clearTimers();
    setKeyword("");
    setPhase("idle");
    setLogLines([]);
    setResult(null);
    setSunkKeys(new Set());
  }

  const HOT_CHIPS = [
    { label: "老年话题", q: "老年自媒体" },
    { label: "存钱挑战", q: "存钱挑战" },
    { label: "单亲妈妈", q: "单亲妈妈" },
    { label: "小语种学习", q: "小语种学习" },
  ];

  return (
    <>
      {/* ── Search box (PROTO 665–678) ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex items-center gap-2">
        <Icon.Search className="text-gray-400 w-[12px] h-[12px] ml-1 shrink-0" />
        <input
          type="text"
          value={keyword === "(空)" ? "" : phase === "idle" ? keyword : keyword}
          placeholder="找不到合适的? 搜索更多赛道 — 试试 '宠物训练' '存钱挑战' '老年自媒体'..."
          className="flex-1 text-[12px] border-0 focus:outline-none placeholder:text-gray-400"
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch(keyword);
          }}
        />
        <div className="flex items-center gap-1 text-[10px] text-gray-500 shrink-0">
          <span>热门:</span>
          {HOT_CHIPS.map((chip) => (
            <button
              key={chip.q}
              onClick={() => {
                setKeyword(chip.q);
                runSearch(chip.q);
              }}
              className="bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 rounded px-1.5 py-0.5"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => runSearch(keyword)}
          className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded font-semibold shrink-0"
        >
          搜索
        </button>
      </div>

      {/* hint line */}
      <p className="text-[10px] text-gray-400 mb-3 -mt-1 pl-1">
        搜到的新赛道经 LLM 聚类 + 数据评分后会沉淀进监控池,排进首屏排行榜
      </p>

      {/* ── Search-flow panel (hidden when idle) ─────────────────────────── */}
      {phase !== "idle" && (
        <div className="mb-4">
          <div className="bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">

            {/* header status bar */}
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-indigo-50/40">
              <div className="flex items-center gap-2">
                <Icon.SatelliteDish className="text-indigo-600 w-[12px] h-[12px]" />
                <span className="text-[11px] text-gray-500">搜索:</span>
                <span className="text-[13px] font-bold text-indigo-700">
                  {keyword}
                </span>
                {phase === "scanning" && (
                  <span className="ml-2 text-[10px] text-amber-600 font-semibold">
                    扫描中...
                  </span>
                )}
                {phase === "done" && (
                  <span className="ml-2 text-[10px] text-emerald-600 font-semibold">
                    完成 ✓
                  </span>
                )}
                {phase === "empty" && (
                  <span className="ml-2 text-[10px] text-gray-400 font-semibold">
                    请输入关键词
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="text-[11px] text-gray-500 hover:text-rose-600 flex items-center gap-1"
              >
                <Icon.Close className="w-[10px] h-[10px]" />
                清除搜索
              </button>
            </div>

            {/* loading log */}
            {logLines.length > 0 && (
              <div className="px-4 py-3 text-[11px] font-mono space-y-1.5 bg-gray-50/50">
                {logLines.map((line) => (
                  <div
                    key={line.id}
                    className={
                      line.variant === "emerald"
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }
                  >
                    {line.text}
                  </div>
                ))}
              </div>
            )}

            {/* results area */}
            {phase === "done" && result && result.clusters.length > 0 && (
              <div>
                <div className="px-4 py-2 border-b border-gray-100 text-[11px] text-gray-600 bg-emerald-50/40">
                  <Icon.CircleCheck className="text-emerald-600 w-[11px] h-[11px] inline mr-1" />
                  为 "
                  <b className="text-gray-900">{keyword}</b>" 找到{" "}
                  <b className="text-indigo-700">{result.clusters.length}</b>{" "}
                  个候选新赛道 · 按综合分排序 · 与首屏排行榜同一评分逻辑
                </div>
                <div className="p-3 space-y-2">
                  {result.clusters.map((c) => (
                    <RadarResultCard
                      key={c.key}
                      cluster={c}
                      onSink={handleSink}
                      sunk={sunkKeys.has(c.key)}
                    />
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/40 text-[10px] text-gray-500 flex items-center justify-between">
                  <span>
                    点{" "}
                    <b className="text-fuchsia-700">📥 沉淀进监控池</b> = 加入首屏每日排行榜 + 系统持续 daily snapshot · 点{" "}
                    <b className="text-indigo-700">详情</b> = 打开赛道抽屉
                  </span>
                  <span className="font-mono">配额 ~3 units · 用时 1.9s</span>
                </div>
              </div>
            )}

            {/* empty state */}
            {phase === "empty" && (
              <div className="px-6 py-8 text-center text-[12px] text-gray-500">
                <Icon.Help className="text-gray-300 w-[24px] h-[24px] mx-auto mb-2" />
                未找到强匹配 — 试试更具体的关键词,如{" "}
                <b>「X 用户群体 + 内容形式」</b>
                （例:"老年人 + 生活记录"）
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
