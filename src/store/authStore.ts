// 认证状态。视图/门控只依赖本 store;持久化与后端交互都在 dataProvider 内。
import { create } from "zustand";
import type { User } from "@/types";
import { dataProvider } from "@/services/dataProvider";

export type AuthStatus = "checking" | "authed" | "anon";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  submitting: boolean;
  /** 应用启动时调用一次:有 session → authed,否则 anon。 */
  checkSession: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "checking",
  error: null,
  submitting: false,

  checkSession: async () => {
    const user = await dataProvider.getCurrentUser();
    set(user ? { user, status: "authed" } : { user: null, status: "anon" });
  },

  login: async (username, password) => {
    set({ submitting: true, error: null });
    try {
      const user = await dataProvider.login(username, password);
      set({ user, status: "authed", submitting: false, error: null });
    } catch (e) {
      set({ submitting: false, error: e instanceof Error ? e.message : "登录失败" });
    }
  },

  logout: async () => {
    await dataProvider.logout();
    set({ user: null, status: "anon", error: null });
  },
}));
