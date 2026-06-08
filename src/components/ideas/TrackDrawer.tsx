// TrackDrawer — Task E3.
// 赛道详情抽屉 (wide, store-driven). Reproduces PROTO 1636-2016.
// Data-driven fields: emoji/title/verdict(+tone)/tagline/kpi-rpm(+note)/kpi-creators/kpi-supply/kpi-window(+tone).
// Sections ②–⑦ are static demo content from PROTO.
import { useState, useEffect } from "react";
import { useUi } from "@/store/uiStore";
import { dataProvider } from "@/services/dataProvider";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { TrackDetail } from "@/types/ideas";
import { verdictToneClass, windowToneClass } from "./toneMaps";

export function TrackDrawer() {
  const { open, key } = useUi((s) => s.trackDrawer);
  const closeTrackDrawer = useUi((s) => s.closeTrackDrawer);
  const compareList = useUi((s) => s.compareList);
  const toggleCompare = useUi((s) => s.toggleCompare);

  const [detail, setDetail] = useState<TrackDetail | undefined>(undefined);

  // expand/collapse state for each collapsible section
  const [showMoreVideos, setShowMoreVideos] = useState(false);
  const [showMoreCreators, setShowMoreCreators] = useState(false);
  const [showMoreFormulas, setShowMoreFormulas] = useState(false);

  // bookmark / save toggles (decorative local state)
  const [savedVideos, setSavedVideos] = useState<Record<string, boolean>>({});
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (key) {
      dataProvider.getTrackDetail(key).then(setDetail);
    }
  }, [key]);

  // Reset expand state when drawer opens new track
  useEffect(() => {
    if (open) {
      setShowMoreVideos(false);
      setShowMoreCreators(false);
      setShowMoreFormulas(false);
      setSavedVideos({});
      setFollowedCreators({});
    }
  }, [open, key]);

  const inCompare = key ? compareList.includes(key) : false;

  function toggleVideoSave(id: string) {
    setSavedVideos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleCreatorFollow(id: string) {
    setFollowedCreators((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <>
      {/* Mask */}
      <div
        className={cn("drawer-mask", open && "show")}
        onClick={closeTrackDrawer}
      />

      {/* Aside */}
      <aside
        className={cn("drawer wide flex flex-col", open && "open")}
        style={{ zIndex: 40 }}
      >
        {/* ── Header (PROTO 1640-1650) ──────────────────────────────────────── */}
        <div className="border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[18px]">{detail?.emoji ?? "🤖"}</span>
            <h3 className="text-[15px] font-bold truncate">{detail?.title ?? ""}</h3>
            {detail && (
              <span
                className={cn(
                  "text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0 border",
                  verdictToneClass[detail.verdictTone]
                )}
              >
                {detail.verdict}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
              <Icon.Bookmark size={10} />
              关注此赛道
            </button>
            <button
              onClick={closeTrackDrawer}
              className="w-7 h-7 grid place-items-center text-gray-400 hover:bg-gray-100 rounded"
            >
              <Icon.Close size={14} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ① 画像 + KPI + 为什么热 (PROTO 1655-1679) */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-200 px-5 py-4">
            <p className="text-[12px] text-gray-700 mb-3 leading-relaxed">
              {detail?.tag ?? ""}
            </p>

            {/* 4 KPI tiles */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-white rounded-lg p-2.5">
                <div className="text-[9px] text-gray-500 uppercase">RPM (美区)</div>
                <div className="text-[18px] font-black font-mono text-emerald-700 mt-0.5">
                  {detail?.rpm ?? "—"}
                </div>
                <div className="text-[9px] text-gray-500">
                  {detail?.rpmNote ?? "广告收入 / 千次播放"}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <div className="text-[9px] text-gray-500 uppercase">活跃博主</div>
                <div className="text-[18px] font-black font-mono mt-0.5">
                  {detail?.creators ?? "—"}
                </div>
                <div className="text-[9px] text-gray-500">近 30d 有更新</div>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <div className="text-[9px] text-gray-500 uppercase">月均供给</div>
                <div className="text-[18px] font-black font-mono mt-0.5">
                  {detail?.supply ?? "—"}
                </div>
                <div className="text-[9px] text-gray-500">新视频/月</div>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <div className="text-[9px] text-gray-500 uppercase">起号窗口</div>
                <div
                  className={cn(
                    "text-[18px] font-black font-mono mt-0.5",
                    detail ? windowToneClass[detail.windowTone] : "text-gray-500"
                  )}
                >
                  {detail?.window ?? "—"}
                </div>
                <div className="text-[9px] text-gray-500">头部稀疏 · 算法红利</div>
              </div>
            </div>

            {/* 为什么热 (static demo text, PROTO 1668-1671) */}
            <div className="bg-white/70 rounded-lg p-2.5 border-l-2 border-orange-400">
              <div className="text-[11px] font-bold text-orange-700 mb-1 flex items-center gap-1">
                <Icon.Fire size={10} />
                为什么这赛道现在热
              </div>
              <p className="text-[11px] text-gray-700 leading-relaxed">
                近 14d 全网 outlier 视频{" "}
                <b className="text-orange-700">23 条</b>
                (+34% vs 前 30d);近 30d 出现{" "}
                <b className="text-fuchsia-700">7 个拐点小号</b>
                (从中位 5K 升至 50K+),"工具实战 + 真实成本"角度集中爆发但未饱和;关键词{" "}
                <code className="bg-gray-100 px-1 rounded text-[10px]">claude code agent</code>
                {" "}/{" "}
                <code className="bg-gray-100 px-1 rounded text-[10px]">devin vs cursor</code>
                {" "}搜量上升、竞争弱、优化空白。
              </p>
            </div>

            {/* 起号 3 标签 (PROTO 1674-1678) */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold rounded px-2 py-0.5">
                ✓ 冷启友好
              </span>
              <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold rounded px-2 py-0.5">
                ✓ 供给稀缺
              </span>
              <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold rounded px-2 py-0.5">
                ✓ 可复制
              </span>
            </div>
          </div>

          {/* ② 今日爆款 top3 (PROTO 1681-1808) */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[12px] font-bold flex items-center gap-1.5">
                <Icon.Fire size={11} className="text-orange-500" />
                今日爆款 · outlier ≥ 3x
              </div>
              <span className="text-[10px] text-gray-400 font-mono">23 条 · 取 top 3</span>
            </div>
            <div className="space-y-2">

              {/* 视频 1 */}
              <div className="flex gap-3 p-2 rounded-lg hover:bg-orange-50/40 cursor-pointer group">
                <div className="w-28 h-16 rounded bg-gradient-to-br from-indigo-200 to-purple-300 shrink-0 grid place-items-center text-[9px] text-indigo-700 font-bold relative">
                  thumb
                  <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded">14:32</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-[12px] font-bold leading-tight">
                      I built an AI Agent in 1 hour with Claude Code (no code!)
                    </h5>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black rounded px-1.5 py-0.5 font-mono">7.8x</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVideoSave("v1"); }}
                        className={cn(
                          "w-6 h-6 grid place-items-center rounded",
                          savedVideos["v1"]
                            ? "text-amber-600 bg-amber-50"
                            : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                        )}
                        title={savedVideos["v1"] ? "已收藏 · 点击取消" : "收藏此视频到我的关注库"}
                      >
                        <Icon.Bookmark size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    📺 @MattVidPro · 42K · 5 天前 · <b>312K</b> views · velocity <b className="text-emerald-700">~890/hr</b>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1 italic">
                    "1 小时" 反成本钩子 + 屏幕录制零门槛演示,前 30s 直接出工具截图无导言。
                  </div>
                </div>
              </div>

              {/* 视频 2 */}
              <div className="flex gap-3 p-2 rounded-lg hover:bg-orange-50/40 cursor-pointer">
                <div className="w-28 h-16 rounded bg-gradient-to-br from-rose-200 to-orange-300 shrink-0 grid place-items-center text-[9px] text-rose-700 font-bold relative">
                  thumb
                  <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded">21:08</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-[12px] font-bold leading-tight">Devin vs Claude Code — 5 真实任务测评</h5>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black rounded px-1.5 py-0.5 font-mono">5.2x</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVideoSave("v2"); }}
                        className={cn(
                          "w-6 h-6 grid place-items-center rounded",
                          savedVideos["v2"]
                            ? "text-amber-600 bg-amber-50"
                            : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                        )}
                        title={savedVideos["v2"] ? "已收藏" : "收藏此视频"}
                      >
                        <Icon.Bookmark size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    📺 @CodeWizard{" "}
                    <span className="bg-fuchsia-100 text-fuchsia-700 text-[8px] font-bold rounded px-1">拐点</span>
                    {" "}· 11K · 2 天前 · <b>189K</b> views · v/subs <b className="text-emerald-700">17.2x</b>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1 italic">
                    5 个并排对照实验,选题(非账号)驱动播放 — 该号历史中位 8K,这条 23x。
                  </div>
                </div>
              </div>

              {/* 视频 3 */}
              <div className="flex gap-3 p-2 rounded-lg hover:bg-orange-50/40 cursor-pointer">
                <div className="w-28 h-16 rounded bg-gradient-to-br from-amber-200 to-yellow-300 shrink-0 grid place-items-center text-[9px] text-amber-700 font-bold relative">
                  thumb
                  <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded">08:45</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-[12px] font-bold leading-tight">为什么我又退回 Cursor 了 — 三周 AI Agent 真相</h5>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black rounded px-1.5 py-0.5 font-mono">3.4x</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVideoSave("v3"); }}
                        className={cn(
                          "w-6 h-6 grid place-items-center rounded",
                          savedVideos["v3"]
                            ? "text-amber-600 bg-amber-50"
                            : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                        )}
                        title={savedVideos["v3"] ? "已收藏" : "收藏此视频"}
                      >
                        <Icon.Bookmark size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    📺 @IndieDevLife · 28K · 4 天前 · <b>96K</b> views · 互动 <b className="text-emerald-700">9.2%</b>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1 italic">
                    反主流叙事("退回"逆潮流),用户共鸣 → 互动 9.2% 远超均值。
                  </div>
                </div>
              </div>

              {/* 展开后的视频 4-7 */}
              {showMoreVideos && (
                <div className="space-y-2">
                  <div className="flex gap-3 p-2 rounded-lg hover:bg-orange-50/40 cursor-pointer">
                    <div className="w-28 h-16 rounded bg-gradient-to-br from-emerald-200 to-teal-300 shrink-0 grid place-items-center text-[9px] text-emerald-700 font-bold relative">
                      thumb
                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded">12:04</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-[12px] font-bold leading-tight">用 Aider 重构 10 年老项目 — 24 小时真实记录</h5>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black rounded px-1.5 py-0.5 font-mono">4.6x</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVideoSave("v4"); }}
                            className={cn(
                              "w-6 h-6 grid place-items-center rounded",
                              savedVideos["v4"] ? "text-amber-600 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                            )}
                          >
                            <Icon.Bookmark size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">📺 @VimDevLife · 18K · 6 天前 · <b>83K</b> views · 互动 <b>7.1%</b></div>
                      <div className="text-[10px] text-gray-600 mt-1 italic">"24 小时" 时间限定钩子 + 老项目共情,程序员痛点直击。</div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-2 rounded-lg hover:bg-orange-50/40 cursor-pointer">
                    <div className="w-28 h-16 rounded bg-gradient-to-br from-sky-200 to-blue-300 shrink-0 grid place-items-center text-[9px] text-sky-700 font-bold relative">
                      thumb
                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded">06:20</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-[12px] font-bold leading-tight">Cursor 0.45 隐藏功能 5 个 — 看完省 2 小时/天</h5>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black rounded px-1.5 py-0.5 font-mono">4.2x</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVideoSave("v5"); }}
                            className={cn(
                              "w-6 h-6 grid place-items-center rounded",
                              savedVideos["v5"] ? "text-amber-600 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                            )}
                          >
                            <Icon.Bookmark size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">📺 @ShipFastDev · 31K · 3 天前 · <b>132K</b> views · v/subs <b className="text-emerald-700">4.3x</b></div>
                      <div className="text-[10px] text-gray-600 mt-1 italic">"省 2 小时/天" 量化收益钩子 + 数字列表结构,实用主义工作流。</div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-2 rounded-lg hover:bg-orange-50/40 cursor-pointer">
                    <div className="w-28 h-16 rounded bg-gradient-to-br from-purple-200 to-fuchsia-300 shrink-0 grid place-items-center text-[9px] text-purple-700 font-bold relative">
                      thumb
                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded">18:50</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-[12px] font-bold leading-tight">我花了 $0 跑了 Claude Agent 一周 (完整工作流)</h5>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black rounded px-1.5 py-0.5 font-mono">3.9x</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVideoSave("v6"); }}
                            className={cn(
                              "w-6 h-6 grid place-items-center rounded",
                              savedVideos["v6"] ? "text-amber-600 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                            )}
                          >
                            <Icon.Bookmark size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        📺 @AiGeek{" "}
                        <span className="bg-fuchsia-100 text-fuchsia-700 text-[8px] font-bold rounded px-1">拐点</span>
                        {" "}· 7K · 1 天前 · <b>54K</b> views · v/subs <b className="text-emerald-700">7.7x</b>
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1 italic">"$0" 反成本钩子 + 起号期博主自身故事,小号天然共情。</div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-2 rounded-lg hover:bg-orange-50/40 cursor-pointer">
                    <div className="w-28 h-16 rounded bg-gradient-to-br from-orange-200 to-red-300 shrink-0 grid place-items-center text-[9px] text-orange-700 font-bold relative">
                      thumb
                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded">09:18</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-[12px] font-bold leading-tight">独立开发者真实工作流 vs 演示视频 — 我们都被骗了</h5>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black rounded px-1.5 py-0.5 font-mono">3.6x</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVideoSave("v7"); }}
                            className={cn(
                              "w-6 h-6 grid place-items-center rounded",
                              savedVideos["v7"] ? "text-amber-600 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                            )}
                          >
                            <Icon.Bookmark size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">📺 @RealCodingLife · 22K · 4 天前 · <b>78K</b> views · 互动 <b className="text-emerald-700">10.4%</b></div>
                      <div className="text-[10px] text-gray-600 mt-1 italic">"反演示"叙事 + "我们都被骗了"集体共情,互动率破 10%。</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowMoreVideos((v) => !v)}
              className="w-full text-[10px] text-gray-400 hover:text-orange-600 mt-2 py-1"
            >
              {showMoreVideos ? "收起 ↑" : "展开剩余 20 条 →"}
            </button>
          </div>

          {/* ③ 拐点博主 (PROTO 1810-1923) */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[12px] font-bold flex items-center gap-1.5">
                <Icon.ChartLine size={11} className="text-fuchsia-500" />
                拐点博主 · 算法红利窗口
              </div>
              <span className="text-[10px] text-gray-400 font-mono">7 个 · 取 top 3</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* @CodeWizard */}
              <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-fuchsia-50/30 cursor-pointer relative">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("cw"); }}
                  className={cn(
                    "absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded",
                    followedCreators["cw"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                  )}
                  title={followedCreators["cw"] ? "已关注 · 点击取消" : "关注此博主"}
                >
                  <Icon.Star size={11} />
                </button>
                <div className="flex items-start gap-2 pr-6">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 grid place-items-center text-white text-[11px] font-black shrink-0">CW</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate">@CodeWizard</div>
                    <div className="text-[9px] text-gray-500">11K · 号龄 4 月</div>
                  </div>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-gray-50 rounded p-1"><div className="text-[8px] text-gray-500">历史中位</div><div className="font-mono font-bold">8K</div></div>
                  <div className="bg-fuchsia-100 rounded p-1"><div className="text-[8px] text-fuchsia-700">近 3 条均</div><div className="font-mono font-bold text-fuchsia-700">187K</div></div>
                </div>
                <div className="text-[9px] text-fuchsia-700 mt-1 leading-snug">delta: 切到"对照测评" + 标题数字打头</div>
              </div>

              {/* @AIShortsDaily */}
              <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-fuchsia-50/30 cursor-pointer relative">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("as"); }}
                  className={cn(
                    "absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded",
                    followedCreators["as"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                  )}
                  title={followedCreators["as"] ? "已关注 · 点击取消" : "关注此博主"}
                >
                  <Icon.Star size={11} />
                </button>
                <div className="flex items-start gap-2 pr-6">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 grid place-items-center text-white text-[11px] font-black shrink-0">AS</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate">@AIShortsDaily</div>
                    <div className="text-[9px] text-gray-500">23K · 号龄 8 月</div>
                  </div>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-gray-50 rounded p-1"><div className="text-[8px] text-gray-500">历史中位</div><div className="font-mono font-bold">12K</div></div>
                  <div className="bg-fuchsia-100 rounded p-1"><div className="text-[8px] text-fuchsia-700">近 3 条均</div><div className="font-mono font-bold text-fuchsia-700">68K</div></div>
                </div>
                <div className="text-[9px] text-fuchsia-700 mt-1 leading-snug">delta: 60s Shorts 切 8-12min 中视频</div>
              </div>

              {/* @AiGeek */}
              <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-fuchsia-50/30 cursor-pointer relative">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("ag"); }}
                  className={cn(
                    "absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded",
                    followedCreators["ag"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                  )}
                  title={followedCreators["ag"] ? "已关注 · 点击取消" : "关注此博主"}
                >
                  <Icon.Star size={11} />
                </button>
                <div className="flex items-start gap-2 pr-6">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center text-white text-[11px] font-black shrink-0">AG</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate">@AiGeek</div>
                    <div className="text-[9px] text-gray-500">7K · 号龄 3 月</div>
                  </div>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-gray-50 rounded p-1"><div className="text-[8px] text-gray-500">历史中位</div><div className="font-mono font-bold">3K</div></div>
                  <div className="bg-fuchsia-100 rounded p-1"><div className="text-[8px] text-fuchsia-700">近 3 条均</div><div className="font-mono font-bold text-fuchsia-700">42K</div></div>
                </div>
                <div className="text-[9px] text-fuchsia-700 mt-1 leading-snug">delta: 标题"我用 X 赚了 Y"钩子升级</div>
              </div>
            </div>

            {/* 展开后的拐点博主 4-7 + 头部参考 */}
            {showMoreCreators && (
              <div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {/* @ShipFastDev */}
                  <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-fuchsia-50/30 cursor-pointer relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("sf"); }}
                      className={cn("absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded", followedCreators["sf"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50")}
                    >
                      <Icon.Star size={11} />
                    </button>
                    <div className="flex items-start gap-2 pr-6">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 grid place-items-center text-white text-[11px] font-black shrink-0">SF</div>
                      <div className="flex-1 min-w-0"><div className="text-[11px] font-bold truncate">@ShipFastDev</div><div className="text-[9px] text-gray-500">31K · 号龄 11 月</div></div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
                      <div className="bg-gray-50 rounded p-1"><div className="text-[8px] text-gray-500">历史中位</div><div className="font-mono font-bold">28K</div></div>
                      <div className="bg-fuchsia-100 rounded p-1"><div className="text-[8px] text-fuchsia-700">近 3 条均</div><div className="font-mono font-bold text-fuchsia-700">112K</div></div>
                    </div>
                    <div className="text-[9px] text-fuchsia-700 mt-1 leading-snug">delta: 加 "省 X 时间/天" 量化收益钩子</div>
                  </div>
                  {/* @VimDevLife */}
                  <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-fuchsia-50/30 cursor-pointer relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("vd"); }}
                      className={cn("absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded", followedCreators["vd"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50")}
                    >
                      <Icon.Star size={11} />
                    </button>
                    <div className="flex items-start gap-2 pr-6">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 grid place-items-center text-white text-[11px] font-black shrink-0">VD</div>
                      <div className="flex-1 min-w-0"><div className="text-[11px] font-bold truncate">@VimDevLife</div><div className="text-[9px] text-gray-500">18K · 号龄 6 月</div></div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
                      <div className="bg-gray-50 rounded p-1"><div className="text-[8px] text-gray-500">历史中位</div><div className="font-mono font-bold">9K</div></div>
                      <div className="bg-fuchsia-100 rounded p-1"><div className="text-[8px] text-fuchsia-700">近 3 条均</div><div className="font-mono font-bold text-fuchsia-700">53K</div></div>
                    </div>
                    <div className="text-[9px] text-fuchsia-700 mt-1 leading-snug">delta: 切到老项目重构主题</div>
                  </div>
                  {/* @RealCodingLife */}
                  <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-fuchsia-50/30 cursor-pointer relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("rc"); }}
                      className={cn("absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded", followedCreators["rc"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50")}
                    >
                      <Icon.Star size={11} />
                    </button>
                    <div className="flex items-start gap-2 pr-6">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 grid place-items-center text-white text-[11px] font-black shrink-0">RC</div>
                      <div className="flex-1 min-w-0"><div className="text-[11px] font-bold truncate">@RealCodingLife</div><div className="text-[9px] text-gray-500">22K · 号龄 9 月</div></div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
                      <div className="bg-gray-50 rounded p-1"><div className="text-[8px] text-gray-500">历史中位</div><div className="font-mono font-bold">15K</div></div>
                      <div className="bg-fuchsia-100 rounded p-1"><div className="text-[8px] text-fuchsia-700">近 3 条均</div><div className="font-mono font-bold text-fuchsia-700">68K</div></div>
                    </div>
                    <div className="text-[9px] text-fuchsia-700 mt-1 leading-snug">delta: 加 "反演示" 真实工作流叙事</div>
                  </div>
                </div>

                {/* 头部参考 */}
                <div className="text-[10px] text-gray-400 mt-3 mb-1.5 flex items-center gap-1.5">
                  <Icon.Trophy size={9} />
                  头部参考博主 · 非拐点
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-gray-50 cursor-pointer relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("mv"); }}
                      className={cn("absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded", followedCreators["mv"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50")}
                    >
                      <Icon.Star size={11} />
                    </button>
                    <div className="flex items-start gap-2 pr-6">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 grid place-items-center text-white text-[11px] font-black shrink-0">MV</div>
                      <div className="flex-1 min-w-0"><div className="text-[11px] font-bold truncate">@MattVidPro</div><div className="text-[9px] text-gray-500">42K · 头部 · 月增 +18%</div></div>
                    </div>
                    <div className="text-[9px] text-gray-600 mt-1.5 leading-snug">中位 38K · 稳定输出 AI 工具实测</div>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-gray-50 cursor-pointer relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("fs"); }}
                      className={cn("absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded", followedCreators["fs"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50")}
                    >
                      <Icon.Star size={11} />
                    </button>
                    <div className="flex items-start gap-2 pr-6">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 grid place-items-center text-white text-[11px] font-black shrink-0">FS</div>
                      <div className="flex-1 min-w-0"><div className="text-[11px] font-bold truncate">@Fireship</div><div className="text-[9px] text-gray-500">3.2M · 行业头部 · 平稳</div></div>
                    </div>
                    <div className="text-[9px] text-gray-600 mt-1.5 leading-snug">100s 极简快讯 · 信息密度 benchmark</div>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-2.5 hover:bg-gray-50 cursor-pointer relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCreatorFollow("cd"); }}
                      className={cn("absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded", followedCreators["cd"] ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50")}
                    >
                      <Icon.Star size={11} />
                    </button>
                    <div className="flex items-start gap-2 pr-6">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 grid place-items-center text-white text-[11px] font-black shrink-0">CD</div>
                      <div className="flex-1 min-w-0"><div className="text-[11px] font-bold truncate">@CodingDev</div><div className="text-[9px] text-gray-500">87K · 头部 · 平稳</div></div>
                    </div>
                    <div className="text-[9px] text-gray-600 mt-1.5 leading-snug">教程长视频 8-15min 主线</div>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowMoreCreators((v) => !v)}
              className="w-full text-[10px] text-gray-400 hover:text-fuchsia-600 mt-2 py-1"
            >
              {showMoreCreators ? "收起 ↑" : "展开剩余 4 个拐点博主 + 头部参考 →"}
            </button>
          </div>

          {/* ④ 赛道内容公式 (PROTO 1926-1973) */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[12px] font-bold flex items-center gap-1.5">
                <Icon.Dna size={11} className="text-purple-500" />
                赛道内容公式 · LLM 中度拆解
              </div>
              <span className="text-[10px] text-gray-400 font-mono">5 个公式 · 取 top 2</span>
            </div>
            <div className="space-y-2">
              <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="text-[12px] font-bold text-purple-800">① "X 小时/X 元做出 Y" 反成本钩子</div>
                  <span className="text-[10px] font-mono text-emerald-700">出现 43 次 · 均 4.2x</span>
                </div>
                <div className="text-[10px] text-gray-700 leading-relaxed">
                  <b>结构:</b> 标题数字打头 → 前 5s 直接出工具截图 → 章节 = 设置/演示/翻车/复盘 → 反口 "看起来不可能但..." → 封面 = 工具 logo + 大字时间数字
                </div>
              </div>
              <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="text-[12px] font-bold text-purple-800">② "A vs B" 对照测评</div>
                  <span className="text-[10px] font-mono text-emerald-700">出现 38 次 · 均 3.8x</span>
                </div>
                <div className="text-[10px] text-gray-700 leading-relaxed">
                  <b>结构:</b> 标题 "A vs B" → 前 10s 摆 5 个对照任务 → 中段并排实测 → 结论必须非平局 → 评分卡封面
                </div>
              </div>

              {/* 展开后的公式 3-5 */}
              {showMoreFormulas && (
                <div className="space-y-2">
                  <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-[12px] font-bold text-purple-800">③ "我又退回 X" 反主流叙事</div>
                      <span className="text-[10px] font-mono text-emerald-700">出现 21 次 · 均 3.6x</span>
                    </div>
                    <div className="text-[10px] text-gray-700 leading-relaxed">
                      <b>结构:</b> 标题 "退回/抛弃" 反潮流 → 前 15s 自嘲性故事 → 章节 = 我曾经吹捧/痛点出现/退回 → 反口 "我以前也觉得 X 是未来" → 封面 = 反向箭头 + 旧工具
                    </div>
                  </div>
                  <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-[12px] font-bold text-purple-800">④ "隐藏功能 N 个" 信息密度型</div>
                      <span className="text-[10px] font-mono text-emerald-700">出现 17 次 · 均 3.3x</span>
                    </div>
                    <div className="text-[10px] text-gray-700 leading-relaxed">
                      <b>结构:</b> 标题 "隐藏/未公开 + 数字" → 前 5s 列 5 项目录 → 每项 60-90s 演示 → 时间戳章节卡 → 封面 = 编号列表 + 锁/钥匙符号
                    </div>
                  </div>
                  <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-[12px] font-bold text-purple-800">⑤ "真实 vs 演示" 反演示路线</div>
                      <span className="text-[10px] font-mono text-emerald-700">出现 14 次 · 均 4.8x</span>
                    </div>
                    <div className="text-[10px] text-gray-700 leading-relaxed">
                      <b>结构:</b> 标题 "真实/我们都被骗了" → 前 10s 列出演示视频常见承诺 → 真实工作流演示翻车 + 长尾时间 → 反口 "演示视频从不告诉你的是..." → 封面 = 滤镜对比 / 工具+生活照
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowMoreFormulas((v) => !v)}
              className="w-full text-[10px] text-gray-400 hover:text-purple-600 mt-2 py-1"
            >
              {showMoreFormulas ? "收起 ↑" : "展开剩余 3 个公式 →"}
            </button>
          </div>

          {/* ⑤ 关键词机会缺口 (PROTO 1975-1984) */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-[12px] font-bold mb-2 flex items-center gap-1.5">
              <Icon.Key size={11} className="text-amber-500" />
              关键词机会缺口
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="bg-emerald-50 rounded p-2 flex items-center justify-between">
                <span className="font-semibold">claude code agent</span>
                <span className="text-[9px] font-mono">
                  <span className="text-emerald-700">搜量↑↑</span> · <span className="text-amber-700">竞争弱</span>
                </span>
              </div>
              <div className="bg-emerald-50 rounded p-2 flex items-center justify-between">
                <span className="font-semibold">devin vs cursor</span>
                <span className="text-[9px] font-mono">
                  <span className="text-emerald-700">搜量↑</span> · <span className="text-emerald-700">无优化</span>
                </span>
              </div>
              <div className="bg-amber-50 rounded p-2 flex items-center justify-between">
                <span className="font-semibold">aider real world</span>
                <span className="text-[9px] font-mono">
                  <span className="text-amber-700">搜量中</span> · <span className="text-emerald-700">无优化</span>
                </span>
              </div>
              <div className="bg-amber-50 rounded p-2 flex items-center justify-between">
                <span className="font-semibold">vibe coding</span>
                <span className="text-[9px] font-mono">
                  <span className="text-fuchsia-700">新词</span> · <span className="text-emerald-700">竞争弱</span>
                </span>
              </div>
            </div>
          </div>

          {/* ⑥ 商业化路径 (PROTO 1986-1994) */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-[12px] font-bold mb-2 flex items-center gap-1.5">
              <Icon.Dollar size={11} className="text-emerald-600" />
              商业化路径
            </div>
            <div className="text-[11px] text-gray-700 space-y-1.5 leading-relaxed">
              <div><b className="text-emerald-700">主收入</b>: 联盟营销 — Cursor / Claude / Devin 都给 30-50% 分佣</div>
              <div><b className="text-emerald-700">次收入</b>: YT 广告 RPM $5-10 / "AI 怎么赚钱"角度可破 $15</div>
              <div className="bg-amber-50 text-amber-800 rounded p-2 text-[11px]">
                <b>⚠ 红线</b>: 严禁承诺具体收益("月入 X 美元"),YT 正在严打。改用"我试了 X"体验叙事。
              </div>
            </div>
          </div>

          {/* ⑦ 跨赛道交叉 (PROTO 1996-2004) */}
          <div className="px-5 py-4">
            <div className="text-[12px] font-bold mb-2 flex items-center gap-1.5">
              <Icon.Shuffle size={11} className="text-purple-500" />
              跨赛道交叉机会
            </div>
            <div className="text-[11px] text-gray-700 space-y-1.5">
              <div className="border-l-2 border-fuchsia-400 pl-2">
                <b>× 心理</b>: "用 AI Agent 治拖延" — 2 条爆款 15万+均
              </div>
              <div className="border-l-2 border-emerald-400 pl-2">
                <b>× 投资</b>: "AI 帮我做股票分析" — 3 条破 50万
              </div>
              <div className="border-l-2 border-amber-400 pl-2">
                <b>× 健身</b>: "AI 私教 vs 真人" — 新兴 · 4 条 outlier
              </div>
            </div>
          </div>

        </div>

        {/* ── Sticky footer (PROTO 2008-2015) ──────────────────────────────── */}
        <div className="border-t border-gray-200 px-5 py-3 flex items-center justify-between shrink-0 bg-white">
          <div className="text-[10px] text-gray-400 font-mono">
            snapshot 14d · ●●○ velocity 部分真值
          </div>
          <div className="flex gap-1.5">
            {/* 加入对比 / 移出对比 button */}
            <button
              onClick={() => key && toggleCompare(key)}
              className={cn(
                "text-[11px] px-3 py-1.5 rounded font-semibold",
                inCompare
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              {inCompare ? "✓ 已加入对比" : "⊕ 加入对比"}
            </button>
            <button className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded font-bold">
              为此赛道建频道 →
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
