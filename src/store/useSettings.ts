import { create } from "zustand";

interface SettingsState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useSettings = create<SettingsState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
