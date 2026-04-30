import { create } from "zustand";
import type { Lane } from "@/types";

export type SystemView = "graph" | "patch";

interface SystemState {
  lanes: Record<Lane, boolean>;
  selectedNodeId: string;
  view: SystemView;
  toggleLane: (lane: Lane) => void;
  setSelectedNodeId: (id: string) => void;
  setView: (v: SystemView) => void;
}

export const useSystem = create<SystemState>((set) => ({
  lanes: { video: true, audio: true, network: true, power: true },
  selectedNodeId: "n4",
  view: "graph",
  toggleLane: (lane) =>
    set((s) => ({ lanes: { ...s.lanes, [lane]: !s.lanes[lane] } })),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setView: (view) => set({ view }),
}));
