import { create } from "zustand";

type UiState = {
  collapsed: boolean; // sidebar is hidden/collapsed
  pinned: boolean; // user clicked to pin the sidebar open
  setCollapsed: (v: boolean) => void;
  setPinned: (v: boolean) => void;
  togglePinned: () => void;
};

const useUiStore = create<UiState>((set) => ({
  collapsed: false,
  pinned: true,
  setCollapsed: (v: boolean) => set({ collapsed: v }),
  setPinned: (v: boolean) => set({ pinned: v, collapsed: !v }),
  togglePinned: () => set((s) => ({ pinned: !s.pinned, collapsed: s.pinned })),
}));

export default useUiStore;
