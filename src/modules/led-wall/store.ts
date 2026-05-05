import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WALL_LAYOUTS } from "@/lib/data";
import type { WallLayout } from "@/types";

export type LedTool = "select" | "draw" | "erase" | "measure";
export type LedTab = "wall" | "panel" | "calc";

interface LedWallState {
  walls: WallLayout[];
  layoutId: string;
  selected: { c: number; r: number } | null;
  tool: LedTool;
  zoom: number;
  showDims: boolean;
  showFaults: boolean;
  tab: LedTab;
  setLayoutId: (id: string) => void;
  setSelected: (sel: { c: number; r: number } | null) => void;
  setTool: (t: LedTool) => void;
  setZoom: (z: number) => void;
  setShowDims: (v: boolean) => void;
  setShowFaults: (v: boolean) => void;
  setTab: (t: LedTab) => void;
  updateWall: (id: string, patch: Partial<WallLayout>) => void;
}

export const useLedWall = create<LedWallState>()(
  persist(
    (set) => ({
      walls: WALL_LAYOUTS,
      layoutId: "W1",
      selected: null,
      tool: "select",
      zoom: 100,
      showDims: true,
      showFaults: true,
      tab: "wall",
      setLayoutId: (layoutId) => set({ layoutId, selected: null }),
      setSelected: (selected) => set({ selected }),
      setTool: (tool) => set({ tool }),
      setZoom: (zoom) => set({ zoom }),
      setShowDims: (showDims) => set({ showDims }),
      setShowFaults: (showFaults) => set({ showFaults }),
      setTab: (tab) => set({ tab }),
      updateWall: (id, patch) =>
        set((s) => {
          const walls = s.walls.map((w) => (w.id === id ? { ...w, ...patch } : w));
          const next = walls.find((w) => w.id === id);
          const geomChanged =
            patch.cols !== undefined || patch.rows !== undefined;
          let selected = s.selected;
          if (geomChanged && next && s.layoutId === id && selected) {
            if (selected.c >= next.cols || selected.r >= next.rows) selected = null;
          }
          return { walls, selected };
        }),
    }),
    { name: "blackburst:led-wall:v2" },
  ),
);
