// HomeView — 还原 09index #view-home(行 254–399);切片 B2
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dataProvider } from "@/services/dataProvider";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import type { Template, ChannelTile, RunningMission, HomeTodo } from "@/types";

type FilterMode = "all" | "mine" | "template";

export function HomeView() {
  const navigate = useNavigate();
  const openModal = useUi((s) => s.openModal);

  const [todo, setTodo] = useState<HomeTodo | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [channels, setChannels] = useState<ChannelTile[]>([]);
  const [missions, setMissions] = useState<RunningMission[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    dataProvider.getHomeTodo().then(setTodo);
    dataProvider.listHomeTemplates().then(setTemplates);
    dataProvider.listMyChannels().then(setChannels);
    dataProvider.listRunningMissions().then(setMissions);
  }, []);

  const showTemplate = filter === "all" || filter === "template";
  const showMine = filter === "all" || filter === "mine";

  return (
    <section className="h-full overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto p-8 w-full">

        {/* 待办 banner */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-lg grid place-items-center">
              <Icon.Sun size={16} />
            </div>
            <div>
              <div className="text-[13px] font-bold">
                今天要处理 <span className="text-indigo-600">{todo?.total ?? 0}</span> 件事
              </div>
              <div className="text-[11px] text-gray-600">
                {todo?.agentsRunning ?? 0} 个 Agent 运行中 · {todo?.awaitingReview ?? 0} 个等审 · {todo?.publishToday ?? 0} 条今天发布
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="text-[11px] bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Icon.Gavel size={10} className="mr-0.5" />去审核
            </button>
            <button
              onClick={() => navigate("/missions")}
              className="text-[11px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center gap-1"
            >
              <Icon.ArrowRight size={10} className="mr-0.5" />进任务台
            </button>
          </div>
        </div>

        {/* Segmented filter row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 text-[12px] font-semibold rounded-full transition-all ${
                filter === "all" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter("mine")}
              className={`px-4 py-1.5 text-[12px] font-semibold rounded-full transition-all ${
                filter === "mine" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              我的频道
            </button>
            <button
              onClick={() => setFilter("template")}
              className={`px-4 py-1.5 text-[12px] font-semibold rounded-full transition-all ${
                filter === "template" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              精华模板
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg grid place-items-center bg-indigo-50 text-indigo-600">
              <Icon.LayoutGrid size={12} />
            </button>
            <button className="ml-2 text-[11px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-1">
              最近 <Icon.ChevronDown size={8} />
            </button>
          </div>
        </div>

        {/* 精华模板 section */}
        {showTemplate && (
          <div>
            <h2 className="text-[18px] font-bold mb-1">精华模板</h2>
            <p className="text-[12px] text-gray-500 mb-4">
              从行业头部账号克隆 L2 频道 DNA + 全套阶段配置，比从零搭建快 10 倍
            </p>
            <div className="grid grid-cols-5 gap-3 mb-8">
              {templates.map((t) => {
                const C = Icon[t.icon as keyof typeof Icon];
                return (
                  <div
                    key={t.id}
                    className={`feature-card ${t.grad}`}
                    onClick={() => openModal("newChannel")}
                  >
                    <div className="meta-top">
                      <div className="avatar">
                        {C ? <C size={12} className={t.iconCls} /> : null}
                      </div>
                      <span className="text-[11px] font-semibold">{t.author}</span>
                    </div>
                    <div className="body">
                      <h3>{t.title}</h3>
                      <div className="stats">{t.stats}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 我的频道 section */}
        {showMine && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-bold">我的频道</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  每个频道独立 L2 DNA · 独立对标库 · 独立热点池
                </p>
              </div>
              <button
                onClick={() => navigate("/channels")}
                className="text-[12px] text-indigo-600 hover:underline"
              >
                管理全部频道 →
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {/* 新建频道 dashed tile */}
              <button
                onClick={() => openModal("newChannel")}
                className="channel-tile bg-gray-50 hover:bg-indigo-50 border-2 border-dashed border-gray-300 hover:border-indigo-400 flex flex-col items-center justify-center min-h-[160px]"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 grid place-items-center mb-2">
                  <Icon.Plus size={16} className="text-indigo-600" />
                </div>
                <h3 className="text-[14px] text-center text-gray-700">新建频道</h3>
                <div className="stats">从模板克隆 / 空白开始</div>
              </button>

              {/* Channel tiles */}
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => navigate("/channel/" + ch.id)}
                  className={`channel-tile ${ch.bg}`}
                >
                  <div className="icon">{ch.emoji}</div>
                  <h3>{ch.title}</h3>
                  <div className="stats">{ch.stats}</div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                    {ch.chips.map((chip, i) => (
                      <span key={i} className={`bg-white ${chip.cls} rounded px-1.5 py-0.5`}>
                        {chip.text}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 进行中的视频任务 table — always shown */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-bold">进行中的视频任务</h2>
            <button
              onClick={() => navigate("/missions")}
              className="text-[12px] text-indigo-600 hover:underline"
            >
              查看全部 →
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2">任务</th>
                  <th className="text-left px-4 py-2">所属频道</th>
                  <th className="text-left px-4 py-2">当前阶段</th>
                  <th className="text-left px-4 py-2">下一步</th>
                  <th className="text-left px-4 py-2">状态</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m, idx) => (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{m.title}</td>
                    <td className="px-4 py-3 text-gray-600">{m.channel}</td>
                    <td className={`px-4 py-3 mono text-[11px]`}>{m.stage}</td>
                    <td className={`px-4 py-3 ${m.nextCls ?? "text-gray-600"}`}>{m.next}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`${m.statusCls} text-[10px] font-bold px-1.5 py-0.5 rounded${m.blink ? " blink" : ""}`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {idx === 0 ? (
                        <button
                          onClick={() => navigate("/workbench")}
                          className="text-[11px] bg-indigo-600 text-white px-2.5 py-1 rounded"
                        >
                          打开
                        </button>
                      ) : (
                        <button className="text-[11px] border border-gray-200 px-2.5 py-1 rounded hover:bg-gray-50">
                          打开
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
