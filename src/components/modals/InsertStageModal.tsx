// InsertStageModal — Task F4.
// Opens when activeModal === 'insertStage'. Scrollable modal to insert a new workflow stage.
import { useState } from "react";
import { useUi } from "@/store/uiStore";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

type Level = "L3" | "L2";

interface TemplateDef {
  id: string;
  icon: React.ReactNode;
  name: string;
  badge: string;
  badgeClass: string;
  desc: string;
}

const TEMPLATES_CONTENT: TemplateDef[] = [
  {
    id: "comment-mining",
    icon: <Icon.MessagesSquare size={12} className="mr-1 text-emerald-600" />,
    name: "用户评论挖掘",
    badge: "+1.5h",
    badgeClass: "mono text-[9px] bg-emerald-50 text-emerald-700 px-1 rounded",
    desc: "从本号/对标号评论区挖选题灵感，按热度聚类",
  },
  {
    id: "seo-keywords",
    icon: <Icon.Search size={12} className="mr-1 text-blue-600" />,
    name: "SEO 关键词",
    badge: "+30min",
    badgeClass: "mono text-[9px] bg-blue-50 text-blue-700 px-1 rounded",
    desc: "补关键词到标题/描述/标签，YT 搜索流量",
  },
];

const TEMPLATES_PRODUCTION: TemplateDef[] = [
  {
    id: "screen-recording",
    icon: <Icon.Video size={12} className="mr-1 text-red-600" />,
    name: "录屏 / 实操",
    badge: "+人工",
    badgeClass: "mono text-[9px] bg-red-50 text-red-700 px-1 rounded",
    desc: "实操类必备 · 自动生成录屏脚本与口播节点",
  },
  {
    id: "guest-interview",
    icon: <Icon.UserRoundCog size={12} className="mr-1 text-amber-600" />,
    name: "嘉宾访谈",
    badge: "+人工",
    badgeClass: "mono text-[9px] bg-amber-50 text-amber-700 px-1 rounded",
    desc: "对话类内容 · 自动生成问题清单 + 时间安排",
  },
];

const TEMPLATES_COMMERCIAL: TemplateDef[] = [
  {
    id: "ad-slot",
    icon: <Icon.RectangleHorizontal size={12} className="mr-1 text-purple-600" />,
    name: "商务广告位",
    badge: "商务",
    badgeClass: "mono text-[9px] bg-purple-50 text-purple-700 px-1 rounded",
    desc: "中插广告 / 软广位置规划 / 品牌合规",
  },
  {
    id: "shorts-clip",
    icon: <Icon.Copy size={12} className="mr-1 text-pink-600" />,
    name: "Shorts 切片",
    badge: "×N",
    badgeClass: "mono text-[9px] bg-pink-50 text-pink-700 px-1 rounded",
    desc: "从长视频自动切 3-5 条 Shorts · 跨平台分发",
  },
  {
    id: "comment-ops",
    icon: <Icon.MessageCircle size={12} className="mr-1 text-sky-600" />,
    name: "评论区运营",
    badge: "发布后",
    badgeClass: "mono text-[9px] bg-sky-50 text-sky-700 px-1 rounded",
    desc: "前 24h 评论自动置顶 / 回复 / 屏蔽",
  },
  {
    id: "multilang",
    icon: <Icon.Languages size={12} className="mr-1 text-teal-600" />,
    name: "多语言翻译",
    badge: "×lang",
    badgeClass: "mono text-[9px] bg-teal-50 text-teal-700 px-1 rounded",
    desc: "字幕 / 标题 / 描述自动翻译 · 本地化发布",
  },
];

function TemplateCard({
  tpl,
  selected,
  onSelect,
}: {
  tpl: TemplateDef;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn("insert-cat-btn", selected && "active")}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-bold">
          {tpl.icon}
          {tpl.name}
        </span>
        <span className={tpl.badgeClass}>{tpl.badge}</span>
      </div>
      <div className="text-[10px] text-gray-500">{tpl.desc}</div>
    </button>
  );
}

export function InsertStageModal() {
  const activeModal = useUi((s) => s.activeModal);
  const closeModal = useUi((s) => s.closeModal);

  const open = activeModal === "insertStage";

  const [selectedLevel, setSelectedLevel] = useState<Level>("L3");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      className={cn("modal-mask", "show")}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Card — scrollable */}
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black">插入新阶段</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              从模板库挑一个，或自定义。新阶段会自动接入上下游数据流。
            </p>
          </div>
          <button
            onClick={closeModal}
            className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center"
          >
            <Icon.Close size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Section 1: 选层级 */}
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2">
              1. 选层级
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLevel("L3")}
                className={cn("insert-cat-btn flex-1", selectedLevel === "L3" && "active")}
              >
                <div className="text-[11px] font-bold flex items-center gap-1.5">
                  <span className="layer-dot layer-video" />
                  L3 视频级
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">每条视频跑一次</div>
              </button>
              <button
                onClick={() => setSelectedLevel("L2")}
                className={cn("insert-cat-btn flex-1", selectedLevel === "L2" && "active")}
              >
                <div className="text-[11px] font-bold flex items-center gap-1.5">
                  <span className="layer-dot layer-channel" />
                  L2 频道级
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">频道一次性 / 定时</div>
              </button>
            </div>
          </div>

          {/* Section 2: 选模板 */}
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2">
              2. 选模板
            </div>

            {/* 内容立意 */}
            <div className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold mb-1.5 mt-3">
              内容立意 · 选题前
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {TEMPLATES_CONTENT.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  selected={selectedTemplate === tpl.id}
                  onSelect={() => setSelectedTemplate(tpl.id)}
                />
              ))}
            </div>

            {/* 视听制作 */}
            <div className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold mb-1.5 mt-3">
              视听制作 · 分镜后
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {TEMPLATES_PRODUCTION.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  selected={selectedTemplate === tpl.id}
                  onSelect={() => setSelectedTemplate(tpl.id)}
                />
              ))}
            </div>

            {/* 商业闭环 */}
            <div className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold mb-1.5 mt-3">
              商业闭环 · 发布前后
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {TEMPLATES_COMMERCIAL.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  selected={selectedTemplate === tpl.id}
                  onSelect={() => setSelectedTemplate(tpl.id)}
                />
              ))}
            </div>

            {/* 自定义 */}
            <div className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold mb-1.5 mt-3">
              自定义
            </div>
            <button
              onClick={() =>
                setSelectedTemplate(
                  selectedTemplate === "custom" ? null : "custom"
                )
              }
              className={cn(
                "insert-cat-btn w-full",
                selectedTemplate === "custom" && "active"
              )}
            >
              <div className="text-[12px] font-bold">
                <Icon.Ruler size={12} className="inline mr-1 text-gray-600" />
                自定义 Agent 阶段
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                写 Prompt + 配模型 + 接上下游，搭你自己的阶段
              </div>
            </button>
          </div>

          {/* Section 3: 插入位置 */}
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2">
              3. 插入位置
            </div>
            <select className="w-full text-[12px] border border-gray-200 rounded-lg p-2">
              <option>S5 选题 之后 → S6 大纲 之前</option>
              <option>S6 大纲 之后 → S7 脚本 之前</option>
              <option>S9 分镜 之后 → S10 图像 之前</option>
              <option>S14 封面标题 之后 → S15 质检 之前</option>
              <option>S16 发布 之后（末尾追加）</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="text-[12px] border border-gray-200 px-3 py-1.5 rounded"
            >
              取消
            </button>
            <button
              onClick={closeModal}
              className="bg-indigo-600 text-white text-[12px] px-4 py-1.5 rounded font-semibold"
            >
              <Icon.Check size={10} className="inline mr-1" />
              插入到工作流
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}
