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
  // Back to idle on project load/teardown — a "saved 12:01" or a canceled
  // "pending" from the previous project must not describe the next one.
  reset: () => void;
}

// Autosave is fire-and-forget so it never blocks editing, which used to mean a
// failed write looked exactly like a successful one. This is the surface the
// status bar reads so the outcome is always visible.
export const useSaveStatus = create<SaveStatusState>((set, get) => ({
  state: "idle",
  lastSavedAt: null,
  error: null,
  // Idempotent: a drag schedules a save on every frame, and re-notifying
  // subscribers with an unchanged "pending" re-rendered the status bar (and its
  // validation pass) ~60 times a second for no visible change.
  markPending: () => {
    if (get().state !== "pending") set({ state: "pending" });
  },
  markSaving: () => set({ state: "saving" }),
  markSaved: () => set({ state: "saved", lastSavedAt: Date.now(), error: null }),
  markError: (message) => set({ state: "error", error: message }),
  reset: () => set({ state: "idle", lastSavedAt: null, error: null }),
}));
