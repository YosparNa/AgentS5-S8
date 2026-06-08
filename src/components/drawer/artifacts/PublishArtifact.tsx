// 来源 PROTO lines 3695–3703 (renderOutput publish branch)
// Container-agnostic: takes `publish` prop; no drawer/modal shell.
// Maps platform name → lucide icon via Icon map (no CDN FontAwesome).

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

interface PublishItem {
  platform: string;
  color: string;      // Tailwind color class e.g. "text-red-500"
  title: string;
  time: string;
  tags: string;
  ab: boolean;
  status: string;
}

interface Props {
  publish: PublishItem[];
}

// Map platform name to IconName key — full static mapping, no dynamic concatenation
function platformIconName(platform: string): IconName {
  const lower = platform.toLowerCase();
  if (lower.includes("youtube") || lower.includes("shorts")) return "Youtube";
  if (lower.includes("x") || lower.includes("twitter")) return "Send";
  if (lower.includes("tiktok") || lower.includes("抖音")) return "Video";
  if (lower.includes("bilibili") || lower.includes("b站")) return "Film";
  if (lower.includes("instagram")) return "Images";
  return "Globe";
}

// Status badge color — full static strings
function statusCls(): string {
  return "text-[9px] mono bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded";
}

const PUBLISH_CHECKLIST = [
  "封面已钦点",
  "标题已选 AB",
  "描述/标签已 SEO",
  "字幕已烧录",
  "章节标记",
  "私域同步",
];

export function PublishArtifact({ publish }: Props) {
  return (
    <div>
      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-[11px] text-indigo-900 mb-2 flex items-start gap-1">
        <Icon.Help size={12} className="mt-0.5 shrink-0" />
        <span>需先通过 ⑦ 终审才真正提交。当前为排程预览。</span>
      </div>

      {/* Platform cards */}
      {publish.map((p, i) => {
        const PlatIcon = Icon[platformIconName(p.platform)];
        return (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
            {/* Header row */}
            <div className="flex justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <PlatIcon size={16} className={cn(p.color)} />
                <span className="text-[12px] font-bold">{p.platform}</span>
              </div>
              <span className={statusCls()}>{p.status}</span>
            </div>

            {/* Title */}
            <div className="text-[11px] font-medium text-gray-800 mb-1">{p.title}</div>

            {/* Time + tags grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
              <div>
                <Icon.Clock size={9} className="mr-1 inline" />
                {p.time}
              </div>
              <div>
                <Icon.Bookmark size={9} className="mr-1 inline" />
                {p.tags}
              </div>
            </div>

            {/* AB test badge */}
            {p.ab && (
              <div className="mt-1.5 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded inline-block">
                <Icon.Flask size={9} className="mr-1 inline" />
                AB 测试 6 小时
              </div>
            )}
          </div>
        );
      })}

      {/* 发布前清单 sub-card */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mt-2">
        <div className="text-[10px] uppercase text-gray-400 font-bold mb-2">发布前清单</div>
        {PUBLISH_CHECKLIST.map((item) => (
          <label key={item} className="flex items-center gap-2 text-[11px] py-0.5">
            <input type="checkbox" className="w-3 h-3 accent-blue-600" />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
