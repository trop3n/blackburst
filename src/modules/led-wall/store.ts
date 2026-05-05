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
  addWall: () => void;
  removeWall: (id: string) => void;
}

function nextWallId(existing: WallLayout[]): string {
  let n = existing.length + 1;
  while (existing.some((w) => w.id === `W${n}`)) n++;
  return `W${n}`;
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
      addWall: () =>
        set((s) => {
          const id = nextWallId(s.walls);
          const wall: WallLayout = {
            id,
            name: `New Wall ${s.walls.length + 1}`,
            panel: "ROE-RB2.6",
            cols: 4,
            rows: 3,
            curve: 0,
            active: false,
          };
          return {
            walls: [...s.walls, wall],
            layoutId: id,
            selected: null,
          };
        }),
      removeWall: (id) =>
        set((s) => {
          if (s.walls.length <= 1) return s;
          const walls = s.walls.filter((w) => w.id !== id);
          const layoutId = s.layoutId === id ? walls[0].id : s.layoutId;
          const selected = s.layoutId === id ? null : s.selected;
          return { walls, layoutId, selected };
        }),
    }),
    { name: "blackburst:led-wall:v2" },
  ),
);
