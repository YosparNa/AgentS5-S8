// ChannelDetailView — 还原 09index #view-channel(行 402–528);切片 B3
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dataProvider } from "@/services/dataProvider";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import type { ChannelDetail } from "@/types";

export function ChannelDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openModal = useUi((s) => s.openModal);
  const [channel, setChannel] = useState<ChannelDetail | null>(null);

  useEffect(() => {
    if (id) {
      dataProvider.getChannel(id).then(setChannel);
    }
  }, [id]);

  if (!channel) return null;

  return (
    <section className="h-full overflow-y-auto bg-white">
      {/* ===== Header block ===== */}
      <div className="border-b border-gray-200 bg-gradient-to-br from-sky-50 to-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-start justify-between">
            {/* Left: emoji tile + channel info */}
            <div className="flex items-start gap-4">
              {/* Emoji tile */}
              <div className="w-16 h-16 rounded-2xl bg-white border border-sky-200 grid place-items-center shadow-sm text-3xl">
                {channel.emoji}
              </div>

              {/* Name + badges + desc + meta */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-[22px] font-black tracking-tight">
                    {channel.name}
                  </h1>
                  <span className="layer-pill layer-channel text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {channel.layerPill}
                  </span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                    {channel.lockedBadge}
                  </span>
                </div>
                <p className="text-[12px] text-gray-600">{channel.desc}</p>
                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                  {channel.meta.map((m, i) => {
                    // Prefix appropriate icon for each meta item
                    let iconEl: React.ReactNode = null;
                    if (i === 0) iconEl = <Icon.Youtube size={11} className="text-red-500 mr-1 inline" />;
                    else if (i === 1) iconEl = <Icon.Users size={11} className="mr-1 inline" />;
                    else if (i === 2) iconEl = <Icon.Video size={11} className="mr-1 inline" />;
                    else if (i === 3) iconEl = <Icon.Clock size={11} className="mr-1 inline" />;
                    return (
                      <span key={i}>
                        {iconEl}
                        {m}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => openModal("newMission")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5"
              >
                <Icon.Plus size={10} />
                新建视频任务
              </button>
              <button
                onClick={() => navigate("/workbench")}
                className="text-[11px] text-gray-600 hover:text-indigo-600 flex items-center gap-1"
              >
                <Icon.Sliders size={10} />
                L2 频道配置
              </button>
            </div>
          </div>

          {/* L2 stage cards */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {channel.l2Stages.map((stage, i) => (
              <button
                key={i}
                onClick={() => navigate("/workbench")}
                className="bg-white border border-sky-100 rounded-xl p-3 text-left hover:border-sky-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={"text-[10px] font-bold mono " + stage.codeCls}>
                    {stage.code}
                  </span>
                  <span className={"text-[9px] " + stage.badge.cls}>
                    {stage.badge.text}
                  </span>
                </div>
                <div className="text-[12px] font-semibold">{stage.title}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{stage.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Body ===== */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Filter tab row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 text-[12px] font-semibold">
              <button className="px-3 py-1.5 rounded-full bg-indigo-600 text-white">
                全部 8
              </button>
              <button className="px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100">
                运行中 3
              </button>
              <button className="px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100">
                待终审 1
              </button>
              <button className="px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100">
                已发布 3
              </button>
              <button className="px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100">
                草稿 1
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[11px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                排序：最近
              </button>
              <button className="text-[11px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                筛选
              </button>
            </div>
          </div>

          {/* 本频道爆款 section */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mb-2 flex items-center gap-1.5">
              <Icon.Trophy size={9} />
              本频道爆款 · CTR 高于均值 30%
            </div>
            <div className="grid grid-cols-3 gap-3">
              {channel.hits.map((hit) => (
                <div
                  key={hit.id}
                  className={"feature-card " + hit.grad}
                  style={{ aspectRatio: "16/8" }}
                >
                  <div className="meta-top">
                    <span className="text-[11px] font-semibold bg-white/20 backdrop-blur px-2 py-0.5 rounded">
                      {hit.badge}
                    </span>
                  </div>
                  <div className="body">
                    <h3>{hit.title}</h3>
                    <div className="stats">{hit.stats}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 视频任务 L3 section */}
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
            视频任务（L3）
          </div>
          <div className="grid grid-cols-3 gap-3">
            {channel.missions.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate("/workbench")}
                className={
                  "bg-white border " +
                  (m.borderCls ?? "border-gray-200") +
                  " rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition"
                }
              >
                {/* Top row: status badge + deadline */}
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={
                      m.statusBadge.cls +
                      " text-[10px] font-bold px-1.5 py-0.5 rounded" +
                      (m.blink ? " blink" : "")
                    }
                  >
                    {m.statusBadge.text}
                  </span>
                  <span className="text-[9px] text-gray-400 mono">{m.deadline}</span>
                </div>

                {/* Title */}
                <h3 className="text-[14px] font-bold mb-1">{m.title}</h3>

                {/* Desc */}
                <p className="text-[11px] text-gray-500 mb-3">{m.desc}</p>

                {/* Stage line */}
                <div
                  className={
                    "text-[10px] mb-1.5 mono " + (m.stageLineCls ?? "text-gray-400")
                  }
                >
                  {m.stageLine}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={"h-full " + m.barCls}
                    style={{ width: m.progress + "%" }}
                  />
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                  <span>{m.footLeft}</span>
                  <span className={m.footRightCls + " font-semibold"}>
                    {m.footRight}
                  </span>
                </div>
              </div>
            ))}

            {/* 新建视频任务 dashed tile */}
            <button
              onClick={() => openModal("newMission")}
              className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 flex flex-col items-center justify-center min-h-[170px]"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-gray-200 grid place-items-center mb-2">
                <Icon.Plus size={16} className="text-indigo-600" />
              </div>
              <span className="text-[12px] font-semibold text-gray-700">新建视频任务</span>
              <span className="text-[10px] text-gray-500 mt-0.5">自动继承本频道 L2 DNA</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
