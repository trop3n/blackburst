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
  addEdge: (seed: Omit<SystemEdge, "id">) => string;
  removeEdge: (id: string) => void;
  updateEdge: (id: string, patch: Partial<SystemEdge>) => void;
}

function nextNodeId(existing: SystemNode[]): string {
  let n = existing.length + 1;
  while (existing.some((x) => x.id === `n${n}`)) n++;
  return `n${n}`;
}

function nextEdgeId(existing: SystemEdge[]): string {
  let n = existing.length + 1;
  while (existing.some((x) => x.id === `e${n}`)) n++;
  return `e${n}`;
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
      // Deliberately does not dedupe: a second cable between the same two
      // devices on the same lane is a real second run, and refusing it was the
      // old lane-shaped identity talking. Two cables that genuinely land on one
      // pair of sockets are reported by validation, not prevented here.
      addEdge: (seed) => {
        let newId = "";
        set((s) => {
          newId = nextEdgeId(s.edges);
          return { edges: [...s.edges, { ...seed, id: newId }] };
        });
        return newId;
      },
      removeEdge: (id) => set((s) => ({ edges: s.edges.filter((e) => e.id !== id) })),
      updateEdge: (id, patch) =>
        set((s) => ({
          edges: s.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
    }),
);
