// 登录页。mock 模式接受任意非空账号密码;真实后端模式走 dataProvider.login → /api/auth/login。
// 全屏、不挂载 AppShell(由 AuthGate 在未登录时渲染)。
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useAuth } from "@/store/authStore";

// 仅在 mock 预览(未配置真实后端)时提示「任意账号可登入」。
const IS_MOCK = !import.meta.env.VITE_API_BASE;

export function LoginView() {
  const login = useAuth((s) => s.login);
  const submitting = useAuth((s) => s.submitting);
  const error = useAuth((s) => s.error);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    login(username, password);
  };

  return (
    <div className="h-screen w-screen grid place-items-center bg-gray-50 text-[13px] antialiased px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl grid place-items-center shadow-sm">
            <Icon.LayerGroup size={17} />
          </div>
          <span className="font-bold text-[18px] tracking-tight text-gray-900">Creator OS</span>
        </div>

        {/* Card */}
        <form
          onSubmit={onSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4"
        >
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">登录</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">登录以继续使用 Creator OS</p>
          </div>

          {/* Username */}
          <label className="block">
            <span className="text-[11px] font-medium text-gray-500">账号</span>
            <div className="relative mt-1">
              <Icon.User size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名"
                className="w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-3 py-2 text-[12px] focus:ring-1 focus:ring-indigo-300 outline-none"
              />
            </div>
          </label>

          {/* Password */}
          <label className="block">
            <span className="text-[11px] font-medium text-gray-500">密码</span>
            <div className="relative mt-1">
              <Icon.KeyRound size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-3 py-2 text-[12px] focus:ring-1 focus:ring-indigo-300 outline-none"
              />
            </div>
          </label>

          {error && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md py-2 font-medium text-[12px] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            {submitting ? (
              <>
                <Icon.Loader2 size={13} className="animate-spin" /> 登录中…
              </>
            ) : (
              <>
                登录 <Icon.ArrowRight size={13} />
              </>
            )}
          </button>

          {IS_MOCK && (
            <p className="text-[10px] text-gray-400 text-center pt-1">
              预览模式 · 任意非空账号密码即可登录
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
