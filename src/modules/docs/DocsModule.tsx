import { useMemo } from "react";
import { I } from "@/components/Icon";
import { RefChip } from "@/components/RefChip";
import { goto } from "@/lib/nav";
import { useApp } from "@/store/useApp";
import {
  DOC_COMMENTS,
  DOC_TREE,
  DOC_VERSIONS,
  LINKED_REFS,
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

export function DocsModule() {
  const activeId = useDocs((s) => s.activeId);
  const setActive = useDocs((s) => s.setActive);
  const expandedArr = useDocs((s) => s.expanded);
  const toggle = useDocs((s) => s.toggle);
  const expanded = useMemo(() => new Set(expandedArr), [expandedArr]);

  return (
    <>
      <div className="left-pane">
        <div className="pane-hd">
          <span>DOCS TREE</span>
          <span className="spacer" />
          <button className="icon-btn"><I.Plus size={12} /></button>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input placeholder="Search docs…" />
        </div>
        <div className="pane-body">
          <div className="docs-tree">
            {DOC_TREE.map((n) => (
              <DocTreeNode
                key={n.id}
                node={n}
                depth={0}
                activeId={activeId}
                setActive={setActive}
                expanded={expanded}
                toggle={toggle}
              />
            ))}
          </div>
          <div className="section-h"><span>RECENT</span><span className="line" /></div>
          {RECENT_DOCS.map((r) => (
            <div key={r.id} className="list-row">
              <I.File size={12} />
              <span className="lbl">{r.n}</span>
              <span className="meta">{r.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="center-pane">
        <div className="canvas-toolbar">
          <span className="crumb mono">Helios Auditorium</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-curr mono">Run-of-Show v3.2</span>
          <span style={{ flex: 1 }} />
          <span className="chip accent">v3.2 · CURRENT</span>
          <button className="tb-btn"><I.Eye size={13} /> Preview</button>
          <button className="tb-btn"><I.Export size={13} /> Export PDF</button>
        </div>

        <div className="docs-page">
          <h1>Run-of-Show — Helios Auditorium Refresh</h1>
          <div className="meta-row">
            <span>REV v3.2</span>
            <span>EDITED Apr 28, 14:22 by M. Reyes</span>
            <span style={{ color: "var(--accent)" }}>● LOCKED FOR SHOW</span>
          </div>

          <p>
            This document is the operational reference for the Helios Auditorium load-in and main session days.
            All cue numbers, signal paths, and asset IDs are linked to live records — clicking a reference opens
            the corresponding asset, system node, or panel.
          </p>

          <h2>01 · System Overview</h2>
          <p>
            The room is driven by a redundant Brompton SX40 pair (
            <RefChip kind="asset" id="BMD-S40-001" /> /{" "}
            <RefChip kind="asset" id="BMD-S40-002" />) feeding the{" "}
            <RefChip kind="wall" id="W1">W1 · Main Lobby Wall</RefChip> (P2.6, 18×8 cabinets, 9000×2080
            native). Audio reinforcement is via <RefChip kind="asset" id="DGC-SD12-001" /> through{" "}
            <RefChip kind="asset" id="LA-12X-001" />.
          </p>

          <div className="callout">
            <strong
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.08em",
              }}
            >
              NOTE
            </strong>
            <div style={{ marginTop: 4 }}>
              SX40 #1 carries the left half of the wall, SX40 #2 the right. Failover is manual — see{" "}
              <RefChip kind="doc" id="d-sop-cal">SOP · Wall Calibration §4</RefChip>.
            </div>
          </div>

          <h2>02 · Load-In · Day 1 (07:00 – 16:00)</h2>
          <ul>
            <li><code>07:00</code> — Truck arrival; rigging walk-through with FOH</li>
            <li><code>08:00</code> — Truss to height; pickup points marked at 6 hangs · 84 kg/pt</li>
            <li>
              <code>10:30</code> — Panel hang begins (left half first); ref{" "}
              <RefChip kind="doc" id="d-sop-load">SOP · Load-In §2.4</RefChip>
            </li>
            <li>
              <code>13:00</code> — Processor power-up; data sync via{" "}
              <RefChip kind="node" id="n4">10GbE A/B</RefChip>
            </li>
            <li>
              <code>14:30</code> — Calibration sweep — see{" "}
              <RefChip kind="doc" id="d-sop-cal">SOP · Wall Calibration</RefChip>
            </li>
            <li><code>15:30</code> — Audio system checks; FOH walk</li>
            <li><code>16:00</code> — End of Day 1; system held overnight in standby</li>
          </ul>

          <h2>03 · Show · Day 2 (09:00 – 21:00)</h2>
          <p>
            Director cues delivered over <code>Stage Manager → Cue 1</code>. Standby pages issued 5 min before
            each major change. Two warnings flagged on the system:{" "}
            <RefChip
              kind="wall"
              id="W1"
              style={{ color: "var(--color-warn)", borderColor: "var(--color-warn)" }}
            >
              Panel C7,R3 fault
            </RefChip>{" "}
            and{" "}
            <RefChip
              kind="asset"
              id="BMD-S40-001"
              style={{ color: "var(--color-warn)", borderColor: "var(--color-warn)" }}
            >
              SX40 #1 thermal
            </RefChip>{" "}
            — both have hot-swap spares staged stage-left.
          </p>

          <h2>04 · Strike · Day 3 (06:00 – 11:00)</h2>
          <p>
            Reverse load-in order. Power down via SOP. All assets returned to crates and checked back into{" "}
            <a
              className="ref"
              onClick={(e) => {
                e.preventDefault();
                useApp.getState().setModule("inv");
              }}
            >
              Inventory
            </a>{" "}
            with QC pass.
          </p>
        </div>
      </div>

      <div className="right-pane">
        <div className="pane-hd"><span>VERSION HISTORY</span></div>
        <div className="version-list">
          {DOC_VERSIONS.map((v, i) => (
            <div key={v.v} className="version-row" data-current={i === 0 ? "1" : "0"}>
              <div className="v">{v.v} · {v.note}</div>
              <div className="meta">
                <span>{v.who}</span>
                <span>{v.when}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pane-hd"><span>LINKED REFERENCES</span></div>
        <div style={{ padding: "0 0 12px" }}>
          {LINKED_REFS.map((r, i) => {
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
          })}
        </div>
        <div className="pane-hd">
          <span>COMMENTS</span>
          <span className="spacer" />
          <span
            className="mono"
            style={{ fontSize: 10, color: "var(--color-fg-faint)" }}
          >
            3 OPEN
          </span>
        </div>
        <div style={{ padding: "0 12px 12px", fontSize: 11.5 }}>
          {DOC_COMMENTS.map((cm, i) => (
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
          ))}
        </div>
      </div>
    </>
  );
}
