import { create } from "zustand";
import { WALL_LAYOUTS } from "@/lib/data";
import { DEFAULT_PROCESSOR_ID } from "@/lib/led-processor-data";
import type { WallLayout } from "@/types";

export type LedTool = "select" | "draw" | "erase" | "measure";
export type LedTab = "wall" | "panel" | "calc";

export interface CellRef {
  c: number;
  r: number;
}

interface LedWallState {
  walls: WallLayout[];
  layoutId: string;
  selected: CellRef | null;
  tool: LedTool;
  zoom: number;
  showDims: boolean;
  tab: LedTab;
  measureFrom: CellRef | null;
  measureTo: CellRef | null;
  panelSearch: string;
  setLayoutId: (id: string) => void;
  setSelected: (sel: CellRef | null) => void;
  setTool: (t: LedTool) => void;
  setZoom: (z: number) => void;
  setShowDims: (v: boolean) => void;
  setTab: (t: LedTab) => void;
  setPanelSearch: (q: string) => void;
  updateWall: (id: string, patch: Partial<WallLayout>) => void;
  addWall: () => void;
  removeWall: (id: string) => void;
  handleCellClick: (cell: CellRef) => void;
  addCol: () => void;
  addRow: () => void;
  clearMeasure: () => void;
}

const MAX_COLS = 50;
const MAX_ROWS = 30;

function nextWallId(existing: WallLayout[]): string {
  let n = existing.length + 1;
  while (existing.some((w) => w.id === `W${n}`)) n++;
  return `W${n}`;
}

export const useLedWall = create<LedWallState>()((set) => ({
      walls: WALL_LAYOUTS,
      layoutId: "W1",
      selected: null,
      tool: "select",
      zoom: 100,
      showDims: true,
      tab: "wall",
      measureFrom: null,
      measureTo: null,
      panelSearch: "",
      setLayoutId: (layoutId) =>
        set({ layoutId, selected: null, measureFrom: null, measureTo: null }),
      setSelected: (selected) => set({ selected }),
      setTool: (tool) => set({ tool, measureFrom: null, measureTo: null }),
      setPanelSearch: (panelSearch) => set({ panelSearch }),
      setZoom: (zoom) => set({ zoom }),
      setShowDims: (showDims) => set({ showDims }),
      setTab: (tab) => set({ tab }),
      updateWall: (id, patch) =>
        set((s) => {
          const clamped: Partial<WallLayout> = { ...patch };
          if (clamped.cols !== undefined)
            clamped.cols = Math.max(1, Math.min(MAX_COLS, Math.floor(clamped.cols) || 1));
          if (clamped.rows !== undefined)
            clamped.rows = Math.max(1, Math.min(MAX_ROWS, Math.floor(clamped.rows) || 1));
          const walls = s.walls.map((w) => (w.id === id ? { ...w, ...clamped } : w));
          const next = walls.find((w) => w.id === id);
          const geomChanged =
            clamped.cols !== undefined || clamped.rows !== undefined;
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
            processor: DEFAULT_PROCESSOR_ID,
            cols: 4,
            rows: 3,
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
      handleCellClick: (cell) =>
        set((s) => {
          const layout = s.walls.find((w) => w.id === s.layoutId);
          if (!layout) return s;
          if (s.tool === "select") {
            return { selected: cell, tab: "panel" };
          }
          if (s.tool === "erase") {
            const isLastCol = cell.c === layout.cols - 1 && layout.cols > 1;
            const isLastRow = cell.r === layout.rows - 1 && layout.rows > 1;
            if (!isLastCol && !isLastRow) return s;
            const patch = isLastCol
              ? { cols: layout.cols - 1 }
              : { rows: layout.rows - 1 };
            const walls = s.walls.map((w) =>
              w.id === layout.id ? { ...w, ...patch } : w,
            );
            const sel = s.selected;
            const selected =
              sel &&
              ((isLastCol && sel.c >= layout.cols - 1) ||
                (isLastRow && sel.r >= layout.rows - 1))
                ? null
                : sel;
            return { walls, selected };
          }
          if (s.tool === "measure") {
            if (!s.measureFrom) return { measureFrom: cell, measureTo: null };
            return { measureTo: cell };
          }
          return s;
        }),
      addCol: () =>
        set((s) => {
          const layout = s.walls.find((w) => w.id === s.layoutId);
          if (!layout || layout.cols >= MAX_COLS) return s;
          return {
            walls: s.walls.map((w) =>
              w.id === layout.id ? { ...w, cols: w.cols + 1 } : w,
            ),
          };
        }),
      addRow: () =>
        set((s) => {
          const layout = s.walls.find((w) => w.id === s.layoutId);
          if (!layout || layout.rows >= MAX_ROWS) return s;
          return {
            walls: s.walls.map((w) =>
              w.id === layout.id ? { ...w, rows: w.rows + 1 } : w,
            ),
          };
        }),
      clearMeasure: () => set({ measureFrom: null, measureTo: null }),
    }),
);
