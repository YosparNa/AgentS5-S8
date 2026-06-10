// ConfigTab — config forms per stage kind.
// 来源 PROTO renderConfig lines 3954–4110 + helpers cb/sw/sl/opt/rs/srcRow/chips/pillMulti/pillSingle.
// All helpers are controlled React components (useState); no DOM mutation.

import { useState } from "react";
import type { StageDef } from "@/types";
import { cn } from "@/lib/cn";
import { useConfig, CONFIG_PERSIST, setConfigValue } from "@/store/configStore";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Toggle knob (shared by Sw, Rs, SrcRow)
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={cn("toggle flex-shrink-0", on ? "on" : "")}
      onClick={() => onChange(!on)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cb — section card (PROTO `cb`)
// ─────────────────────────────────────────────────────────────────────────────

interface CbProps {
  title: string;
  desc?: string | null;
  children: React.ReactNode;
}
function Cb({ title, desc, children }: CbProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="mb-2">
        <h3 className="text-[12px] font-bold">{title}</h3>
        {desc && <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sw — switch list (PROTO `sw`)
// 使用 CONFIG_PERSIST 持久化，切换 Tab 不丢失
// ─────────────────────────────────────────────────────────────────────────────

interface SwProps {
  items: [string, boolean, string?][];
  persistKey?: string; // 可选：用于持久化的 key
}
function Sw({ items, persistKey }: SwProps) {
  const kind = persistKey || "__sw_" + items.map(([n]) => n).join("_");
  // 从 CONFIG_PERSIST 读取初始值，没有则用 items 的默认值
  const stored = CONFIG_PERSIST["sw"]?.[kind] as boolean[] | undefined;
  const [states, setStates] = useState<boolean[]>(() => stored ?? items.map(([, o]) => o));

  const toggle = (i: number) => {
    setStates((prev) => {
      const next = prev.map((s, idx) => (idx === i ? !s : s));
      // 立即写入持久化存储
      setConfigValue("sw", kind, next);
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      {items.map(([n, , note], i) => (
        <div key={i} className="flex justify-between gap-2 p-1.5 rounded hover:bg-gray-50">
          <div className="flex-1">
            <div className="text-[11px] font-medium">{n}</div>
            {note ? <div className="text-[10px] text-gray-500 mt-0.5">{note}</div> : null}
          </div>
          <Toggle on={states[i]} onChange={() => toggle(i)} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sl — labeled range sliders (PROTO `sl`)
// 使用 CONFIG_PERSIST 持久化，切换 Tab 不丢失
// ─────────────────────────────────────────────────────────────────────────────

interface SlProps {
  items: [string, number, number][];
  persistKey?: string;
}
function Sl({ items, persistKey }: SlProps) {
  const kind = persistKey || "__sl_" + items.map(([n]) => n).join("_");
  const stored = CONFIG_PERSIST["sl"]?.[kind] as number[] | undefined;
  const [values, setValues] = useState<number[]>(() => stored ?? items.map(([, v]) => v));

  const update = (i: number, v: number) => {
    setValues((prev) => {
      const next = prev.map((s, idx) => (idx === i ? v : s));
      setConfigValue("sl", kind, next);
      return next;
    });
  };

  return (
    <div className="space-y-2.5">
      {items.map(([n, , m], i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] font-medium">{n}</span>
            <span className="text-[11px] mono text-indigo-600 font-bold">
              {values[i]}/{m}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={m}
            value={values[i]}
            onChange={(e) => update(i, Number(e.target.value))}

            className="w-full input-range"
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// SrcRow — a source row with toggle (PROTO `srcRow`)
// ─────────────────────────────────────────────────────────────────────────────

interface SrcRowProps {
  name: string;
  on: boolean;
  note?: string;
}
function SrcRow({ name, on: defaultOn, note }: SrcRowProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 min-w-0">
        <div className="text-[11px]">{name}</div>
        {note ? <div className="text-[9px] text-gray-500">{note}</div> : null}
      </div>
      <Toggle on={on} onChange={setOn} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chips — chip list with × remove + "添加" chip-add (PROTO `chips`)
// ─────────────────────────────────────────────────────────────────────────────

interface ChipsProps {
  items: string[];
  addLabel?: string;
}
function Chips({ items: defaultItems, addLabel = "添加" }: ChipsProps) {
  const [items, setItems] = useState<string[]>(defaultItems);
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {items.map((c, i) => (
        <span key={i} className="chip">
          {c}
          <span
            className="text-[9px] cursor-pointer opacity-60 hover:opacity-100"
            onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
          >
            ×
          </span>
        </span>
      ))}
      <button className="chip-add" onClick={(e) => e.preventDefault()}>
        <span className="text-[9px] mr-0.5">+</span>
        {addLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PillMulti — multi-select pills (PROTO `pillMulti`)
// ─────────────────────────────────────────────────────────────────────────────

interface PillMultiProps {
  items: string[];
  on: number[];
}
function PillMulti({ items, on: defaultOn }: PillMultiProps) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(defaultOn));
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onClick={() =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(i)) next.delete(i);
              else next.add(i);
              return next;
            })
          }
          className={cn("pill", selected.has(i) ? "pill-on" : "")}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PillSingle — single-select pills (PROTO `pillSingle`)
// ─────────────────────────────────────────────────────────────────────────────

interface PillSingleProps {
  items: string[];
  sel: number;
}
function PillSingle({ items, sel }: PillSingleProps) {
  const [selected, setSelected] = useState(sel);
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setSelected(i)}
          className={cn("pill", selected === i ? "pill-on" : "")}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 受控子组件（configStore 驱动，切换 Tab 不丢失状态）
// ─────────────────────────────────────────────────────────────────────────────

function SwCtrl({ items }: { items: { label: string; value: boolean; onChange: (v: boolean) => void }[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between gap-2 p-1.5 rounded hover:bg-gray-50">
          <div className="flex-1">
            <div className="text-[11px] font-medium">{item.label}</div>
          </div>
          <Toggle on={item.value} onChange={item.onChange} />
        </div>
      ))}
    </div>
  );
}

function SlCtrl({ items }: { items: { label: string; value: number; max: number; onChange: (v: number) => void }[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] font-medium">{item.label}</span>
            <span className="text-[11px] mono text-indigo-600 font-bold">{item.value}/{item.max}</span>
          </div>
          <input
            type="range"
            min={0}
            max={item.max}
            value={item.value}
            className="w-full input-range"
            onChange={(e) => item.onChange(parseInt(e.target.value))}
          />
        </div>
      ))}
    </div>
  );
}

function OptCtrl({ items, selected, onChange }: { items: string[]; selected: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((it, i) => (
        <div
          key={i}
          className={cn(
            "border-2 rounded-lg p-2 cursor-pointer hover:border-indigo-400 text-[11px] font-bold text-center",
            i === selected ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
          )}
          onClick={() => onChange(i)}
        >
          {it}
        </div>
      ))}
    </div>
  );
}

function RsCtrl({ items }: { items: { emoji: string; name: string; desc: string; value: boolean; onChange: (v: boolean) => void }[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
          <span className="text-xl">{item.emoji}</span>
          <div className="flex-1">
            <div className="text-[11px] font-bold">{item.name}</div>
            <div className="text-[10px] text-gray-500">{item.desc}</div>
          </div>
          <Toggle on={item.value} onChange={item.onChange} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfigTab — main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  stage: StageDef;
}

export function ConfigTab({ stage }: Props) {
  const k = stage.config.kind as string;

  let content: React.ReactNode;

  switch (k) {
    // ── niche ───────────────────────────────────────────────────────────────
    case "niche":
      content = (
        <>
          <div className="bg-sky-50 border border-sky-200 rounded p-3 text-[11px] text-sky-900">
            <b>L2 频道级</b> · 种子词起步，双轨可调。「我的条件」作为软约束，agent 优先靠拢。
          </div>

          <Cb title="1. 种子与分析侧重" desc="起点 3-5 个词，决定扩词方向">
            <div className="text-[10px] text-gray-500 mb-1">种子关键词（3-5，必填）</div>
            <Chips items={["AI 编程", "cursor", "claude code"]} addLabel="种子词" />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">
              分析侧重（双轨兼容，默认平衡 · 影响权重预设与镜头默认开关）
            </div>
            <RangeWith3Labels
              defaultValue={1}
              labels={["偏起号快", "平衡", "偏头部大盘"]}
            />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">赛道时效</div>
            <PillSingle items={["常青为主", "蹭热点周期", "两者都要"]} sel={2} />
          </Cb>

          <Cb title="2. 我的条件" desc="接地气核心 —— 决定能不能做、做不做得动">
            <div className="text-[10px] text-gray-500 mb-1">内容形式（多选）</div>
            <PillMulti
              items={["纯口播", "真人出镜", "录屏演示", "剪辑混剪", "AI 配音+图文", "数字人", "动画"]}
              on={[2, 4]}
            />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">是否露脸</div>
            <PillSingle items={["愿意", "不愿意(只声音/图文)", "看情况"]} sel={1} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">制作成本上限</div>
            <PillSingle items={["低(单人手机)", "中(简单剪辑)", "高(团队/外包)"]} sel={1} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">可投入更新频率</div>
            <PillSingle items={["每日", "周 3-4", "周 1-2"]} sel={0} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">单条可投入工时</div>
            <PillSingle items={["<30min", "0.5-2h", "半天以上"]} sel={1} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">我熟悉/有资源的领域</div>
            <textarea
              className="w-full text-[11px] border rounded p-2 resize-none"
              rows={2}
              placeholder="自由填，agent 优先靠拢"
              defaultValue="独立开发 / SaaS / 出海工具"
            />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">语言/地区（多选）</div>
            <PillMulti items={["中文·国内", "中文·海外", "英文", "日文", "其他"]} on={[0, 2]} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">变现偏好（多选）</div>
            <PillMulti
              items={["广告分成", "带货", "引流私域", "接商单", "卖课卖服务", "涨粉卖号", "暂不考虑"]}
              on={[0, 4]}
            />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">竞争烈度容忍</div>
            <PillSingle
              items={["只要蓝海", "中等可接受", "红海也行(我能差异化)"]}
              sel={1}
            />
          </Cb>

          <Cb title="3. 深挖镜头" desc="起号性分析因素 · 侧重起号时默认全开">
            <Sw
              items={[
                ["低粉爆款", true, "高播放/低订阅 → 靠推荐不靠粉"],
                ["供需差", true, "搜索量高/同类供给少 → 蓝海"],
                ["新号起飞", true, "号龄短已起量 → 起号快活样本"],
                ["热点漂移", true, "赛道内上升子选题"],
                ["算法偏好", true, "推荐流偏爱的形式/时长"],
              ]}
            />
          </Cb>

          <Cb title="4. 评分权重" desc="原 4 维为核心；起号附加因子随侧重智能预设、可关">
            <div className="text-[10px] font-bold text-gray-600 mb-1">原 4 维（核心，保留）</div>
            <Sl items={[["数据热度", 8, 10], ["市场容量", 7, 10], ["差异空间", 9, 10], ["商业价值", 8, 10]]} />
            <div className="text-[10px] font-bold text-purple-600 mt-3 mb-1">
              起号附加因子（偏起号 → 自动抬高）
            </div>
            <Sl items={[["冷启友好度", 9, 10], ["供给稀缺度", 8, 10], ["可复制度", 9, 10]]} />
          </Cb>

          <Cb title="5. 高级">
            <div className="flex justify-between p-2 bg-white border rounded mb-1.5">
              <span className="text-[11px]">扩词上限</span>
              <input type="number" defaultValue={80} className="w-16 text-[11px] border rounded p-1 mono" />
            </div>
            <div className="text-[10px] text-gray-500 mb-1">数据源</div>
            <PillMulti items={["YouTube", "Google", "B 站", "TikTok"]} on={[0, 1]} />
            <div className="flex justify-between p-2 bg-white border rounded mt-2">
              <span className="text-[11px]">锁定阈值（加权 ≥）</span>
              <input
                type="number"
                defaultValue={7.5}
                step={0.1}
                className="w-16 text-[11px] border rounded p-1 mono"
              />
            </div>
            <button className="w-full mt-2 text-[11px] border border-gray-200 rounded py-1.5 hover:bg-gray-50">
              打开提示词编辑器
            </button>
          </Cb>
        </>
      );
      break;

    // ── publish ─────────────────────────────────────────────────────────────
    case "publish":
      content = (
        <>
          <Cb title="多平台开关">
            <Sw items={[["YouTube", true], ["X", true], ["Shorts ×5", true], ["小红书", false]]} />
          </Cb>
          <Cb title="排程">
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">发布时间</span>
                <input
                  type="datetime-local"
                  defaultValue="2026-05-13T20:00"
                  className="text-[11px] border rounded p-1"
                />
              </div>
            </div>
          </Cb>
          <Cb title="运营钩子">
            <Sw items={[["私域通知", true], ["邮件推送", true], ["评论置顶引导", true]]} />
          </Cb>
        </>
      );
      break;

    // ── analytics ───────────────────────────────────────────────────────────
    case "analytics":
      content = (
        <>
          <Cb title="回收指标">
            <Sw
              items={[
                ["CTR", true],
                ["留存", true],
                ["完播", true],
                ["评论聚类", true],
                ["差评归因", true],
              ]}
            />
          </Cb>
          <Cb title="自动沉淀触发器">
            <Sw
              items={[
                ["CTR > 均值 30% → 标题候选", true],
                ["完播 > 均值 20% → 结构候选", true],
                ["评论高频词 → 选题候选", true],
                ["差评关键词 → L2 禁区", true],
              ]}
            />
          </Cb>
        </>
      );
      break;

    // ── topic (S5) ───────────────────────────────────────────────────────────
    case "topic": {
      const cfg = useConfig();
      content = (
        <>
          <div className="bg-indigo-50 border border-indigo-200 rounded p-3 text-[11px] text-indigo-900 mb-1">
            <b>AI 选题 Agent</b> · 输入数据后在底部点击「AI 生成选题」
          </div>
          <Cb title="频道定位描述" desc="简要描述你的频道定位、目标受众、内容风格">
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-indigo-400 transition resize-none"
              rows={3}
              placeholder="例：AI 工具评测频道，聚焦效率工具和编程辅助，受众是 25-35 岁互联网从业者"
              value={cfg.s5_channelDesc}
              onChange={(e) => cfg.setS5ChannelDesc(e.target.value)}
            />
          </Cb>
          <Cb title="输入数据" desc="粘贴热点、竞品分析、用户评论、行业数据等">
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-indigo-400 transition resize-none font-mono"
              rows={8}
              placeholder="粘贴你收集的数据..."
              value={cfg.s5_userData}
              onChange={(e) => cfg.setS5UserData(e.target.value)}
            />
          </Cb>
          <Cb title="反 AI 套路">
            <SwCtrl
              items={[
                { label: "排除震惊体", value: cfg.s5_toggles[0], onChange: (v: boolean) => cfg.setS5Toggle(0, v) },
                { label: "排除假大空", value: cfg.s5_toggles[1], onChange: (v: boolean) => cfg.setS5Toggle(1, v) },
                { label: "排除 AI 套话", value: cfg.s5_toggles[2], onChange: (v: boolean) => cfg.setS5Toggle(2, v) },
              ]}
            />
          </Cb>
          <Cb title="情绪波动评分">
            <SlCtrl
              items={[
                { label: "认知冲突", value: cfg.s5_sliders[0], max: 10, onChange: (v: number) => cfg.setS5Slider(0, v) },
                { label: "共鸣度", value: cfg.s5_sliders[1], max: 10, onChange: (v: number) => cfg.setS5Slider(1, v) },
                { label: "危机感", value: cfg.s5_sliders[2], max: 10, onChange: (v: number) => cfg.setS5Slider(2, v) },
                { label: "好奇驱动", value: cfg.s5_sliders[3], max: 10, onChange: (v: number) => cfg.setS5Slider(3, v) },
              ]}
            />
          </Cb>
          <Cb title="锁题设置">
            <SwCtrl
              items={[
                { label: "自动锁题", value: cfg.s5_autoLock, onChange: (v: boolean) => cfg.setS5AutoLock(v) },
              ]}
            />
          </Cb>
        </>
      );
      break;
    }

    // ── outline (S6) ─────────────────────────────────────────────────────────
    case "outline": {
      const cfg = useConfig();
      content = (
        <>
          <Cb title="前 3 秒钩子">
            <OptCtrl
              items={["反常识", "冲突悬念", "数字冲击", "画面承诺"]}
              selected={cfg.s6_selectedOption}
              onChange={cfg.setS6SelectedOption}
            />
          </Cb>
          <Cb title="节奏曲线">
            <SlCtrl
              items={[
                { label: "危机点密度", value: cfg.s6_sliders[0], max: 5, onChange: (v: number) => cfg.setS6Slider(0, v) },
                { label: "高潮位 %", value: cfg.s6_sliders[1], max: 100, onChange: (v: number) => cfg.setS6Slider(1, v) },
                { label: "章节数", value: cfg.s6_sliders[2], max: 12, onChange: (v: number) => cfg.setS6Slider(2, v) },
              ]}
            />
          </Cb>
        </>
      );
      break;
    }

    // ── script (S7) ──────────────────────────────────────────────────────────
    case "script": {
      const cfg = useConfig();
      content = (
        <>
          <Cb title="个人化口语">
            <textarea
              className="w-full text-[11px] border rounded p-2 resize-none outline-none focus:border-indigo-400"
              rows={2}
              value={cfg.s7_bannedWords}
              onChange={(e) => cfg.setS7BannedWords(e.target.value)}
            />
          </Cb>
          <Cb title="危机点">
            <SwCtrl
              items={[
                { label: "每章 1 反预期", value: cfg.s7_toggles[0], onChange: (v: boolean) => cfg.setS7Toggle(0, v) },
                { label: "每 2-3 分钟留人钩子", value: cfg.s7_toggles[1], onChange: (v: boolean) => cfg.setS7Toggle(1, v) },
              ]}
            />
          </Cb>
        </>
      );
      break;
    }

    // ── adversarial (S8) ─────────────────────────────────────────────────────
    case "adversarial": {
      const cfg = useConfig();
      content = (
        <Cb title="红队角色">
          <RsCtrl
            items={[
              { emoji: "😤", name: "杠精", desc: "逻辑漏洞", value: cfg.s8_toggles[0], onChange: (v: boolean) => cfg.setS8Toggle(0, v) },
              { emoji: "🧑‍💻", name: "同行", desc: "技术错误", value: cfg.s8_toggles[1], onChange: (v: boolean) => cfg.setS8Toggle(1, v) },
              { emoji: "😶", name: "小白", desc: "听不懂", value: cfg.s8_toggles[2], onChange: (v: boolean) => cfg.setS8Toggle(2, v) },
              { emoji: "❤️", name: "老粉", desc: "人设违和", value: cfg.s8_toggles[3], onChange: (v: boolean) => cfg.setS8Toggle(3, v) },
              { emoji: "⚖️", name: "合规", desc: "红线", value: cfg.s8_toggles[4], onChange: (v: boolean) => cfg.setS8Toggle(4, v) },
            ]}
          />
        </Cb>
      );
      break;
    }

    // ── storyboard ───────────────────────────────────────────────────────────
    case "storyboard":
      content = (
        <Cb title="镜头粒度">
          <Sl items={[["平均时长", 4, 15], ["B-roll 占比 %", 55, 100]]} />
        </Cb>
      );
      break;

    // ── cover ────────────────────────────────────────────────────────────────
    case "cover":
      content = (
        <Cb title="标题策略">
          <Sw items={[["冲突型", true], ["数字型", true], ["反问型", false]]} />
        </Cb>
      );
      break;

    // ── l1 ───────────────────────────────────────────────────────────────────
    case "l1": {
      const items = (stage.config.items as string[]) ?? [];
      content = (
        <>
          <div className="bg-purple-50 border border-purple-200 rounded p-3 text-[11px] text-purple-900">
            <b>L1 工作区级</b>，影响所有频道。
          </div>
          {items.map((it, i) => (
            <Cb key={i} title={it} desc="">
              <input
                className="w-full text-[12px] border rounded p-2"
                placeholder={it}
              />
            </Cb>
          ))}
        </>
      );
      break;
    }

    // ── l2 ───────────────────────────────────────────────────────────────────
    case "l2": {
      const sec = stage.config.section as string;
      content = (
        <>
          <div className="bg-sky-50 border border-sky-200 rounded p-3 text-[11px] text-sky-900">
            <b>L2 频道级</b>，影响本频道。
          </div>
          {sec === "positioning" && (
            <>
              <Cb title="一句话定位">
                <textarea
                  className="w-full text-[11px] border rounded p-2 resize-none"
                  rows={2}
                  defaultValue="面向中文独立开发者，反对纯演示"
                />
              </Cb>
              <Cb title="人设禁区">
                <Sw items={[["不黑友商", true], ["不带货", true], ["不做演示视频", true]]} />
              </Cb>
            </>
          )}
          {sec === "benchmark" && (
            <Cb title="对标账号">
              {["Matt Wolfe", "Ali Abdaal", "Fireship"].map((n) => (
                <div key={n} className="bg-white border rounded p-2 flex justify-between mb-1.5">
                  <span className="text-[11px]">{n}</span>
                  <button className="text-[10px] text-gray-500">同步</button>
                </div>
              ))}
            </Cb>
          )}
          {sec === "hot" && (
            <Cb title="热点抓取">
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">时间</span>
                <input type="time" defaultValue="06:00" className="text-[11px] border rounded p-1" />
              </div>
            </Cb>
          )}
        </>
      );
      break;
    }

    // ── hot-pro ──────────────────────────────────────────────────────────────
    case "hot-pro":
      content = (
        <>
          <div className="bg-sky-50 border border-sky-200 rounded p-3 text-[11px] text-sky-900">
            <b>L2 频道级</b> · 每日 06:00 抓取，建议先用默认值跑 1 周再调权重。
          </div>

          <Cb title="1. 关键词与事件源" desc="关键词继承 S1，每个事件源可设开关与权重">
            <div className="text-[10px] text-gray-500 mb-1">关键词（继承 S1）</div>
            <Chips items={["AI 编程", "cursor", "claude code"]} addLabel="关键词" />
            <div className="space-y-2 mt-3">
              <div className="border-l-2 border-blue-400 pl-3">
                <div className="text-[11px] font-bold text-blue-700 mb-1">
                  行业事件 / 新闻站 / RSS · 每日 06:00
                </div>
                <SrcRow name="Hacker News" on={true} note="#1-30 by points" />
                <SrcRow name="TheRundown / TLDR / AlphaSignal" on={true} note="AI 行业 newsletter" />
                <SrcRow name="TechCrunch / The Verge" on={false} note="科技媒体" />
                <SrcRow name="自定义 RSS" on={false} note="增删" />
              </div>
              <div className="border-l-2 border-emerald-400 pl-3">
                <div className="text-[11px] font-bold text-emerald-700 mb-1">平台热榜 · 每 4h</div>
                <SrcRow name="YouTube Trending" on={true} note="按地区 + 类目" />
                <SrcRow name="TikTok 趋势" on={false} />
                <SrcRow name="B 站热搜" on={false} />
              </div>
              <div className="border-l-2 border-purple-400 pl-3">
                <div className="text-[11px] font-bold text-purple-700 mb-1">社交话题 · 每 2h</div>
                <SrcRow name="X 账号 + 关注者圈" on={true} note="关键词触发" />
                <SrcRow name="Reddit r/MachineLearning, r/LocalLLaMA" on={true} />
                <SrcRow name="微博热搜" on={false} note="中文圈" />
                <SrcRow name="知乎热榜" on={false} note="中文圈" />
                <SrcRow name="即刻热门" on={false} note="中文圈" />
              </div>
              <div className="border-l-2 border-amber-400 pl-3">
                <div className="text-[11px] font-bold text-amber-700 mb-1">搜索流量 · 每日</div>
                <SrcRow name="Google Trends" on={true} note="关键词突增" />
                <SrcRow name="百度指数" on={false} note="中文搜索" />
              </div>
            </div>
          </Cb>

          <Cb title="2. 定时与产出">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">cron</span>
                <input type="time" defaultValue="06:00" className="text-[11px] border rounded p-1" />
              </div>
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">时区</span>
                <select className="text-[11px] border rounded p-1">
                  <option>Asia/Shanghai</option>
                  <option>UTC</option>
                  <option>America/Los_Angeles</option>
                </select>
              </div>
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">条数(5-10)</span>
                <input
                  type="number"
                  defaultValue={5}
                  min={5}
                  max={10}
                  className="w-12 text-[11px] border rounded p-1 mono"
                />
              </div>
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">过期天数</span>
                <input
                  type="number"
                  defaultValue={7}
                  className="w-12 text-[11px] border rounded p-1 mono"
                />
              </div>
            </div>
            <div className="mt-2">
              <Sw items={[["自动刷新", true, ""]]} />
            </div>
          </Cb>

          <Cb title="3. 热点偏好" desc="接地气个人偏向">
            <div className="text-[10px] text-gray-500 mb-1">热点类型（多选）</div>
            <PillMulti
              items={["突发新闻", "新品发布", "争议话题", "教程需求暴涨", "节日季节", "长青疑问翻红"]}
              on={[0, 1, 3]}
            />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">热度来源权重</div>
            <Sl
              items={[
                ["搜索上升", 8, 10],
                ["社交讨论量", 7, 10],
                ["竞品已开做", 6, 10],
                ["评论区呼声", 8, 10],
              ]}
            />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">时效窗口</div>
            <PillSingle items={["只要 24h 内", "3 天内", "一周内"]} sel={1} />
          </Cb>

          <Cb title="4. 门槛">
            <Sl
              items={[
                ["相关度阈值", 7, 10],
                ["热度阈值", 6, 10],
                ["与本频道 DNA 契合度阈值", 7, 10],
              ]}
            />
            <div className="text-[10px] font-bold text-gray-600 mt-3 mb-1">
              4 维评分权重（总分 40）
            </div>
            <Sl
              items={[
                ["时效（趋势上升 vs 衰退）", 9, 10],
                ["相关（与本频道定位匹配）", 8, 10],
                ["差异（对标未做 / 有独特角度）", 8, 10],
                ["商业（能否转私域 / 引流 / 货）", 7, 10],
              ]}
            />
            <div className="mt-2 p-2 bg-gray-50 rounded text-[10px] text-gray-600">
              <b>入池阈值：</b>
              <input
                type="number"
                defaultValue={28}
                className="w-12 border border-gray-200 rounded p-1 mono"
              />
              / 40 · 低于此分自动丢弃归档
            </div>
          </Cb>

          <Cb title="5. 禁区与风格（个人）">
            <div className="text-[10px] text-gray-500 mb-1">选题禁区（继承 S3 + 可加）</div>
            <Chips items={["不碰政治", "不碰某品类"]} addLabel="禁区" />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">建议角度风格</div>
            <PillSingle items={["我的人设语气", "克制", "强钩子标题党"]} sel={0} />
            <div className="mt-3">
              <Sw items={[["排除已做过选题（去重历史）", true, ""]]} />
            </div>
            <div className="text-[10px] font-bold text-gray-600 mt-3 mb-1">过滤规则</div>
            <Sw
              items={[
                ["强制频道相关性（NLP 比对定位档案）", true, "未匹配直接丢"],
                ["禁区词拦截", true, "命中 4 条禁区词直接丢"],
                ["30 天历史去重", true, ""],
                ["竞争度检查", true, "已有 N 个对标做过 → 降分"],
                ["版权风险预筛", true, ""],
              ]}
            />
          </Cb>

          <Cb title="6. 通知策略">
            <Sw
              items={[
                ["06:00 抓完推送（默认）", true, ""],
                ["上升期实时推送", false, "分数 ≥35 立即叫醒你"],
                ["禁用周末早提醒", true, ""],
              ]}
            />
          </Cb>

          <Cb title="7. 高级">
            <button className="w-full text-[11px] border border-gray-200 rounded py-1.5 hover:bg-gray-50">
              打开提示词编辑器
            </button>
          </Cb>
        </>
      );
      break;

    // ── benchmark-pro ────────────────────────────────────────────────────────
    case "benchmark-pro":
      content = (
        <>
          <div className="bg-sky-50 border border-sky-200 rounded p-3 text-[11px] text-sky-900">
            <b>L2 频道级</b> · 维持 12-30 个对标，太少缺信号，太多噪音大。
          </div>

          <Cb title="1. 对标范围" desc="关键词组继承 S1，可改">
            <div className="text-[10px] text-gray-500 mb-1">关键词组（继承 S1）</div>
            <Chips items={["cursor 教程", "claude code", "AI 编程工作流"]} addLabel="关键词" />
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">候选数</span>
                <input
                  type="number"
                  defaultValue={50}
                  className="w-14 text-[11px] border rounded p-1 mono"
                />
              </div>
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">入库数</span>
                <input
                  type="number"
                  defaultValue={12}
                  className="w-14 text-[11px] border rounded p-1 mono"
                />
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-3 mb-1">数据源</div>
            <PillMulti items={["YouTube", "B 站", "TikTok"]} on={[0]} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">地区 / 语言过滤</div>
            <PillMulti items={["中文·国内", "中文·海外", "英文", "日文"]} on={[0, 2]} />
          </Cb>

          <Cb title="2. 5 个发现入口（推荐都开）">
            <Sw
              items={[
                ["手动添加", true, "最朴素"],
                ["种子扩展（YT 推荐频道）", true, "从已有对标的“推荐频道”挖"],
                ["关键词搜索 Top 30", true, "本赛道高频词下排前 30 的账号"],
                ["反向粉丝映射", true, "本号粉丝同时关注哪些 YT 账号 · 最精准"],
                ["评论区挖掘", false, "爆款视频评论区被提及的账号 · 噪音大"],
              ]}
            />
          </Cb>

          <Cb title="3. 对标号画像偏好" desc="接地气 —— 想模仿和我相近的">
            <div className="text-[10px] text-gray-500 mb-1">体量（多选）</div>
            <PillMulti items={["微型 <1万", "小 1-10万", "中 10-100万", "大 >100万"]} on={[0, 1]} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">号龄</div>
            <PillSingle items={["只看新号 <1年", "偏新号", "不限"]} sel={1} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">内容类型</div>
            <PillSingle items={["原创为主", "含搬运二创", "只看搬运(低门槛复制)"]} sel={0} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">更新频率</div>
            <PillSingle items={["只看高频(周 3+)", "不限"]} sel={1} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">制作规模</div>
            <PillSingle items={["倾向单人能复制的", "不限"]} sel={0} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">
              我已知的对标号（手动喂种子，强制纳入）
            </div>
            <textarea
              className="w-full text-[11px] border rounded p-2 resize-none"
              rows={2}
              placeholder="名称 / 链接，逐行"
            />
            <div className="text-[10px] text-gray-500 mt-2 mb-1">排除名单</div>
            <textarea
              className="w-full text-[11px] border rounded p-2 resize-none"
              rows={2}
              placeholder="不想出现的号 / 类型"
            />
          </Cb>

          <Cb title="4. 拐点账号探测" desc="算法解密，本环节新增 —— 号龄短/历史扑街/近作突爆">
            <Sw items={[["启用拐点探测", true, ""]]} />
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">最大号龄(月)</span>
                <input
                  type="number"
                  defaultValue={12}
                  className="w-12 text-[11px] border rounded p-1 mono"
                />
              </div>
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">历史最少作品</span>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-12 text-[11px] border rounded p-1 mono"
                />
              </div>
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">爆发倍数 ≥</span>
                <input
                  type="number"
                  defaultValue={10}
                  className="w-12 text-[11px] border rounded p-1 mono"
                />
              </div>
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">低粉判定 ≥</span>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-12 text-[11px] border rounded p-1 mono"
                />
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-3 mb-1">delta 抓取维度（多选）</div>
            <PillMulti
              items={["标题", "封面", "选题", "时长", "发布时段", "开头钩子", "形式", "标签"]}
              on={[0, 1, 2, 5]}
            />
          </Cb>

          <Cb title="5. 评分权重（原 10 维）">
            <Sl
              items={[
                ["内容相关", 8, 10],
                ["受众匹配", 8, 10],
                ["选题重合", 7, 10],
                ["更新稳定", 7, 10],
                ["互动率", 8, 10],
                ["涨粉速度", 7, 10],
                ["制作水准", 8, 10],
                ["商业化", 6, 10],
                ["差异空间", 9, 10],
                ["可借鉴度", 9, 10],
              ]}
            />
            <div className="mt-2">
              <Sw
                items={[["第 11 项：拐点信号（可选叠加）", true, "命中拐点阈值的号额外加权"]]}
              />
            </div>
          </Cb>

          <Cb title="6. 监控阈值">
            <Sl
              items={[
                ["新视频提醒延迟（小时）", 2, 12],
                ["爆款触发倍数（月均 × N）", 3, 10],
                ["订阅暴涨阈值（周净增 %）", 10, 30],
                ["内容转型检测窗口（条）", 5, 20],
              ]}
            />
          </Cb>

          <Cb title="7. 自动行为">
            <Sw
              items={[
                ["达爆款阈值自动加入 S2.5 解构池", true, "省手动"],
                ["订阅暴涨提醒“被某视频带飞了”", true, ""],
                ["内容方向偏移 → 重新评估价值", true, ""],
                ["限流嫌疑 → 降权重", false, "谨慎，可能误判"],
                ["数据造假嫌疑 → 自动移除", false, "非常谨慎"],
              ]}
            />
          </Cb>

          <Cb title="8. 维护节奏">
            <Sw
              items={[
                ["每周末复盘 5 个表现最差的对标", true, "决定是否替换"],
                ["每月扩展 2-3 个新对标", true, "保持新鲜"],
                ["上限 30 个，超出强制淘汰", true, ""],
              ]}
            />
          </Cb>

          <Cb title="9. 高级">
            <Sw items={[["评论区挖人", true, ""]]} />
            <div className="text-[10px] text-gray-500 mt-2 mb-1">挖人深度</div>
            <PillSingle items={["浅(置顶评论)", "标准", "深(全量评论)"]} sel={1} />
            <button className="w-full mt-3 text-[11px] border border-gray-200 rounded py-1.5 hover:bg-gray-50">
              打开提示词编辑器
            </button>
          </Cb>
        </>
      );
      break;

    // ── viral-hub ────────────────────────────────────────────────────────────
    case "viral-hub":
      content = (
        <>
          <div className="bg-orange-50 border border-orange-200 rounded p-3 text-[11px] text-orange-900">
            <b>L2 频道级 · 独立子页 · 异步不阻塞 S3</b>。默认沉淀进「中央·爆款公式库」。
          </div>

          <Cb title="1. 解构范围">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">播放 Top N</span>
                <input
                  type="number"
                  defaultValue={10}
                  className="w-12 text-[11px] border rounded p-1 mono"
                />
              </div>
              <div className="flex justify-between p-2 bg-white border rounded">
                <span className="text-[11px]">天数窗口</span>
                <input
                  type="number"
                  defaultValue={90}
                  className="w-12 text-[11px] border rounded p-1 mono"
                />
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-3 mb-1">来源</div>
            <PillSingle items={["全部对标库", "仅拐点号", "手动指定视频"]} sel={0} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">入池触发器</div>
            <Sw
              items={[
                ["对标爆款（24h 播放 ≥ 月均 3×）", true, ""],
                ["本号爆款（CTR ≥ 均值 130%）", true, ""],
                ["手动加入", true, ""],
                ["长尾回升（60d 后流量回归）", true, ""],
              ]}
            />
          </Cb>

          <Cb title="2. 解构维度（多选）">
            <PillMulti
              items={[
                "标题公式", "封面风格", "选题角度", "开头钩子(前N秒)",
                "结构骨架", "信息密度·节奏", "时长", "发布时间",
                "BGM 音效", "评论区情绪", "标签 tag", "缩略图文字",
              ]}
              on={[0, 1, 2, 3, 4, 9]}
            />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">解构深度</div>
            <PillSingle items={["速览", "标准", "深度(逐秒拆开头)"]} sel={1} />
          </Cb>

          <Cb title="3. 我的复制侧重" desc="接地气个人偏向 —— 我最缺啥就重点拆啥">
            <PillMulti items={["选题灵感", "标题套路", "开头留人", "完播结构", "封面", "节奏"]} on={[2, 3]} />
            <div className="text-[10px] text-gray-500 mt-3 mb-1">输出形态</div>
            <PillSingle items={["可直接套用的模板", "原理解释", "两者都要"]} sel={2} />
          </Cb>

          <Cb title="4. 沉淀分级" desc="默认进「中央·爆款公式库」，满足条件可向上晋升">
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 p-2 bg-white border rounded">
                <span className="layer-pill layer-video px-1.5 py-0.5 rounded mono text-[9px]">L3</span>
                <span className="flex-1">本视频 · 单条可直接克隆元素</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white border rounded">
                <span className="layer-pill layer-channel px-1.5 py-0.5 rounded mono text-[9px]">L2</span>
                <span className="flex-1">频道 · 本频道复现套路</span>
                <span className="text-[9px] text-gray-400">≥3 条复现</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded">
                <span className="layer-pill layer-central px-1.5 py-0.5 rounded mono text-[9px]">中央</span>
                <span className="flex-1 font-semibold">跨频道规律（默认）</span>
                <span className="text-[9px] text-gray-400">跨 ≥N 频道</span>
              </div>
            </div>
          </Cb>

          <Cb title="5. 联动">
            <Sw
              items={[
                [
                  "频道级摘要完成后回填增强 S3 定位",
                  false,
                  `默认关，保持异步不阻塞；开后就绪时提示 S3 可"定位增强"`,
                ],
              ]}
            />
          </Cb>

          <Cb title="6. 高级">
            <Sw items={[["去重合并相似公式", true, ""]]} />
            <div className="text-[10px] font-bold text-gray-600 mt-3 mb-1">6 维解构权重</div>
            <Sl
              items={[
                ["选题反推", 8, 10],
                ["标题封面", 9, 10],
                ["脚本结构", 8, 10],
                ["视听节奏", 7, 10],
                ["发布时机", 6, 10],
                ["评论情绪", 7, 10],
              ]}
            />
            <button className="w-full mt-3 text-[11px] border border-gray-200 rounded py-1.5 hover:bg-gray-50">
              打开提示词编辑器
            </button>
          </Cb>
        </>
      );
      break;

    // ── fallback ─────────────────────────────────────────────────────────────
    default:
      content = (
        <div className="text-center py-8 text-gray-400 text-[12px]">配置待补充</div>
      );
  }

  return <div className="p-4 space-y-3">{content}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper: 3-label range (used only in niche section)
// ─────────────────────────────────────────────────────────────────────────────

function RangeWith3Labels({
  defaultValue,
  labels,
}: {
  defaultValue: number;
  labels: [string, string, string];
}) {
  const [val, setVal] = useState(defaultValue);
  return (
    <>
      <input
        type="range"
        min={0}
        max={2}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full input-range"
      />
      <div className="flex justify-between text-[9px] text-gray-500 mt-1">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
        <span>{labels[2]}</span>
      </div>
    </>
  );
}
