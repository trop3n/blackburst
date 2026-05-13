import { useMemo, useState } from "react";
import { I } from "@/components/Icon";
import { goto } from "@/lib/nav";
import {
  DOC_BODIES,
  DOC_LINKED_BY_ID,
  RECENT_DOCS,
} from "@/lib/docs-data";
import type { DocNode } from "@/types";
import { useDocs } from "./store";

interface TreeNodeProps {
  node: DocNode;
  depth: number;
  activeId: string;
  setActive: (id: string) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
}

function DocTreeNode({ node, depth, activeId, setActive, expanded, toggle }: TreeNodeProps) {
  const isOpen = expanded.has(node.id);
  return (
    <>
      <div
        className="docs-node"
        data-active={node.id === activeId ? "1" : "0"}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          if (node.kind === "folder") toggle(node.id);
          else setActive(node.id);
        }}
      >
        {node.kind === "folder" ? (
          <I.Chev size={10} dir={isOpen ? "down" : "right"} />
        ) : (
          <span style={{ width: 10 }} />
        )}
        <span className="ico">
          {node.kind === "folder" ? <I.Folder size={12} /> : <I.File size={12} />}
        </span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.name}
        </span>
      </div>
      {node.kind === "folder" &&
        isOpen &&
        node.children?.map((c) => (
          <DocTreeNode
            key={c.id}
            node={c}
            depth={depth + 1}
            activeId={activeId}
            setActive={setActive}
            expanded={expanded}
            toggle={toggle}
          />
        ))}
    </>
  );
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

interface FilterResult {
  tree: DocNode[];
  matchFolders: Set<string>;
}

function filterTree(nodes: DocNode[], q: string): FilterResult {
  const matchFolders = new Set<string>();
  function walk(ns: DocNode[]): DocNode[] {
    const out: DocNode[] = [];
    for (const n of ns) {
      const selfMatch = n.name.toLowerCase().includes(q);
      if (n.kind === "folder") {
        const kids = walk(n.children ?? []);
        if (selfMatch || kids.length > 0) {
          matchFolders.add(n.id);
          out.push({ ...n, children: kids });
        }
      } else if (selfMatch) {
        out.push(n);
      }
    }
    return out;
  }
  return { tree: walk(nodes), matchFolders };
}

function printDoc() {
  window.print();
}

export function DocsModule() {
  const tree = useDocs((s) => s.tree);
  const activeId = useDocs((s) => s.activeId);
  const setActive = useDocs((s) => s.setActive);
  const expandedArr = useDocs((s) => s.expanded);
  const toggle = useDocs((s) => s.toggle);
  const addDoc = useDocs((s) => s.addDoc);
  const commentsMap = useDocs((s) => s.comments);
  const addComment = useDocs((s) => s.addComment);
  const versionsMap = useDocs((s) => s.versions);
  const addVersion = useDocs((s) => s.addVersion);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = useMemo<FilterResult | null>(
    () => (q ? filterTree(tree, q) : null),
    [tree, q],
  );

  const visibleTree = filtered ? filtered.tree : tree;
  const expanded = useMemo(() => {
    const base = new Set(expandedArr);
    if (filtered) for (const id of filtered.matchFolders) base.add(id);
    return base;
  }, [expandedArr, filtered]);

  const activeNode = useMemo(() => findNode(tree, activeId), [tree, activeId]);
  const activeParent = useMemo(
    () => (activeNode ? findParent(tree, activeNode.id) : null),
    [tree, activeNode],
  );

  const versions = versionsMap[activeId] ?? [];
  const linked = DOC_LINKED_BY_ID[activeId] ?? [];
  const comments = commentsMap[activeId] ?? [];
  const body = DOC_BODIES[activeId];
  const currentVersion = versions[0]?.v;
  const trimmedDraft = draft.trim();

  function onAdd() {
    const name = window.prompt("New document name:");
    if (name && name.trim()) addDoc(activeId, name);
  }

  function onAddVersion() {
    const note = window.prompt("Version note (what changed?):");
    if (note && note.trim()) addVersion(activeId, note);
  }

  function submitComment() {
    if (!trimmedDraft) return;
    addComment(activeId, trimmedDraft);
    setDraft("");
  }

  function onComposerKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitComment();
    }
  }

  return (
    <>
      <div className="left-pane">
        <div className="pane-hd">
          <span>DOCS TREE</span>
          <span className="spacer" />
          <button className="icon-btn" onClick={onAdd} title="New document">
            <I.Plus size={12} />
          </button>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input
            placeholder="Search docs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pane-body">
          <div className="docs-tree">
            {visibleTree.length === 0 ? (
              <div
                style={{
                  padding: "12px 8px",
                  fontSize: 11,
                  color: "var(--color-fg-faint)",
                }}
              >
                No matches.
              </div>
            ) : (
              visibleTree.map((n) => (
                <DocTreeNode
                  key={n.id}
                  node={n}
                  depth={0}
                  activeId={activeId}
                  setActive={setActive}
                  expanded={expanded}
                  toggle={toggle}
                />
              ))
            )}
          </div>
          <div className="section-h"><span>RECENT</span><span className="line" /></div>
          {RECENT_DOCS.map((r) => (
            <div
              key={r.id}
              className="list-row"
              onClick={() => setActive(r.id)}
              style={{ cursor: "pointer" }}
            >
              <I.File size={12} />
              <span className="lbl">{r.n}</span>
              <span className="meta">{r.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="center-pane">
        <div className="canvas-toolbar">
          {activeParent && (
            <>
              <span className="crumb mono">{activeParent.name}</span>
              <span className="crumb-sep">/</span>
            </>
          )}
          <span className="crumb-curr mono">{activeNode?.name ?? "Untitled"}</span>
          <span style={{ flex: 1 }} />
          {currentVersion && (
            <span className="chip accent">{currentVersion} · CURRENT</span>
          )}
          <button className="tb-btn" onClick={printDoc}>
            <I.Eye size={13} /> Preview
          </button>
          <button className="tb-btn" onClick={printDoc}>
            <I.Export size={13} /> Export PDF
          </button>
        </div>

        <div className="docs-page">
          {body ?? (
            <>
              <h1>{activeNode?.name ?? "Untitled"}</h1>
              <div className="meta-row">
                <span>NO CONTENT YET</span>
              </div>
              <p style={{ color: "var(--color-fg-faint)" }}>
                This document doesn't have a body yet. Open it in an editor to start writing.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="right-pane">
        <div className="pane-hd">
          <span>VERSION HISTORY</span>
          <span className="spacer" />
          <button
            className="icon-btn"
            onClick={onAddVersion}
            title="Save as new version"
          >
            <I.Plus size={12} />
          </button>
        </div>
        <div className="version-list">
          {versions.length === 0 ? (
            <div
              style={{
                padding: "8px 12px",
                fontSize: 11,
                color: "var(--color-fg-faint)",
              }}
            >
              No versions recorded.
            </div>
          ) : (
            versions.map((v, i) => (
              <div key={v.v} className="version-row" data-current={i === 0 ? "1" : "0"}>
                <div className="v">{v.v} · {v.note}</div>
                <div className="meta">
                  <span>{v.who}</span>
                  <span>{v.when}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="pane-hd"><span>LINKED REFERENCES</span></div>
        <div style={{ padding: "0 0 12px" }}>
          {linked.length === 0 ? (
            <div
              style={{
                padding: "4px 12px 8px",
                fontSize: 11,
                color: "var(--color-fg-faint)",
              }}
            >
              No linked references.
            </div>
          ) : (
            linked.map((r, i) => {
              const kindMap = { ASSET: "asset", WALL: "wall", NODE: "node", DOC: "doc" } as const;
              return (
                <div
                  key={i}
                  className="list-row"
                  onClick={() => goto({ kind: kindMap[r.k], id: r.id })}
                  style={{ cursor: "pointer" }}
                >
                  <span className="chip accent" style={{ minWidth: 44, justifyContent: "center" }}>{r.k}</span>
                  <span className="lbl">{r.n}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="pane-hd">
          <span>COMMENTS</span>
          <span className="spacer" />
          <span
            className="mono"
            style={{ fontSize: 10, color: "var(--color-fg-faint)" }}
          >
            {comments.length} OPEN
          </span>
        </div>
        <div style={{ padding: "0 12px 12px", fontSize: 11.5 }}>
          <div className="comment-composer">
            <textarea
              className="comment-input"
              placeholder="Add a comment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onComposerKey}
              rows={2}
            />
            <div className="comment-composer-row">
              <span className="comment-hint mono">⌘↵ to post</span>
              <button
                className="tb-btn"
                type="button"
                onClick={submitComment}
                disabled={!trimmedDraft}
              >
                Comment
              </button>
            </div>
          </div>
          {comments.length === 0 ? (
            <div style={{ padding: "8px 0", color: "var(--color-fg-faint)" }}>
              No comments yet.
            </div>
          ) : (
            comments.map((cm, i) => (
              <div
                key={i}
                style={{ padding: "8px 0", borderBottom: "1px solid var(--color-line-faint)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>{cm.who}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>{cm.t}</span>
                </div>
                <div style={{ color: "var(--color-fg)" }}>{cm.c}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
