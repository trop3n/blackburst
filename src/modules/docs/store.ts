import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INITIAL_COMMENTS } from "@/lib/docs-comments";
import { DOC_TREE } from "@/lib/docs-tree";
import { bumpVersion, INITIAL_VERSIONS, nowStamp } from "@/lib/docs-versions";
import type { DocComment, DocNode, DocVersion } from "@/types";

interface DocsState {
  tree: DocNode[];
  activeId: string;
  expanded: string[];
  recentIds: string[];
  bodies: Record<string, string>;
  comments: Record<string, DocComment[]>;
  versions: Record<string, DocVersion[]>;
  setActive: (id: string) => void;
  toggle: (id: string) => void;
  addDoc: (targetId: string | null, name: string) => string | null;
  setBody: (docId: string, text: string) => void;
  clearBody: (docId: string) => void;
  renameDoc: (docId: string, newName: string) => boolean;
  deleteDoc: (docId: string) => boolean;
  addComment: (docId: string, text: string) => void;
  addVersion: (docId: string, note: string) => string | null;
}

const MAX_RECENT_DOCS = 6;

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

function renameNode(nodes: DocNode[], id: string, name: string): DocNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, name };
    if (n.children) return { ...n, children: renameNode(n.children, id, name) };
    return n;
  });
}

function removeNode(nodes: DocNode[], id: string): DocNode[] {
  const out: DocNode[] = [];
  for (const n of nodes) {
    if (n.id === id) continue;
    if (n.children) out.push({ ...n, children: removeNode(n.children, id) });
    else out.push(n);
  }
  return out;
}

function firstDocId(nodes: DocNode[]): string | null {
  for (const n of nodes) {
    if (n.kind === "doc") return n.id;
    if (n.children) {
      const hit = firstDocId(n.children);
      if (hit) return hit;
    }
  }
  return null;
}

export const useDocs = create<DocsState>()(
  persist(
    (set, get) => ({
      tree: DOC_TREE,
      activeId: "d-prj-ros",
      expanded: ["d-prj", "d-spec", "d-sop"],
      recentIds: [],
      bodies: {},
      comments: INITIAL_COMMENTS,
      versions: INITIAL_VERSIONS,
      setActive: (activeId) => {
        const state = get();
        if (state.activeId === activeId) {
          set({ activeId });
          return;
        }
        const node = findNode(state.tree, activeId);
        if (!node || node.kind !== "doc") {
          set({ activeId });
          return;
        }
        const next = [activeId, ...state.recentIds.filter((id) => id !== activeId)].slice(0, MAX_RECENT_DOCS);
        set({ activeId, recentIds: next });
      },
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
      setBody: (docId, text) => {
        const state = get();
        set({ bodies: { ...state.bodies, [docId]: text } });
      },
      clearBody: (docId) => {
        const state = get();
        if (!(docId in state.bodies)) return;
        const { [docId]: _omit, ...rest } = state.bodies;
        set({ bodies: rest });
      },
      renameDoc: (docId, rawName) => {
        const name = rawName.trim();
        if (!name) return false;
        const state = get();
        const node = findNode(state.tree, docId);
        if (!node || node.name === name) return false;
        set({ tree: renameNode(state.tree, docId, name) });
        return true;
      },
      deleteDoc: (docId) => {
        const state = get();
        const node = findNode(state.tree, docId);
        if (!node) return false;
        if (node.kind === "folder" && (node.children?.length ?? 0) > 0) return false;

        const nextTree = removeNode(state.tree, docId);
        const { [docId]: _b, ...bodies } = state.bodies;
        const { [docId]: _c, ...comments } = state.comments;
        const { [docId]: _v, ...versions } = state.versions;
        const recentIds = state.recentIds.filter((id) => id !== docId);
        const expanded = state.expanded.filter((id) => id !== docId);

        let activeId = state.activeId;
        if (activeId === docId) {
          activeId = recentIds.find((id) => !!findNode(nextTree, id)) ?? firstDocId(nextTree) ?? "";
        }

        set({ tree: nextTree, bodies, comments, versions, recentIds, expanded, activeId });
        return true;
      },
      addComment: (docId, rawText) => {
        const text = rawText.trim();
        if (!text) return;
        const state = get();
        const existing = state.comments[docId] ?? [];
        const entry: DocComment = { who: "You", t: "now", c: text };
        set({
          comments: { ...state.comments, [docId]: [entry, ...existing] },
        });
      },
      addVersion: (docId, rawNote) => {
        const note = rawNote.trim();
        if (!note) return null;
        const state = get();
        const existing = state.versions[docId] ?? [];
        const nextV = bumpVersion(existing[0]?.v);
        const entry: DocVersion = {
          v: nextV,
          who: "You",
          when: nowStamp(),
          note,
        };
        set({
          versions: { ...state.versions, [docId]: [entry, ...existing] },
        });
        return nextV;
      },
    }),
    { name: "blackburst:docs:v2" },
  ),
);
