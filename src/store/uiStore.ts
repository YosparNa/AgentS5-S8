import { create } from "zustand";

export type DrawerTab = "output" | "live" | "config" | "flow" | "history";
export type IdeasMode = "radar" | "library" | "inbox";
export type LibrarySub = "tracks" | "creators" | "videos";
export type ProbeMode = "web" | "yt" | "own" | "deep";
export type ModalId =
  | "arch" | "newAction" | "newChannel" | "newMission"
  | "source" | "insertStage" | "sediment" | "viral" | "compare" | "file";

interface UiState {
  currentChannelId: string | null;
  setChannel: (id: string | null) => void;

  stageDrawer: { open: boolean; wide: boolean; stageId: string | null; tab: DrawerTab };
  openStage: (id: string, active?: boolean) => void;
  closeDrawer: () => void;
  switchDrawerTab: (tab: DrawerTab) => void;

  editMode: boolean;
  toggleEditMode: () => void;

  ideasMode: IdeasMode;
  setIdeasMode: (m: IdeasMode) => void;
  librarySub: LibrarySub;
  setLibrarySub: (s: LibrarySub) => void;

  trackDrawer: { open: boolean; key: string | null };
  openTrackDrawer: (key: string) => void;
  closeTrackDrawer: () => void;

  compareList: string[];
  toggleCompare: (key: string) => void;
  removeCompare: (key: string) => void;
  clearCompare: () => void;

  activeModal: ModalId | null;
  viralId: number | null;
  fileStageId: string | null;
  openModal: (id: ModalId, viralId?: number) => void;
  openFile: (stageId: string) => void;
  closeModal: () => void;

  probeMode: ProbeMode;
  setProbeMode: (m: ProbeMode) => void;
}

export const useUi = create<UiState>((set, get) => ({
  currentChannelId: null,
  setChannel: (id) => set({ currentChannelId: id }),

  stageDrawer: { open: false, wide: false, stageId: null, tab: "output" },
  openStage: (id, active) =>
    set({ stageDrawer: { open: true, wide: !!active, stageId: id, tab: active ? "live" : "output" } }),
  closeDrawer: () => set({ stageDrawer: { open: false, wide: false, stageId: null, tab: "output" } }),
  switchDrawerTab: (tab) => set((s) => ({ stageDrawer: { ...s.stageDrawer, tab } })),

  editMode: false,
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  ideasMode: "radar",
  setIdeasMode: (m) => set({ ideasMode: m }),
  librarySub: "tracks",
  setLibrarySub: (s) => set({ librarySub: s }),

  trackDrawer: { open: false, key: null },
  openTrackDrawer: (key) => set({ trackDrawer: { open: true, key } }),
  closeTrackDrawer: () => set({ trackDrawer: { open: false, key: null } }),

  compareList: [],
  // When the compare list drops below 2, the CompareModal can no longer render —
  // proactively clear a lingering activeModal==='compare' so the modal state isn't stale.
  toggleCompare: (key) => {
    const list = get().compareList;
    if (list.includes(key)) {
      const next = list.filter((k) => k !== key);
      set((s) => ({
        compareList: next,
        ...(next.length < 2 && s.activeModal === "compare" ? { activeModal: null } : {}),
      }));
    } else if (list.length < 4) {
      set({ compareList: [...list, key] });
    }
  },
  removeCompare: (key) =>
    set((s) => {
      const next = s.compareList.filter((k) => k !== key);
      return {
        compareList: next,
        ...(next.length < 2 && s.activeModal === "compare" ? { activeModal: null } : {}),
      };
    }),
  clearCompare: () =>
    set((s) => ({
      compareList: [],
      ...(s.activeModal === "compare" ? { activeModal: null } : {}),
    })),

  activeModal: null,
  viralId: null,
  fileStageId: null,
  openModal: (id, viralId) => set({ activeModal: id, viralId: viralId ?? null }),
  openFile: (stageId) => set({ activeModal: "file", fileStageId: stageId }),
  closeModal: () => set({ activeModal: null, viralId: null, fileStageId: null }),

  probeMode: "web",
  setProbeMode: (m) => set({ probeMode: m }),
}));
