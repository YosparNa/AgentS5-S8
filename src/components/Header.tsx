// 顶栏(还原 09index 行 209–239)
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/icons";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useUi } from "@/store/uiStore";
import { useAuth } from "@/store/authStore";
import { cn } from "@/lib/cn";

export function Header() {
  const { pathname } = useLocation();
  const onWorkbench = pathname.startsWith("/workbench");
  const editMode = useUi((s) => s.editMode);
  const toggleEditMode = useUi((s) => s.toggleEditMode);
  const openModal = useUi((s) => s.openModal);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const initial = (user?.username?.[0] ?? "U").toUpperCase();

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-3 shrink-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 pr-3 border-r border-gray-200 hover:opacity-80">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-lg grid place-items-center shadow-sm">
            <Icon.LayerGroup size={13} />
          </div>
          <span className="font-bold text-[14px] tracking-tight">Creator OS</span>
        </Link>
        <Breadcrumb />
        <button
          onClick={() => openModal("arch")}
          className="text-[10px] text-gray-400 hover:text-indigo-600 px-1.5 py-0.5 rounded hover:bg-indigo-50"
        >
          <Icon.Help size={12} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Icon.Search size={11} className="absolute left-2.5 top-1.5 text-gray-400" />
          <input
            className="bg-gray-50 border border-gray-200 rounded-md pl-7 pr-2 py-1 w-56 text-[11px] focus:ring-1 focus:ring-indigo-300 outline-none"
            placeholder="全局搜索 ⌘K"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span><b className="text-gray-700">3</b> 运行</span>
        </div>
        {onWorkbench ? (
          <button
            onClick={toggleEditMode}
            className={cn(
              "text-[11px] border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 flex items-center gap-1",
              editMode && "bg-indigo-600 text-white border-indigo-600",
            )}
          >
            <Icon.Pen size={10} />
            {editMode ? "完成编辑" : "编辑工作流"}
          </button>
        ) : null}
        <button
          onClick={() => openModal("newAction")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md font-medium text-[11px] flex items-center gap-1 shadow-sm"
        >
          <Icon.Plus size={10} /> 新建
        </button>
        <div
          className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white grid place-items-center font-bold text-[11px]"
          title={user?.username}
        >
          {initial}
        </div>
        <button
          onClick={() => void logout()}
          title="登出"
          className="w-7 h-7 rounded hover:bg-gray-100 grid place-items-center text-gray-400 hover:text-gray-700"
        >
          <Icon.LogOut size={13} />
        </button>
      </div>
    </header>
  );
}
