// ChannelsView — 还原 09index #view-channels(行 2589–2632);切片 B3
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataProvider } from "@/services/dataProvider";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import type { ChannelListCard } from "@/types";

export function ChannelsView() {
  const navigate = useNavigate();
  const openModal = useUi((s) => s.openModal);
  const [channels, setChannels] = useState<ChannelListCard[]>([]);

  useEffect(() => {
    dataProvider.listChannels().then(setChannels);
  }, []);

  return (
    <section className="h-full overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto p-8 w-full">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[20px] font-black mb-1 flex items-center gap-2">
              频道管理
              <span className="layer-pill layer-channel text-[10px] font-bold px-1.5 py-0.5 rounded">
                L2
              </span>
            </h2>
            <p className="text-[12px] text-gray-500">
              每个频道 = 独立 L2 DNA · 独立对标库 · 独立热点池
            </p>
          </div>
          <button
            onClick={() => openModal("newChannel")}
            className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5"
          >
            <Icon.Plus size={10} />
            新建频道
          </button>
        </div>

        {/* Channel grid */}
        <div className="grid grid-cols-3 gap-4">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => navigate("/channel/" + ch.id)}
              className={
                "bg-white border " +
                (ch.borderCls ?? "border-gray-200") +
                " rounded-xl p-5 text-left hover:shadow-md hover:border-sky-300 transition"
              }
            >
              {/* Top row: emoji + status badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{ch.emoji}</div>
                <span
                  className={
                    "text-[10px] mono " +
                    ch.statusBadge.cls +
                    " px-1.5 py-0.5 rounded"
                  }
                >
                  {ch.statusBadge.text}
                </span>
              </div>

              {/* Name */}
              <h3 className="text-[15px] font-bold mb-1">{ch.name}</h3>

              {/* Description */}
              <p className="text-[11px] text-gray-500 mb-3">{ch.desc}</p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {ch.stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-gray-400">{stat.label}</div>
                    <div className={"font-semibold " + (stat.valueCls ?? "")}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
