import { create } from "zustand";

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

interface SaveStatusState {
  state: SaveState;
  lastSavedAt: number | null;
  error: string | null;
  markPending: () => void;
  markSaving: () => void;
  markSaved: () => void;
  markError: (message: string) => void;
}

// Autosave is fire-and-forget so it never blocks editing, which used to mean a
// failed write looked exactly like a successful one. This is the surface the
// status bar reads so the outcome is always visible.
export const useSaveStatus = create<SaveStatusState>((set) => ({
  state: "idle",
  lastSavedAt: null,
  error: null,
  markPending: () => set({ state: "pending" }),
  markSaving: () => set({ state: "saving" }),
  markSaved: () => set({ state: "saved", lastSavedAt: Date.now(), error: null }),
  markError: (message) => set({ state: "error", error: message }),
}));
