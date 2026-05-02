import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LedTool = "select" | "draw" | "erase" | "measure";
export type LedTab = "wall" | "panel" | "calc";

interface LedWallState {
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
}

export const useLedWall = create<LedWallState>()(
  persist(
    (set) => ({
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
    }),
    { name: "blackburst:led-wall:v1" },
  ),
);
