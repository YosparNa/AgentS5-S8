// IdeasView — 还原 09index-v7.html #view-ideas (PROTO 598–634)
// Shell + radar pane (E2). Library + inbox panes: E4.
// Data via dataProvider only — NO direct src/data/* imports.
import { useEffect, useState } from "react";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { dataProvider } from "@/services/dataProvider";
import type { TrackRanking, RadarCluster, LibraryData, InboxItem } from "@/types/ideas";
import { RadarRankingCard } from "@/components/ideas/RadarRankingCard";
import { SearchFlow } from "@/components/ideas/SearchFlow";
import { CompareBanner } from "@/components/ideas/CompareBanner";
import { TrackDrawer } from "@/components/ideas/TrackDrawer";
import { CompareModal } from "@/components/ideas/CompareModal";
import { LibraryTracks } from "@/components/ideas/LibraryTracks";
import { LibraryCreators } from "@/components/ideas/LibraryCreators";
import { LibraryVideos } from "@/components/ideas/LibraryVideos";
import { InboxList } from "@/components/ideas/InboxList";

// Local view-model: extends TrackRanking with an isNew flag (not persisted to shared types)
interface RankingVM extends TrackRanking {
  __isNew?: boolean;
}

/** Build a RankingVM from a sunk RadarCluster (rank = 0, isNew = true) */
function clusterToRanking(c: RadarCluster): RankingVM {
  return {
    key: c.key,
    rank: c.rank ?? 0,
    emoji: c.emoji,
    title: c.title,
    verdict: c.verdict,
    verdictTone: c.verdictTone,
    rpm: c.rpm,
    hot: c.hot,
    turning: c.turning,
    active: c.active,
    score: c.score,
    badge: c.badge ?? null,
    windowBadge: undefined,
    __isNew: true,
  };
}

const INITIAL_VISIBLE = 8;

export function IdeasView() {
  const { ideasMode, setIdeasMode, librarySub, setLibrarySub } = useUi();

  const [ranking, setRanking] = useState<RankingVM[]>([]);
  const [trackCount, setTrackCount] = useState(13);
  const [expanded, setExpanded] = useState(false);

  // E4: library + inbox state
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);

  // Load ranking on mount
  useEffect(() => {
    dataProvider.listTracks().then((tracks) => {
      setRanking(tracks);
      setTrackCount(tracks.length);
    });
  }, []);

  // Load library on demand
  useEffect(() => {
    if (ideasMode === "library" && library === null) {
      dataProvider.listLibrary().then(setLibrary);
    }
  }, [ideasMode, library]);

  // Load inbox on demand
  useEffect(() => {
    if (ideasMode === "inbox" && inboxItems.length === 0) {
      dataProvider.listInbox().then(setInboxItems);
    }
  }, [ideasMode, inboxItems.length]);

  // Called by SearchFlow when user sinks a cluster
  function handleSink(cluster: RadarCluster) {
    setRanking((prev) => {
      // Avoid duplicate
      if (prev.some((t) => t.key === cluster.key)) return prev;
      return [clusterToRanking(cluster), ...prev];
    });
    setTrackCount((n) => n + 1);
  }

  // Visible ranking list (expand/collapse)
  const visibleRanking = expanded ? ranking : ranking.slice(0, INITIAL_VISIBLE);

  // Tab definitions
  const tabs = [
    {
      key: "radar" as const,
      label: "🛰️ 雷达广场",
      sub: "全网情报库 · 永远在跑",
    },
    {
      key: "library" as const,
      label: "📚 我的关注库",
      sub: (
        <>
          已关注赛道/博主/视频{" "}
          <span className="bg-amber-50 text-amber-700 rounded px-1 ml-0.5">12</span>
        </>
      ),
    },
    {
      key: "inbox" as const,
      label: "📥 频道收件箱",
      sub: (
        <>
          本号待启动 L3{" "}
          <span className="bg-emerald-50 text-emerald-700 rounded px-1 ml-0.5">28</span>
        </>
      ),
    },
  ] as const;

  return (
    <section className="h-full overflow-y-auto" style={{ background: "#f6f7fb" }}>
      <div className="max-w-[1400px] mx-auto p-6 w-full">

        {/* ── Header (PROTO 601–618) ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-[20px] font-black mb-1 flex items-center gap-2">
              选题池{" "}
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                全网雷达广场
              </span>
            </h2>
            <p className="text-[12px] text-gray-500">
              系统后台持续监控全网 <b className="text-gray-700">68</b> 个赛道 · 累计{" "}
              <b className="text-gray-700">42,180</b> 视频 · <b className="text-gray-700">8,420</b>{" "}
              博主 · 上次刷新 <b className="text-gray-700">12 分钟前</b>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 镜头 button — decorative */}
            <button className="text-[11px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-gray-50">
              <Icon.Eye className="text-gray-400 w-[10px] h-[10px]" />
              <span>镜头：</span>
              <span className="font-bold">AI 工具频道</span>
              <Icon.ChevronDown className="w-[8px] h-[8px] text-gray-400 ml-1" />
            </button>
            {/* 我的关注 button */}
            <button
              onClick={() => setIdeasMode("library")}
              className="text-[11px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5 font-semibold"
            >
              <Icon.Bookmark className="w-[10px] h-[10px]" />
              我的关注 <span className="font-mono">12</span>
            </button>
          </div>
        </div>

        {/* ── Mode segmented tabs + snapshot meta (PROTO 620–634) ─────────── */}
        <div className="flex items-end justify-between mb-4 border-b border-gray-200">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setIdeasMode(tab.key)}
                className={[
                  "px-4 py-2.5 text-[13px] font-bold border-b-2 flex items-center gap-2 transition-colors",
                  ideasMode === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-400 hover:text-gray-700",
                ].join(" ")}
              >
                {tab.label}{" "}
                <span className="text-[10px] font-normal text-gray-400">{tab.sub}</span>
              </button>
            ))}
          </div>
          <div className="text-[10px] text-gray-400 font-mono pb-2">
            snapshot 已积累 <b className="text-gray-700">14 天</b> · 数据置信度{" "}
            <span className="text-emerald-600">●●○</span>
          </div>
        </div>

        {/* ── Pane rendering ───────────────────────────────────────────────── */}

        {/* ── Radar pane (E2) ─────────────────────────────────────────────── */}
        {ideasMode === "radar" && (
          <div data-pane="radar">

            {/* Compare sticky banner (E3) */}
            <CompareBanner />

            {/* Title + monitored-count line (PROTO 653–663) */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <h3 className="text-[16px] font-bold">今天值得进场的赛道</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  系统持续监控{" "}
                  <b className="text-gray-700">{trackCount}</b> 个赛道 · 综合 RPM + 爆款密度 + 起号窗口排序
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <button className="text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                  排序：<span className="font-semibold text-indigo-600">综合分 ↓</span>
                  <Icon.ChevronDown className="w-[8px] h-[8px]" />
                </button>
                <span className="text-gray-300">·</span>
                <button className="text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                  <Icon.Sliders className="w-[10px] h-[10px] mr-0.5" />
                  我的偏好
                </button>
              </div>
            </div>

            {/* Search box + streaming flow */}
            <SearchFlow onSink={handleSink} />

            {/* Ranking list */}
            <div className="space-y-2">
              {visibleRanking.map((track) => (
                <RadarRankingCard
                  key={track.key}
                  track={track}
                  isNew={track.__isNew}
                />
              ))}
            </div>

            {/* Expand / collapse toggle */}
            {ranking.length > INITIAL_VISIBLE && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="text-[11px] text-gray-500 hover:text-indigo-600 flex items-center gap-1 mx-auto"
                >
                  {expanded ? (
                    <>
                      <Icon.ChevronUp className="w-[10px] h-[10px]" />
                      收起
                    </>
                  ) : (
                    <>
                      <Icon.ChevronDown className="w-[10px] h-[10px]" />
                      展开更多赛道 ({ranking.length - INITIAL_VISIBLE})
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        )}

        {/* ── Library pane (E4) ──────────────────────────────────────────── */}
        {ideasMode === "library" && (
          <div data-pane="library">
            {/* Sub-tab switcher (已关注赛道 / 关注博主 / 收藏视频) */}
            <div className="flex gap-1 mb-4 border-b border-gray-200">
              {(
                [
                  { key: "tracks" as const, label: "已关注赛道" },
                  { key: "creators" as const, label: "关注博主" },
                  { key: "videos" as const, label: "收藏视频" },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => setLibrarySub(sub.key)}
                  className={[
                    "px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors",
                    librarySub === sub.key
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-400 hover:text-gray-700",
                  ].join(" ")}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {library === null ? (
              <div className="text-[12px] text-gray-400 py-8 text-center">加载中…</div>
            ) : (
              <>
                {librarySub === "tracks" && (
                  <LibraryTracks tracks={library.tracks} />
                )}
                {librarySub === "creators" && (
                  <LibraryCreators creators={library.creators} />
                )}
                {librarySub === "videos" && (
                  <LibraryVideos videos={library.videos} />
                )}
              </>
            )}
          </div>
        )}

        {/* ── Inbox pane (E4) ────────────────────────────────────────────── */}
        {ideasMode === "inbox" && (
          <div data-pane="inbox">
            {/* Header banner (PROTO 1406–1428) */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon.Inbox className="text-indigo-600 w-[13px] h-[13px]" />
                    <span className="text-[13px] font-bold">本频道收件箱</span>
                    <span className="bg-white border border-gray-200 text-gray-700 text-[10px] font-bold rounded px-1.5 py-0.5">
                      📺 AI 工具频道
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded px-1.5 py-0.5">
                      运营中赛道: AI 工具教程
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    <b>内容来源</b>: 你关注的赛道/博主/视频{" "}
                    <b className="text-indigo-700">自动推送</b> + 本频道 S2/S2.5/S4{" "}
                    <b className="text-indigo-700">主动产出</b> + 手动新增。
                    <span className="text-gray-500">每条都标了"为什么进收件箱"。</span>
                  </p>
                  <p className="text-[11px] text-gray-700 leading-relaxed mt-0.5">
                    <b>下一步</b>: 点{" "}
                    <span className="bg-indigo-600 text-white text-[10px] font-bold rounded px-1.5 py-0.5">
                      启动 L3
                    </span>{" "}
                    → 进入 <b className="text-indigo-700">AI 工具频道</b> 任务工作台 → 跳过 S5 直接 S6 大纲生产。
                  </p>
                </div>
                <div className="text-right shrink-0 border-l border-indigo-200 pl-3">
                  <div className="text-[10px] text-gray-500 uppercase">候选总数</div>
                  <div className="text-[22px] font-black font-mono text-indigo-700">
                    {inboxItems.length || 28}
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono">snapshot 14d ●●○</div>
                </div>
              </div>
            </div>

            {/* Candidate list */}
            {inboxItems.length === 0 ? (
              <div className="text-[12px] text-gray-400 py-8 text-center">加载中…</div>
            ) : (
              <InboxList items={inboxItems} />
            )}
          </div>
        )}

      </div>

      {/* TrackDrawer + CompareModal — store-driven, mounted once (E3) */}
      <TrackDrawer />
      <CompareModal />
    </section>
  );
}
