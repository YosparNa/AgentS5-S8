import { create } from "zustand";

// ── 全局配置存储（单次会话内持久，刷新重置）────────────────────────────────
export const CONFIG_PERSIST: Record<string, Record<string, unknown>> = {};

export function getConfigValue(stageKind: string, key: string, defaultValue: unknown): unknown {
  return CONFIG_PERSIST[stageKind]?.[key] ?? defaultValue;
}

export function setConfigValue(stageKind: string, key: string, value: unknown): void {
  if (!CONFIG_PERSIST[stageKind]) CONFIG_PERSIST[stageKind] = {};
  CONFIG_PERSIST[stageKind][key] = value;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface ConfigStore {
  // S5 选题
  s5_channelDesc: string;
  s5_userData: string;
  s5_toggles: [boolean, boolean, boolean];
  s5_sliders: [number, number, number, number];
  s5_autoLock: boolean;

  // S6 大纲
  s6_selectedOption: number;
  s6_sliders: [number, number, number];

  // S7 脚本
  s7_bannedWords: string;
  s7_toggles: [boolean, boolean];

  // S8 对抗
  s8_toggles: [boolean, boolean, boolean, boolean, boolean];

  // S5 Actions
  setS5ChannelDesc(v: string): void;
  setS5UserData(v: string): void;
  setS5Toggle(i: number, v: boolean): void;
  setS5AutoLock(v: boolean): void;
  setS5Slider(i: number, v: number): void;

  // S6 Actions
  setS6SelectedOption(v: number): void;
  setS6Slider(i: number, v: number): void;

  // S7 Actions
  setS7BannedWords(v: string): void;
  setS7Toggle(i: number, v: boolean): void;

  // S8 Actions
  setS8Toggle(i: number, v: boolean): void;

  // Config getters (for API calls)
  getS5Config(): Record<string, unknown>;
  getS6Config(): Record<string, unknown>;
  getS7Config(): Record<string, unknown>;
  getS8Config(): Record<string, unknown>;
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useConfig = create<ConfigStore>((set, get) => ({
  // S5 初始值
  s5_channelDesc: "",
  s5_userData: "",
  s5_toggles: [true, true, true],
  s5_sliders: [7, 8, 6, 9],
  s5_autoLock: true,

  // S6 初始值
  s6_selectedOption: 0,
  s6_sliders: [3, 78, 8],

  // S7 初始值
  s7_bannedWords: "禁用：综上所述 / 在当今时代",
  s7_toggles: [true, true],

  // S8 初始值
  s8_toggles: [true, true, true, true, true],

  // S5 Actions
  setS5ChannelDesc: (v) => set({ s5_channelDesc: v }),
  setS5UserData: (v) => set({ s5_userData: v }),
  setS5Toggle: (i, v) => {
    set((s) => {
      const t = [...s.s5_toggles] as [boolean, boolean, boolean];
      t[i] = v;
      return { s5_toggles: t };
    });

  },
  setS5AutoLock: (v) => set({ s5_autoLock: v }),
  setS5Slider: (i, v) => {
    set((s) => {
      const sl = [...s.s5_sliders] as [number, number, number, number];
      sl[i] = v;
      return { s5_sliders: sl };
    });
   
  },

  // S6 Actions
  setS6SelectedOption: (v) => { set({ s6_selectedOption: v }); },
  setS6Slider: (i, v) => {
    set((s) => {
      const sl = [...s.s6_sliders] as [number, number, number];
      sl[i] = v;
      return { s6_sliders: sl };
    });
   
  },

  // S7 Actions
  setS7BannedWords: (v) => { set({ s7_bannedWords: v }); },
  setS7Toggle: (i, v) => {
    set((s) => {
      const t = [...s.s7_toggles] as [boolean, boolean];
      t[i] = v;
      return { s7_toggles: t };
    });
   
  },

  // S8 Actions
  setS8Toggle: (i, v) => {
    set((s) => {
      const t = [...s.s8_toggles] as [boolean, boolean, boolean, boolean, boolean];
      t[i] = v;
      return { s8_toggles: t };
    });
   
  },

  // Config getters — 与 HTML 版 getS5Config/getS6Config/getS7Config/getS8Config 一致
  getS5Config() {
    const s = get();
    return {
      exclude_shock_title: s.s5_toggles[0],
      exclude_empty_buzzwords: s.s5_toggles[1],
      exclude_ai_filler: s.s5_toggles[2],
      cognitive_conflict: s.s5_sliders[0],
      resonance: s.s5_sliders[1],
      crisis: s.s5_sliders[2],
      curiosity: s.s5_sliders[3],
    };
  },

  getS6Config() {
    const s = get();
    const hookTypes = ["counterintuitive", "conflict_suspense", "number_impact", "visual_promise"];
    return {
      hook_type: hookTypes[s.s6_selectedOption] || "conflict_suspense",
      crisis_density: s.s6_sliders[0],
      climax_pct: s.s6_sliders[1],
      chapter_count: s.s6_sliders[2],
    };
  },

  getS7Config() {
    const s = get();
    return {
      spoken_style_bans: s.s7_bannedWords,
      one_twist_per_chapter: s.s7_toggles[0],
      hook_every_2_3_min: s.s7_toggles[1],
    };
  },

  getS8Config() {
    const s = get();
    return {
      nitpicker: s.s8_toggles[0],
      peer: s.s8_toggles[1],
      novice: s.s8_toggles[2],
      fan: s.s8_toggles[3],
      compliance: s.s8_toggles[4],
    };
  },
}));
