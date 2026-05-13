import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DOC_TREE } from "@/lib/docs-tree";
import type { DocNode } from "@/types";

interface DocsState {
  tree: DocNode[];
  activeId: string;
  expanded: string[];
  setActive: (id: string) => void;
  toggle: (id: string) => void;
  addDoc: (targetId: string | null, name: string) => string | null;
}

function collectIds(nodes: DocNode[], out: Set<string> = new Set()): Set<string> {
  for (const n of nodes) {
    out.add(n.id);
    if (n.children) collectIds(n.children, out);
  }
  return out;
}

function nextDocId(nodes: DocNode[]): string {
  const taken = collectIds(nodes);
  let n = 1;
  while (taken.has(`d-user-${n}`)) n++;
  return `d-user-${n}`;
}

function findNode(nodes: DocNode[], id: string): DocNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

function findParent(nodes: DocNode[], id: string): DocNode | null {
  for (const n of nodes) {
    if (n.children?.some((c) => c.id === id)) return n;
    if (n.children) {
      const hit = findParent(n.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

function insertChild(nodes: DocNode[], parentId: string, child: DocNode): DocNode[] {
  return nodes.map((n) => {
    if (n.id === parentId && n.kind === "folder") {
      return { ...n, children: [...(n.children ?? []), child] };
    }
    if (n.children) {
      return { ...n, children: insertChild(n.children, parentId, child) };
    }
    return n;
  });
}

export const useDocs = create<DocsState>()(
  persist(
    (set, get) => ({
      tree: DOC_TREE,
      activeId: "d-prj-ros",
      expanded: ["d-prj", "d-spec", "d-sop"],
      setActive: (activeId) => set({ activeId }),
      toggle: (id) => {
        const cur = get().expanded;
        set({
          expanded: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        });
      },
      addDoc: (targetId, rawName) => {
        const name = rawName.trim();
        if (!name) return null;
        const state = get();
        const tree = state.tree;

        let parentId: string | null = null;
        if (targetId) {
          const node = findNode(tree, targetId);
          if (node?.kind === "folder") {
            parentId = node.id;
          } else if (node) {
            parentId = findParent(tree, node.id)?.id ?? null;
          }
        }
        if (!parentId) parentId = tree.find((n) => n.kind === "folder")?.id ?? null;
        if (!parentId) return null;

        const id = nextDocId(tree);
        const next = insertChild(tree, parentId, { id, name, kind: "doc" });
        const expanded = state.expanded.includes(parentId)
          ? state.expanded
          : [...state.expanded, parentId];
        set({ tree: next, expanded, activeId: id });
        return id;
      },
    }),
    { name: "blackburst:docs:v2" },
  ),
);
