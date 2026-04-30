import { create } from "zustand";
import type { AccentName, CanvasStyle, Density, ModuleId, Project, Shell } from "@/types";

export interface Tweaks {
  density: Density;
  accent: AccentName;
  shell: Shell;
  canvasStyle: CanvasStyle;
}

export const ACCENTS: Record<AccentName, { c: string; dim: string; faint: string }> = {
  "acid-green": {
    c: "oklch(0.86 0.19 145)",
    dim: "oklch(0.86 0.19 145 / 0.18)",
    faint: "oklch(0.86 0.19 145 / 0.08)",
  },
  amber: {
    c: "oklch(0.82 0.17 70)",
    dim: "oklch(0.82 0.17 70 / 0.18)",
    faint: "oklch(0.82 0.17 70 / 0.08)",
  },
  cyan: {
    c: "oklch(0.82 0.13 220)",
    dim: "oklch(0.82 0.13 220 / 0.18)",
    faint: "oklch(0.82 0.13 220 / 0.08)",
  },
  magenta: {
    c: "oklch(0.78 0.22 330)",
    dim: "oklch(0.78 0.22 330 / 0.18)",
    faint: "oklch(0.78 0.22 330 / 0.08)",
  },
  white: {
    c: "oklch(0.96 0 0)",
    dim: "oklch(0.96 0 0 / 0.18)",
    faint: "oklch(0.96 0 0 / 0.06)",
  },
};

interface AppState {
  module: ModuleId;
  setModule: (m: ModuleId) => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  project: Project;
}

export const useApp = create<AppState>((set) => ({
  module: "wall",
  setModule: (module) => set({ module }),
  tweaks: {
    density: "normal",
    accent: "acid-green",
    shell: "rail",
    canvasStyle: "grid",
  },
  setTweak: (key, value) =>
    set((s) => ({ tweaks: { ...s.tweaks, [key]: value } })),
  project: { id: "PRJ-2451", name: "Atrium Lobby Wall", client: "Northwind HQ", status: "in-design" },
}));
