// 左侧竖导航(还原 09index 行 242–251)
import { NavLink } from "react-router-dom";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

const ITEMS = [
  { to: "/", label: "首页", icon: Icon.Home, tag: undefined as string | undefined },
  { to: "/channels", label: "频道", icon: Icon.Broadcast, tag: "L2" },
  { to: "/missions", label: "任务", icon: Icon.ListCheck, tag: "L3" },
  { to: "/ideas", label: "选题池", icon: Icon.Lightbulb, tag: undefined },
  { to: "/knowledge", label: "经验库", icon: Icon.Brain, tag: "L1" },
  { to: "/analytics", label: "数据", icon: Icon.ChartLine, tag: undefined },
];

export function RailNav() {
  return (
    <nav className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-2 shrink-0 gap-1">
      {ITEMS.map((it) => {
        const I = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) => cn("rail-btn", isActive && "active")}
          >
            <I size={16} />
            <span className="lbl">{it.label}</span>
            {it.tag ? <span className="text-[8px] mono opacity-50">{it.tag}</span> : null}
          </NavLink>
        );
      })}
      <div className="flex-1" />
      <button className="rail-btn">
        <Icon.Gear size={16} />
        <span className="lbl">设置</span>
      </button>
    </nav>
  );
}
