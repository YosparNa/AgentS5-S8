// 来源 PROTO lines 3744–3794 (renderNiche + nicheRow + dimCell)
// Container-agnostic: takes `output` prop; no drawer/modal shell.

import { useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

interface NicheEvidence {
  title: string;
  views: string;
  subs: string;
  age: string;
}

interface NicheFits {
  noFace: boolean;
  aiVoice: boolean;
  blueOcean: boolean;
  dailyOk: boolean;
  costOk: boolean;
}

interface NicheItem {
  id: string;
  name: string;
  keywords: string[];
  angleTags: string[];
  core: { data: number; capacity: number; gap: number; biz: number };
  launch: { coldstart: number; scarcity: number; replicability: number };
  weighted: number;
  recommend?: boolean;
  fits: NicheFits;
  evidence: NicheEvidence[];
}

interface NicheOutput {
  lockedId: string;
  scorecard: NicheItem[];
}

interface Props {
  output: NicheOutput;
}

// Score color helper — full static strings (no dynamic concatenation)
function scoreCls(v: number): string {
  if (v >= 8) return "text-emerald-600";
  if (v >= 6) return "text-amber-600";
  return "text-gray-500";
}

function launchLblCls(launch: boolean): string {
  return launch ? "text-purple-500" : "text-gray-400";
}

function DimCell({ label, v, launch }: { label: string; v: number; launch?: boolean }) {
  return (
    <div className="bg-gray-50 rounded p-1 text-center">
      <div className={cn("text-[12px] font-bold", scoreCls(v))}>{v}</div>
      <div className={cn("text-[8px]", launchLblCls(!!launch))}>
        {launch ? "+ " : ""}{label}
      </div>
    </div>
  );
}

// Chips component — local state for removal; purely decorative
function Chips({ items, addLabel }: { items: string[]; addLabel?: string }) {
  const [chips, setChips] = useState<string[]>(items);
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {chips.map((c, i) => (
        <span
          key={i}
          className="chip"
        >
          {c}
          <Icon.Close
            size={9}
            className="cursor-pointer opacity-60 hover:opacity-100 ml-1 inline"
            onClick={() => setChips(prev => prev.filter((_, idx) => idx !== i))}
          />
        </span>
      ))}
      <button
        className="chip-add"
        onClick={e => e.preventDefault()}
      >
        <Icon.Plus size={9} className="mr-0.5 inline" />
        {addLabel ?? "添加"}
      </button>
    </div>
  );
}

function weightedCls(v: number): string {
  return v >= 8 ? "text-emerald-600" : "text-amber-600";
}

function borderCls(on: boolean): string {
  return on ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200";
}

function fitCls(ok: boolean): string {
  return ok
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-gray-100 text-gray-400";
}

function NicheRow({
  c,
  lockedId,
  onLock,
}: {
  c: NicheItem;
  lockedId: string;
  onLock: (id: string) => void;
}) {
  const on = c.id === lockedId;
  const fitMarks: [string, boolean][] = [
    ["不露脸", c.fits.noFace],
    ["AI 配音", c.fits.aiVoice],
    ["蓝海", c.fits.blueOcean],
    ["每日可更", c.fits.dailyOk],
    ["成本 OK", c.fits.costOk],
  ];

  return (
    <div className={cn("bg-white border rounded-lg p-3", borderCls(on))}>
      <div className="flex items-start gap-2">
        <input
          type="radio"
          name="s1lock"
          checked={on}
          onChange={() => onLock(c.id)}
          className="mt-1 w-3.5 h-3.5 accent-indigo-600 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold">
              {c.name}
              {c.recommend && (
                <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded font-bold">
                  AI 荐
                </span>
              )}
            </span>
            <span className={cn("mono text-[14px] font-black", weightedCls(c.weighted))}>
              {c.weighted}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {c.angleTags.map(t => (
              <span
                key={t}
                className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded"
              >
                🎯 {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Core 4 dims */}
      <div className="grid grid-cols-4 gap-1 mt-2">
        <DimCell label="数据热度" v={c.core.data} />
        <DimCell label="市场容量" v={c.core.capacity} />
        <DimCell label="差异空间" v={c.core.gap} />
        <DimCell label="商业价值" v={c.core.biz} />
      </div>
      {/* Launch 3 dims */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        <DimCell label="冷启友好" v={c.launch.coldstart} launch />
        <DimCell label="供给稀缺" v={c.launch.scarcity} launch />
        <DimCell label="可复制" v={c.launch.replicability} launch />
      </div>

      {/* Fit marks */}
      <div className="flex flex-wrap gap-1 mt-2">
        {fitMarks.map(([n, ok]) => (
          <span key={n} className={cn("text-[9px] px-1.5 py-0.5 rounded", fitCls(ok))}>
            {ok ? "✓" : "✗"} {n}
          </span>
        ))}
      </div>

      {/* Evidence details */}
      <details className="mt-2">
        <summary className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
          <Icon.Flask size={9} />
          证据样本（低粉爆款）· {c.evidence.length}
          <Icon.ChevronDown size={8} className="ml-auto" />
        </summary>
        <div className="mt-1.5 space-y-1">
          <div className="flex flex-wrap gap-1 mb-1">
            {c.keywords.map(k => (
              <span key={k} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mono">
                {k}
              </span>
            ))}
          </div>
          {c.evidence.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] bg-gray-50 rounded px-2 py-1">
              <span className="flex-1 truncate">{e.title}</span>
              <span className="mono text-emerald-600">👁 {e.views}</span>
              <span className="text-gray-400">订阅 {e.subs}</span>
              <span className="text-gray-400">{e.age}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export function NicheArtifact({ output }: Props) {
  const [view, setView] = useState<"card" | "angle">("card");
  const [lockedId, setLockedId] = useState(output.lockedId);

  const sc = output.scorecard;

  // Build angle groups
  const angles: Record<string, NicheItem[]> = {};
  sc.forEach(c => c.angleTags.forEach(t => {
    if (!angles[t]) angles[t] = [];
    angles[t].push(c);
  }));

  const locked = sc.find(c => c.id === lockedId);

  return (
    <div>
      {/* Info banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-[11px] text-sky-900 mb-1">
        <Icon.Help size={12} className="mr-1 inline" />
        原 4 维评分为核心，叠加起号附加因子；角度池仅作分类视图。
        <b>单选锁定 1 个赛道</b>后于底部确认。
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => setView("card")}
          className={cn("pill", view === "card" ? "pill-on" : "")}
        >
          评分卡
        </button>
        <button
          onClick={() => setView("angle")}
          className={cn("pill", view === "angle" ? "pill-on" : "")}
        >
          角度分组
        </button>
        <span className="text-[9px] text-gray-400 ml-auto">
          展开看证据样本
        </span>
      </div>

      {/* Card view */}
      {view === "card" && (
        <div className="space-y-2">
          {sc.map(c => (
            <NicheRow
              key={c.id}
              c={c}
              lockedId={lockedId}
              onLock={setLockedId}
            />
          ))}
        </div>
      )}

      {/* Angle view */}
      {view === "angle" && (
        <div>
          {Object.entries(angles).map(([t, list]) => (
            <div key={t} className="bg-white border border-gray-200 rounded-lg p-2.5 mb-2">
              <div className="text-[11px] font-bold text-amber-700 mb-1">
                🎯 {t}{" "}
                <span className="text-gray-400 font-normal">· {list.length} 个候选</span>
              </div>
              {list.map(c => (
                <div key={c.id} className="flex items-center justify-between py-1 border-t border-gray-50">
                  <span className="text-[11px]">{c.name}</span>
                  <span className={cn("mono text-[11px] font-bold", c.weighted >= 8 ? "text-emerald-600" : "text-amber-600")}>
                    {c.weighted}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Locked keywords card */}
      <div className="bg-white border border-indigo-200 rounded-lg p-3 mt-3">
        <div className="text-[10px] uppercase text-gray-400 font-bold mb-1.5">
          <Icon.Key size={10} className="text-indigo-500 mr-1 inline" />
          锁定赛道的关键词组（可增删）
        </div>
        <Chips items={locked ? locked.keywords : []} addLabel="关键词" />
      </div>
    </div>
  );
}
