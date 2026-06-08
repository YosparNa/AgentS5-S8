// ViralModal — Task F3.
// Opens when activeModal === 'viral'. Shows 6-dim viral teardown for a ViralSample.
// Overlay uses .modal-mask / .modal-mask.show (z-50), stacks above the drawer (z-40).
import { useState, useEffect } from "react";
import type { ViralSample } from "@/types";
import { useUi } from "@/store/uiStore";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

// ── Dim block definition ───────────────────────────────────────────────────────

interface DimBlockDef {
  num: string;
  title: string;
  headerClass: string;
  content: (title: string) => React.ReactNode;
}

const DIM_BLOCKS: DimBlockDef[] = [
  {
    num: "1",
    title: "选题反推",
    headerClass: "bg-amber-100 text-amber-800",
    content: () => (
      <>
        <p className="mb-2"><b>为什么爆？</b>切中独立开发者最纠结的工具决策，"100 小时实操"承诺极致深度。</p>
        <p className="mb-2"><b>时机点：</b>发布于 Cursor 收购 Supermaven 当天，搭热点。</p>
        <p><b>差异化：</b>其它账号都做"5 分钟体验"，这条是"100 小时血泪"，时间维度的反差。</p>
      </>
    ),
  },
  {
    num: "2",
    title: "标题封面分析",
    headerClass: "bg-blue-100 text-blue-800",
    content: (videoTitle) => (
      <>
        <p className="mb-2"><b>标题：</b>"{videoTitle}"</p>
        <ul className="list-disc list-inside text-[10px] space-y-0.5 mb-2">
          <li>数字（100）触发心理锚定</li>
          <li>"the truth" 制造悬念</li>
          <li>反共识：暗示真相 vs 营销</li>
        </ul>
        <p><b>封面：</b>本人面对相机 + 红色"100"大字 + 倦怠表情 + 背景代码屏</p>
        <p className="text-[10px] text-purple-700 mt-2">→ 候选规则 <b>Rule_Title_05</b>："数字 + 时长 + 反共识"</p>
      </>
    ),
  },
  {
    num: "3",
    title: "脚本结构",
    headerClass: "bg-green-100 text-green-800",
    content: () => (
      <>
        <p className="mb-2"><b>前 5 秒：</b>"100 hours later, I have a confession" — 钩子 + 悬念</p>
        <p className="mb-2"><b>章节节奏：</b>0-30s 钩子 → 30s-3min 起源 → 3-7min 深度演示 → 7-9min 转折"但是..." → 9-11min CTA</p>
        <p className="mb-2"><b>危机点：</b>共 4 个，每 2-3 分钟一次"等等先告诉你..."</p>
        <p><b>高潮位：</b>78% 处 — 揭示"真相"，比传统 70% 略后</p>
      </>
    ),
  },
  {
    num: "4",
    title: "视听节奏",
    headerClass: "bg-pink-100 text-pink-800",
    content: () => (
      <>
        <p className="mb-2"><b>平均镜头时长：</b>4.2 秒（行业 5-8s）→ 高密度</p>
        <p className="mb-2"><b>B-roll 占比：</b>61% · 大量代码截图 + UI 演示</p>
        <p className="mb-2"><b>转场：</b>主要硬切 + 关键节点闪白</p>
        <p><b>字幕：</b>关键词突出强调色（橙/红）</p>
        <p className="text-[10px] text-purple-700 mt-2">→ 候选规则 <b>Skill_Cut_03</b>："每 8 秒一个跳切"</p>
      </>
    ),
  },
  {
    num: "5",
    title: "发布时机",
    headerClass: "bg-indigo-100 text-indigo-800",
    content: () => (
      <>
        <p className="mb-2"><b>发布时间：</b>周二 21:00 EST</p>
        <p className="mb-2"><b>搭热点：</b>Cursor 收购 Supermaven 公告 6h 后</p>
        <p><b>本号最佳时段：</b>过去 10 条爆款均在周二/周四 20:00-22:00</p>
      </>
    ),
  },
  {
    num: "6",
    title: "评论情绪",
    headerClass: "bg-amber-100 text-amber-900",
    content: () => (
      <>
        <p className="mb-2"><b>正向高频：</b>"thanks", "exactly what I needed", "saving 100 hours"</p>
        <p className="mb-2"><b>负向高频：</b>"clickbait", "filler"（占比 8%，可接受）</p>
        <p className="mb-2"><b>问题高频：</b>"how about Aider?", "vs Copilot?" → 下次选题灵感</p>
        <p className="text-[10px] text-purple-700 mt-2">→ 自动生成 2 个 S5 候选选题入选题池</p>
      </>
    ),
  },
];

// ── DimBlock component ─────────────────────────────────────────────────────────

function DimBlock({ def, videoTitle }: { def: DimBlockDef; videoTitle: string }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className={cn("px-3 py-2 flex items-center gap-2", def.headerClass)}>
        <span className="w-6 h-6 rounded-full bg-white grid place-items-center text-[11px] font-black shrink-0">
          {def.num}
        </span>
        <span className="text-[12px] font-bold">{def.title}</span>
      </div>
      <div className="p-3 text-[11px] text-gray-700 leading-relaxed">
        {def.content(videoTitle)}
      </div>
    </div>
  );
}

// ── ViralModal ─────────────────────────────────────────────────────────────────

export function ViralModal() {
  const activeModal = useUi((s) => s.activeModal);
  const viralId = useUi((s) => s.viralId);
  const closeModal = useUi((s) => s.closeModal);

  const open = activeModal === "viral" && viralId != null;

  const [v, setV] = useState<ViralSample | undefined>(undefined);

  useEffect(() => {
    if (open && viralId != null) {
      dataProvider.getViralTeardown(viralId).then(setV);
    }
  }, [open, viralId]);

  if (!open) return null;

  return (
    <div
      className={cn("modal-mask", "show")}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl w-[760px] max-w-[92vw] max-h-[88vh] flex flex-col overflow-hidden shadow-xl">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-200 shrink-0">
          {v ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Pills row */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {v.type} · {v.score} 分
                  </span>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded mono">
                    #{v.id}
                  </span>
                </div>
                {/* Title */}
                <h2 className="text-lg font-black leading-snug">{v.title}</h2>
                {/* Meta */}
                <p className="text-[11px] text-gray-500 mt-0.5">{v.author} · {v.meta}</p>
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center shrink-0 text-gray-500 mt-0.5"
              >
                <Icon.Close size={14} />
              </button>
            </div>
          ) : (
            /* Loading state */
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-100 rounded w-40 mb-2 animate-pulse" />
                <div className="h-5 bg-gray-100 rounded w-64 mb-1.5 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-48 animate-pulse" />
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center shrink-0 text-gray-500"
              >
                <Icon.Close size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        {v && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3">

            {/* 3 KPI tiles */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 rounded p-3">
                <div className="text-2xl font-black text-emerald-600">{v.stats.view}</div>
                <div className="text-[10px] text-gray-500">播放</div>
              </div>
              <div className="bg-emerald-50 rounded p-3">
                <div className="text-2xl font-black text-emerald-600">{v.stats.ctr}</div>
                <div className="text-[10px] text-gray-500">CTR（vs 均值 {v.stats.ctrBase}）</div>
              </div>
              <div className="bg-emerald-50 rounded p-3">
                <div className="text-2xl font-black text-emerald-600">{v.stats.watch}</div>
                <div className="text-[10px] text-gray-500">完播（vs 均值 {v.stats.watchBase}）</div>
              </div>
            </div>

            {/* Section label */}
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
              6 维自动解构
            </div>

            {/* 6 dim blocks */}
            {DIM_BLOCKS.map((def) => (
              <DimBlock key={def.num} def={def} videoTitle={v.title} />
            ))}

            {/* Contributed candidate rules amber box */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mt-4">
              <div className="font-bold text-[12px] mb-2 flex items-center gap-1.5">
                <Icon.Flask size={13} className="text-amber-600" />
                本爆款贡献到候选规则
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="mono bg-purple-100 text-purple-700 px-1.5 rounded font-bold">
                    Rule_Title_05
                  </span>
                  <span>第 5 个验证样本 · 跨 4 账号 · 推荐升级 L1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono bg-purple-100 text-purple-700 px-1.5 rounded font-bold">
                    Skill_Cut_03
                  </span>
                  <span>第 4 个验证样本 · 跨 3 账号 · 推荐升级 L1</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
