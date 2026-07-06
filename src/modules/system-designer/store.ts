import { create } from "zustand";
import { SYSTEM_EDGES, SYSTEM_NODES } from "@/lib/data";
import type { Lane, SystemEdge, SystemNode } from "@/types";

export type SystemView = "graph" | "patch";

interface SystemState {
  nodes: SystemNode[];
  edges: SystemEdge[];
  lanes: Record<Lane, boolean>;
  selectedNodeId: string;
  view: SystemView;
  toggleLane: (lane: Lane) => void;
  setSelectedNodeId: (id: string) => void;
  setView: (v: SystemView) => void;
  updateNode: (id: string, patch: Partial<SystemNode>) => void;
  addNode: (seed: Omit<SystemNode, "id">) => string;
  removeNode: (id: string) => void;
  addEdge: (edge: SystemEdge) => void;
  removeEdge: (from: string, to: string, lane: Lane) => void;
}

function nextNodeId(existing: SystemNode[]): string {
  let n = existing.length + 1;
  while (existing.some((x) => x.id === `n${n}`)) n++;
  return `n${n}`;
}

export const useSystem = create<SystemState>()((set) => ({
      nodes: SYSTEM_NODES,
      edges: SYSTEM_EDGES,
      lanes: { video: true, audio: true, network: true, power: true },
      selectedNodeId: "",
      view: "graph",
      toggleLane: (lane) =>
        set((s) => ({ lanes: { ...s.lanes, [lane]: !s.lanes[lane] } })),
      setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
      setView: (view) => set({ view }),
      updateNode: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      addNode: (seed) => {
        let newId = "";
        set((s) => {
          newId = nextNodeId(s.nodes);
          return {
            nodes: [...s.nodes, { ...seed, id: newId }],
            selectedNodeId: newId,
          };
        });
        return newId;
      },
      removeNode: (id) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== id),
          edges: s.edges.filter((e) => e.from !== id && e.to !== id),
          selectedNodeId: s.selectedNodeId === id ? "" : s.selectedNodeId,
        })),
      addEdge: (edge) =>
        set((s) => {
          if (
            s.edges.some(
              (e) => e.from === edge.from && e.to === edge.to && e.lane === edge.lane,
            )
          )
            return s;
          return { edges: [...s.edges, edge] };
        }),
      removeEdge: (from, to, lane) =>
        set((s) => ({
          edges: s.edges.filter(
            (e) => !(e.from === from && e.to === to && e.lane === lane),
          ),
        })),
    }),
);
