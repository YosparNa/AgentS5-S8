// 认证门控:启动时检查 session;checking→splash,anon→登录页,authed→渲染应用。
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/store/authStore";
import { LoginView } from "@/views/LoginView";

export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuth((s) => s.status);
  const checkSession = useAuth((s) => s.checkSession);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (status === "checking") {
    return (
      <div className="h-screen w-screen grid place-items-center bg-gray-50 text-[12px] text-gray-400">
        加载中…
      </div>
    );
  }

  if (status === "anon") {
    return <LoginView />;
  }

  return <>{children}</>;
}
