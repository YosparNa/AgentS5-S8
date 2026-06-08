// 面包屑(还原 renderBreadcrumb,09index 行 3486–3499)
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/icons";

export function Breadcrumb() {
  const { pathname } = useLocation();
  const inChannel = pathname.startsWith("/channel") || pathname.startsWith("/workbench") || pathname.startsWith("/viral");
  const inWorkbench = pathname.startsWith("/workbench");
  const inViral = pathname.startsWith("/viral");

  return (
    <nav className="flex items-center text-[12px]">
      <Link to="/" className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100">
        <Icon.LayerGroup size={11} className="text-purple-500" />
        <span className="font-medium text-gray-700">星辰MCN</span>
        <span className="mono text-[9px] text-gray-400 ml-1">workspace · L1</span>
      </Link>
      {inChannel ? (
        <>
          <Icon.ChevronRight size={10} className="text-gray-300 mx-1" />
          <Link to="/channel/ai-tool" className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100">
            <Icon.Broadcast size={11} className="text-sky-500" />
            <span className="font-medium text-gray-700">AI 工具频道</span>
            <span className="mono text-[9px] text-gray-400 ml-1">channel · L2</span>
          </Link>
        </>
      ) : null}
      {inWorkbench ? (
        <>
          <Icon.ChevronRight size={10} className="text-gray-300 mx-1" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 border border-indigo-100">
            <span className="font-bold text-indigo-900">Manus vs NotebookLM</span>
            <span className="mono text-[9px] text-indigo-400 ml-1">mission · L3</span>
          </div>
        </>
      ) : null}
      {inViral ? (
        <>
          <Icon.ChevronRight size={10} className="text-gray-300 mx-1" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-50 border border-orange-200">
            <Icon.Fire size={10} className="text-orange-600" />
            <span className="font-bold text-orange-900">爆款解构</span>
          </div>
        </>
      ) : null}
    </nav>
  );
}
