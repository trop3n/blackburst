import { useEffect, useMemo, useRef, useState } from "react";
import { I } from "@/components/Icon";
import { extractRefs, REF_KIND_LABEL } from "@/lib/doc-refs";
import { goto } from "@/lib/nav";
import { DOC_BODIES } from "@/lib/docs-data";
import { canDeleteShared } from "@/lib/ownership";
import { displayNameOf, useAuth } from "@/store/useAuth";
import { alertDialog, confirmDialog, promptDialog } from "@/store/useDialog";
import type { DocComment, DocNode } from "@/types";
import { MarkdownBody } from "./MarkdownBody";
import { useDocs, type DropPos } from "./store";

const TREE_MIME = "application/x-blackburst-doctree";

interface TreeNodeProps {
  node: DocNode;
  depth: number;
  activeId: string;
  setActive: (id: string) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
  onRename: (node: DocNode) => void;
  onDelete: (node: DocNode) => void;
  onAddInside: (node: DocNode) => void;
  onMove: (dragId: string, targetId: string, pos: DropPos) => void;
  dndEnabled: boolean;
}

function dropPosFor(e: React.DragEvent<HTMLDivElement>, isFolder: boolean): DropPos {
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;
  if (isFolder) {
    if (ratio < 0.3) return "before";
    if (ratio > 0.7) return "after";
    return "inside";
  }
  return ratio < 0.5 ? "before" : "after";
}

function DocTreeNode({ node, depth, activeId, setActive, expanded, toggle, onRename, onDelete, onAddInside, onMove, dndEnabled }: TreeNodeProps) {
  const isOpen = expanded.has(node.id);
  const [dropPos, setDropPos] = useState<DropPos | null>(null);
  return (
    <>
      <div
        className="docs-node"
        data-active={node.id === activeId ? "1" : "0"}
        data-drop={dropPos ?? undefined}
        style={{ paddingLeft: 8 + depth * 14 }}
        draggable={dndEnabled}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData(TREE_MIME, node.id);
        }}
        onDragOver={(e) => {
          if (!dndEnabled || !e.dataTransfer.types.includes(TREE_MIME)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDropPos(dropPosFor(e, node.kind === "folder"));
        }}
        onDragLeave={() => setDropPos(null)}
        onDrop={(e) => {
          if (!dndEnabled) return;
          const dragId = e.dataTransfer.getData(TREE_MIME);
          const pos = dropPosFor(e, node.kind === "folder");
          setDropPos(null);
          if (dragId && dragId !== node.id) onMove(dragId, node.id, pos);
        }}
        onDragEnd={() => setDropPos(null)}
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
        <span className="docs-node-actions">
          {node.kind === "folder" && (
            <button
              type="button"
              title="New document in folder"
              onClick={(e) => {
                e.stopPropagation();
                onAddInside(node);
              }}
            >
              <I.Plus size={11} />
            </button>
          )}
          <button
            type="button"
            title="Rename"
            onClick={(e) => {
              e.stopPropagation();
              onRename(node);
            }}
          >
            <I.Edit size={11} />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
          >
            <I.Cross size={11} />
          </button>
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
            onRename={onRename}
            onDelete={onDelete}
            onAddInside={onAddInside}
            onMove={onMove}
            dndEnabled={dndEnabled}
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

function exportDocPdf() {
  window.print();
}

export function DocsModule() {
  const tree = useDocs((s) => s.tree);
  const activeId = useDocs((s) => s.activeId);
  const setActive = useDocs((s) => s.setActive);
  const expandedArr = useDocs((s) => s.expanded);
  const toggle = useDocs((s) => s.toggle);
  const addDoc = useDocs((s) => s.addDoc);
  const addFolder = useDocs((s) => s.addFolder);
  const renameDoc = useDocs((s) => s.renameDoc);
  const deleteDoc = useDocs((s) => s.deleteDoc);
  const commentsMap = useDocs((s) => s.comments);
  const addComment = useDocs((s) => s.addComment);
  const editComment = useDocs((s) => s.editComment);
  const deleteComment = useDocs((s) => s.deleteComment);
  const moveNode = useDocs((s) => s.moveNode);
  const versionsMap = useDocs((s) => s.versions);
  const addVersion = useDocs((s) => s.addVersion);
  const restoreVersion = useDocs((s) => s.restoreVersion);
  const recentIds = useDocs((s) => s.recentIds);
  const bodiesMap = useDocs((s) => s.bodies);
  const setBody = useDocs((s) => s.setBody);
  const clearBody = useDocs((s) => s.clearBody);
  const user = useAuth((s) => s.user);
  const myId = user?.id ?? null;
  // Local mode has no account to attribute to, so "You" is the honest answer
  // there; in accounts mode a comment carries the signed-in identity.
  const author = { who: displayNameOf(user) || user?.email || "You", byId: myId };
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bodyDraft, setBodyDraft] = useState("");
  const [bodyDraftInitial, setBodyDraftInitial] = useState("");

  useEffect(() => {
    if (!previewing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setPreviewing(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewing]);

  const recentDocs = useMemo(
    () =>
      recentIds
        .map((id) => findNode(tree, id))
        .filter((n): n is DocNode => !!n && n.kind === "doc")
        .slice(0, 5),
    [recentIds, tree],
  );

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
  const comments = commentsMap[activeId] ?? [];
  const customBody = bodiesMap[activeId];
  // Derived from the document itself, so the pane can't drift from the body.
  const linked = useMemo(() => extractRefs(customBody ?? ""), [customBody]);
  const stockBody = DOC_BODIES[activeId];
  const currentVersion = versions[0]?.v;
  const trimmedDraft = draft.trim();

  useEffect(() => {
    setEditing(false);
  }, [activeId]);

  function startEdit() {
    const initial =
      customBody ?? `# ${activeNode?.name ?? "Untitled"}\n\nStart writing…\n`;
    setBodyDraft(initial);
    setBodyDraftInitial(initial);
    setEditing(true);
  }

  function confirmDiscard(): boolean | Promise<boolean> {
    if (!editing || bodyDraft === bodyDraftInitial) return true;
    return confirmDialog("Discard unsaved edits to this document?", {
      danger: true,
      confirmLabel: "Discard",
    });
  }

  const confirmDiscardRef = useRef(confirmDiscard);
  confirmDiscardRef.current = confirmDiscard;

  useEffect(() => {
    const setLeaveGuard = useDocs.getState().setLeaveGuard;
    setLeaveGuard(() => confirmDiscardRef.current());
    return () => setLeaveGuard(null);
  }, []);

  const dirty = editing && bodyDraft !== bodyDraftInitial;

  // Publish dirtiness for the load paths that can't stop to ask — the realtime
  // handler applies a collaborator's bucket, which resets the active doc.
  useEffect(() => {
    useDocs.getState().setEditorDirty(dirty);
    return () => useDocs.getState().setEditorDirty(false);
  }, [dirty]);

  // Every other surface in the app autosaves, so a reload with the editor open
  // silently took the draft with it. Only armed while there is something to lose.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function saveEdit() {
    setBody(activeId, bodyDraft);
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function onRevert() {
    const ok = await confirmDialog(
      "Revert to the default content? Your custom version will be removed.",
      { danger: true, confirmLabel: "Revert" },
    );
    if (!ok) return;
    clearBody(activeId);
  }

  function onEditorKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  }

  async function onAdd() {
    if (!(await confirmDiscard())) return;
    const name = await promptDialog("New document name:");
    if (name && name.trim()) addDoc(activeId, name);
  }

  async function onAddFolder() {
    const name = await promptDialog("New folder name:");
    if (name && name.trim()) addFolder(null, name);
  }

  async function onAddInside(folder: DocNode) {
    if (!(await confirmDiscard())) return;
    const name = await promptDialog(`New document in "${folder.name}":`);
    if (name && name.trim()) addDoc(folder.id, name);
  }

  async function onRenameNode(node: DocNode) {
    const next = await promptDialog(`Rename "${node.name}" to:`, node.name);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === node.name) return;
    renameDoc(node.id, trimmed);
  }

  async function onDeleteNode(node: DocNode) {
    if (node.kind === "folder" && (node.children?.length ?? 0) > 0) {
      await alertDialog("Empty this folder before deleting it.");
      return;
    }
    const label = node.kind === "folder" ? "folder" : "document";
    const ok = await confirmDialog(`Delete ${label} "${node.name}"? This cannot be undone.`, {
      danger: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    if (node.id === activeId && editing) setEditing(false);
    deleteDoc(node.id);
  }

  async function onAddVersion() {
    const note = await promptDialog("Version note (what changed?):");
    if (note && note.trim()) addVersion(activeId, note, author);
  }

  async function onRestoreVersion(v: string) {
    const ok = await confirmDialog(`Restore ${v}? This replaces the current document body.`, {
      confirmLabel: "Restore",
    });
    if (!ok) return;
    restoreVersion(activeId, v);
  }

  function submitComment() {
    if (!trimmedDraft) return;
    addComment(activeId, trimmedDraft, author);
    setDraft("");
  }

  async function onEditComment(index: number, comment: DocComment) {
    const next = await promptDialog("Edit comment:", comment.c);
    if (next === null) return;
    if (!next.trim() || next.trim() === comment.c) return;
    editComment(activeId, index, next, comment);
  }

  async function onDeleteComment(index: number, comment: DocComment) {
    const ok = await confirmDialog("Delete this comment?", { danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    deleteComment(activeId, index, comment);
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
          <button className="icon-btn" onClick={onAddFolder} title="New folder">
            <I.Folder size={12} />
          </button>
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
                  onRename={onRenameNode}
                  onDelete={onDeleteNode}
                  onAddInside={onAddInside}
                  onMove={moveNode}
                  dndEnabled={!q}
                />
              ))
            )}
          </div>
          <div className="section-h"><span>RECENT</span><span className="line" /></div>
          {recentDocs.length === 0 ? (
            <div
              style={{
                padding: "8px 12px",
                fontSize: 11,
                color: "var(--color-fg-faint)",
              }}
            >
              Open a document to populate recents.
            </div>
          ) : (
            recentDocs.map((d, i) => (
              <div
                key={d.id}
                className="list-row"
                onClick={() => setActive(d.id)}
                style={{ cursor: "pointer" }}
                data-active={d.id === activeId ? "1" : "0"}
              >
                <I.File size={12} />
                <span className="lbl">{d.name}</span>
                {/* Plain position in the list. The first row used to read "now",
                    which claimed a recency the app never recorded. */}
                <span className="meta">#{i + 1}</span>
              </div>
            ))
          )}
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
          {editing ? (
            <>
              <span
                className="mono"
                style={{ fontSize: 10, color: "var(--color-fg-faint)" }}
              >
                ⌘↵ save · Esc cancel
              </span>
              <button className="tb-btn" type="button" onClick={cancelEdit}>
                <I.Cross size={12} /> Cancel
              </button>
              <button className="tb-btn primary" type="button" onClick={saveEdit}>
                <I.Check size={13} /> Save
              </button>
            </>
          ) : (
            <>
              <button className="tb-btn" onClick={() => setPreviewing(true)}>
                <I.Eye size={13} /> Preview
              </button>
              <button className="tb-btn" onClick={startEdit}>
                <I.Edit size={13} /> Edit
              </button>
              {customBody !== undefined && stockBody !== undefined && (
                <button
                  className="tb-btn"
                  onClick={onRevert}
                  title="Discard your custom body and restore the default"
                >
                  <I.Undo size={13} /> Revert
                </button>
              )}
              <button className="tb-btn" onClick={exportDocPdf}>
                <I.Export size={13} /> Export PDF
              </button>
            </>
          )}
        </div>

        <div className="docs-page">
          {editing ? (
            <textarea
              className="docs-edit-area"
              value={bodyDraft}
              onChange={(e) => setBodyDraft(e.target.value)}
              onKeyDown={onEditorKey}
              autoFocus
              spellCheck={false}
            />
          ) : customBody !== undefined ? (
            <MarkdownBody text={customBody} />
          ) : (
            stockBody ?? (
              <>
                <h1>{activeNode?.name ?? "Untitled"}</h1>
                <div className="meta-row">
                  <span>NO CONTENT YET</span>
                </div>
                <p style={{ color: "var(--color-fg-faint)" }}>
                  This document doesn't have a body yet. Click <b>Edit</b> to start writing.
                </p>
              </>
            )
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
                {v.body === undefined ? (
                  // A version saved while the doc still showed its stock body has
                  // no text to restore. Say so, rather than just omitting the
                  // button and leaving the row looking broken.
                  <span
                    className="mono"
                    style={{ fontSize: 9.5, color: "var(--color-fg-faint)" }}
                  >
                    note only
                  </span>
                ) : (
                  v.body !== customBody && (
                    <button
                      type="button"
                      className="version-restore"
                      title="Restore this version"
                      onClick={() => onRestoreVersion(v.v)}
                    >
                      <I.Undo size={11} /> Restore
                    </button>
                  )
                )}
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
            linked.map((r) => (
              <div
                key={`${r.kind}:${r.id}`}
                className="list-row"
                onClick={() => goto({ kind: r.kind, id: r.id })}
                style={{ cursor: "pointer" }}
              >
                <span className="chip accent" style={{ minWidth: 44, justifyContent: "center" }}>
                  {REF_KIND_LABEL[r.kind]}
                </span>
                <span className="lbl">{r.label}</span>
              </div>
            ))
          )}
        </div>
        <div className="pane-hd">
          <span>COMMENTS</span>
          <span className="spacer" />
          {/* Was "N OPEN" — comments have no resolved state to be open against. */}
          <span
            className="mono"
            style={{ fontSize: 10, color: "var(--color-fg-faint)" }}
          >
            {comments.length}
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
              <div key={i} className="comment-row">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>{cm.who}</span>
                  <span className="spacer" />
                  <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>{cm.t}</span>
                  {/* Gated on the author's id, not the display name — every
                      comment used to be labelled "You", which let anyone edit
                      and delete anyone else's. Same rule as the other shared
                      records: yours, or unattributed. */}
                  {canDeleteShared(cm.byId ?? null, myId) && (
                    <span className="comment-actions">
                      <button type="button" title="Edit" onClick={() => onEditComment(i, cm)}>
                        <I.Edit size={11} />
                      </button>
                      <button type="button" title="Delete" onClick={() => onDeleteComment(i, cm)}>
                        <I.Cross size={11} />
                      </button>
                    </span>
                  )}
                </div>
                <div style={{ color: "var(--color-fg)" }}>{cm.c}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {previewing && (
        <div className="docs-preview-overlay">
          <div className="docs-preview-toolbar">
            <span className="mono" style={{ fontSize: 11, color: "var(--color-fg-faint)" }}>
              PREVIEW · {activeNode?.name ?? "Untitled"}
              {currentVersion ? ` · ${currentVersion}` : ""}
            </span>
            <span style={{ flex: 1 }} />
            <button className="tb-btn" type="button" onClick={exportDocPdf}>
              <I.Export size={13} /> Export PDF
            </button>
            <button
              className="tb-btn"
              type="button"
              onClick={() => setPreviewing(false)}
              title="Exit preview (Esc)"
            >
              <I.Cross size={12} /> Exit
            </button>
          </div>
          <div className="docs-preview-sheet">
            <div className="docs-page">
              {customBody !== undefined ? (
                <MarkdownBody text={customBody} />
              ) : (
                stockBody ?? (
                  <>
                    <h1>{activeNode?.name ?? "Untitled"}</h1>
                    <div className="meta-row">
                      <span>NO CONTENT YET</span>
                    </div>
                    <p style={{ color: "var(--color-fg-faint)" }}>
                      This document doesn't have a body yet. Click <b>Edit</b> to start writing.
                    </p>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
