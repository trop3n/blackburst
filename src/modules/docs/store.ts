import { create } from "zustand";
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
  leaveGuard: (() => boolean) | null;
  setLeaveGuard: (fn: (() => boolean) | null) => void;
  setActive: (id: string) => void;
  toggle: (id: string) => void;
  addDoc: (targetId: string | null, name: string) => string | null;
  addFolder: (targetId: string | null, name: string) => string | null;
  setBody: (docId: string, text: string) => void;
  clearBody: (docId: string) => void;
  renameDoc: (docId: string, newName: string) => boolean;
  deleteDoc: (docId: string) => boolean;
  moveNode: (dragId: string, targetId: string, pos: DropPos) => boolean;
  addComment: (docId: string, text: string) => void;
  editComment: (docId: string, index: number, text: string) => void;
  deleteComment: (docId: string, index: number) => void;
  addVersion: (docId: string, note: string) => string | null;
  restoreVersion: (docId: string, v: string) => boolean;
}

export type DropPos = "before" | "after" | "inside";

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

function nextFolderId(nodes: DocNode[]): string {
  const taken = collectIds(nodes);
  let n = 1;
  while (taken.has(`f-user-${n}`)) n++;
  return `f-user-${n}`;
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

function detachNode(nodes: DocNode[], id: string): { tree: DocNode[]; node: DocNode | null } {
  let found: DocNode | null = null;
  function walk(list: DocNode[]): DocNode[] {
    const out: DocNode[] = [];
    for (const n of list) {
      if (n.id === id) {
        found = n;
        continue;
      }
      out.push(n.children ? { ...n, children: walk(n.children) } : n);
    }
    return out;
  }
  const tree = walk(nodes);
  return { tree, node: found };
}

function isDescendant(node: DocNode, maybeChildId: string): boolean {
  if (node.id === maybeChildId) return true;
  return (node.children ?? []).some((c) => isDescendant(c, maybeChildId));
}

function insertRelative(
  nodes: DocNode[],
  targetId: string,
  pos: DropPos,
  node: DocNode,
): DocNode[] {
  if (pos === "inside") {
    return nodes.map((n) => {
      if (n.id === targetId && n.kind === "folder") {
        return { ...n, children: [...(n.children ?? []), node] };
      }
      if (n.children) return { ...n, children: insertRelative(n.children, targetId, pos, node) };
      return n;
    });
  }
  const out: DocNode[] = [];
  for (const n of nodes) {
    if (n.id === targetId) {
      if (pos === "before") out.push(node, n);
      else out.push(n, node);
      continue;
    }
    out.push(n.children ? { ...n, children: insertRelative(n.children, targetId, pos, node) } : n);
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

export const useDocs = create<DocsState>()((set, get) => ({
      tree: DOC_TREE,
      activeId: "d-prj-ros",
      expanded: ["d-prj", "d-spec", "d-sop"],
      recentIds: [],
      bodies: {},
      comments: INITIAL_COMMENTS,
      versions: INITIAL_VERSIONS,
      leaveGuard: null,
      setLeaveGuard: (fn) => set({ leaveGuard: fn }),
      setActive: (activeId) => {
        const state = get();
        if (state.activeId === activeId) {
          set({ activeId });
          return;
        }
        if (state.leaveGuard && !state.leaveGuard()) return;
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
      addFolder: (targetId, rawName) => {
        const name = rawName.trim();
        if (!name) return null;
        const state = get();
        const tree = state.tree;

        let parentId: string | null = null;
        if (targetId) {
          const node = findNode(tree, targetId);
          if (node?.kind === "folder") parentId = node.id;
          else if (node) parentId = findParent(tree, node.id)?.id ?? null;
        }

        const id = nextFolderId(tree);
        const folder: DocNode = { id, name, kind: "folder", children: [] };
        const next = parentId ? insertChild(tree, parentId, folder) : [...tree, folder];
        const expanded = [...state.expanded];
        if (parentId && !expanded.includes(parentId)) expanded.push(parentId);
        expanded.push(id);
        set({ tree: next, expanded });
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
      moveNode: (dragId, targetId, pos) => {
        if (dragId === targetId) return false;
        const state = get();
        const dragNode = findNode(state.tree, dragId);
        const targetNode = findNode(state.tree, targetId);
        if (!dragNode || !targetNode) return false;
        if (isDescendant(dragNode, targetId)) return false;
        if (pos === "inside" && targetNode.kind !== "folder") return false;

        const { tree: detached, node } = detachNode(state.tree, dragId);
        if (!node) return false;
        const nextTree = insertRelative(detached, targetId, pos, node);
        const expanded =
          pos === "inside" && !state.expanded.includes(targetId)
            ? [...state.expanded, targetId]
            : state.expanded;
        set({ tree: nextTree, expanded });
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
      editComment: (docId, index, rawText) => {
        const text = rawText.trim();
        if (!text) return;
        const state = get();
        const existing = state.comments[docId];
        if (!existing || !existing[index]) return;
        const next = existing.map((c, i) => (i === index ? { ...c, c: text } : c));
        set({ comments: { ...state.comments, [docId]: next } });
      },
      deleteComment: (docId, index) => {
        const state = get();
        const existing = state.comments[docId];
        if (!existing || !existing[index]) return;
        const next = existing.filter((_, i) => i !== index);
        set({ comments: { ...state.comments, [docId]: next } });
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
          body: state.bodies[docId],
        };
        set({
          versions: { ...state.versions, [docId]: [entry, ...existing] },
        });
        return nextV;
      },
      restoreVersion: (docId, v) => {
        const state = get();
        const entry = (state.versions[docId] ?? []).find((x) => x.v === v);
        if (!entry || entry.body === undefined) return false;
        set({ bodies: { ...state.bodies, [docId]: entry.body } });
        return true;
      },
    }),
);
