// docs.jsx — Documentation Hub module

const { I, DATA } = window;

function DocTreeNode({ node, depth, activeId, setActive, expanded, toggle }) {
  const isOpen = expanded.has(node.id);
  return (
    <>
      <div className="docs-node"
           data-active={node.id === activeId ? "1" : "0"}
           style={{ paddingLeft: 8 + depth * 14 }}
           onClick={() => {
             if (node.kind === "folder") toggle(node.id);
             else setActive(node.id);
           }}>
        {node.kind === "folder" ? (
          <I.Chev size={10} dir={isOpen ? "down" : "right"} />
        ) : <span style={{ width: 10 }} />}
        <span className="ico">
          {node.kind === "folder" ? <I.Folder size={12} /> : <I.File size={12} />}
        </span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
      </div>
      {node.kind === "folder" && isOpen && node.children?.map((c) => (
        <DocTreeNode key={c.id} node={c} depth={depth + 1}
                     activeId={activeId} setActive={setActive}
                     expanded={expanded} toggle={toggle} />
      ))}
    </>
  );
}

function DocsModule() {
  const [activeId, setActive] = React.useState("d-prj-ros");
  const [expanded, setExpanded] = React.useState(new Set(["d-prj", "d-spec", "d-sop"]));
  const toggle = (id) => setExpanded((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <>
      <div className="left-pane">
        <div className="pane-hd"><span>DOCS TREE</span><span className="spacer" /><button className="icon-btn"><I.Plus size={12} /></button></div>
        <div className="search">
          <I.Search size={12} />
          <input placeholder="Search docs…" />
        </div>
        <div className="pane-body">
          <div className="docs-tree">
            {DATA.DOC_TREE.map((n) => (
              <DocTreeNode key={n.id} node={n} depth={0}
                           activeId={activeId} setActive={setActive}
                           expanded={expanded} toggle={toggle} />
            ))}
          </div>
          <div className="section-h"><span>RECENT</span><span className="line" /></div>
          {[
            { id: "r1", n: "Cue Sheet — Day 1", w: "M. Reyes", t: "12m" },
            { id: "r2", n: "ROE Ruby RB2.6 — Spec", w: "K. Tanaka", t: "1h" },
            { id: "r3", n: "Load-In Procedure", w: "S. Larsson", t: "3h" },
          ].map((r) => (
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
          <span className="crumb-curr mono" style={{ color: "var(--fg)" }}>Run-of-Show v3.2</span>
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

          <p>This document is the operational reference for the Helios Auditorium load-in and main session days.
          All cue numbers, signal paths, and asset IDs are linked to live records — clicking a reference opens the
          corresponding asset, system node, or panel.</p>

          <h2>01 · System Overview</h2>
          <p>The room is driven by a redundant Brompton SX40 pair (
            <a className="ref">BMD-S40-001</a> / <a className="ref">BMD-S40-002</a>)
            feeding the <a className="ref">W1 · Main Lobby Wall</a>
            (P2.6, 18×8 cabinets, 9000×2080 native). Audio reinforcement is via
            <a className="ref">DGC-SD12-001</a> through <a className="ref">LA-12X-001</a>.</p>

          <div className="callout">
            <strong style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em" }}>NOTE</strong>
            <div style={{ marginTop: 4 }}>SX40 #1 carries the left half of the wall, SX40 #2 the right.
            Failover is manual — see <a className="ref">SOP · Wall Calibration §4</a>.</div>
          </div>

          <h2>02 · Load-In · Day 1 (07:00 – 16:00)</h2>
          <ul>
            <li><code>07:00</code> — Truck arrival; rigging walk-through with FOH</li>
            <li><code>08:00</code> — Truss to height; pickup points marked at 6 hangs · 84 kg/pt</li>
            <li><code>10:30</code> — Panel hang begins (left half first); ref <a className="ref">SOP · Load-In §2.4</a></li>
            <li><code>13:00</code> — Processor power-up; data sync via <a className="ref">10GbE A/B</a></li>
            <li><code>14:30</code> — Calibration sweep — see <a className="ref">SOP · Wall Calibration</a></li>
            <li><code>15:30</code> — Audio system checks; FOH walk</li>
            <li><code>16:00</code> — End of Day 1; system held overnight in standby</li>
          </ul>

          <h2>03 · Show · Day 2 (09:00 – 21:00)</h2>
          <p>Director cues delivered over <code>Stage Manager → Cue 1</code>. Standby pages issued
          5 min before each major change. Two warnings flagged on the system:
          <a className="ref" style={{ color: "var(--warn)", borderColor: "var(--warn)" }}>Panel C7,R3 fault</a>
          and <a className="ref" style={{ color: "var(--warn)", borderColor: "var(--warn)" }}>SX40 #1 thermal</a> —
          both have hot-swap spares staged stage-left.</p>

          <h2>04 · Strike · Day 3 (06:00 – 11:00)</h2>
          <p>Reverse load-in order. Power down via SOP. All assets returned to crates and
          checked back into <a className="ref">Inventory</a> with QC pass.</p>
        </div>
      </div>

      <div className="right-pane">
        <div className="pane-hd"><span>VERSION HISTORY</span></div>
        <div className="version-list">
          {DATA.DOC_VERSIONS.map((v, i) => (
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
          {[
            { k: "ASSET", n: "BMD-S40-001 · Brompton SX40" },
            { k: "ASSET", n: "ROE-RB2.6-A1 · 24-pack" },
            { k: "WALL",  n: "W1 · Main Lobby Wall" },
            { k: "NODE",  n: "n4 · SX40 Processor #1" },
            { k: "DOC",   n: "SOP · Wall Calibration" },
            { k: "DOC",   n: "Patch List · Day 1" },
          ].map((r, i) => (
            <div key={i} className="list-row">
              <span className="chip accent" style={{ minWidth: 44, justifyContent: "center" }}>{r.k}</span>
              <span className="lbl">{r.n}</span>
            </div>
          ))}
        </div>
        <div className="pane-hd"><span>COMMENTS</span><span className="spacer" /><span className="mono faint" style={{ fontSize: 10 }}>3 OPEN</span></div>
        <div style={{ padding: "0 12px 12px", fontSize: 11.5 }}>
          {[
            { who: "K. Tanaka", t: "12m", c: "Shifted cue 14 by +2s — confirmed with director." },
            { who: "S. Larsson", t: "1h", c: "Need a hot spare staged stage-left for SX40 #1." },
          ].map((cm, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--line-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span className="mono accent" style={{ fontSize: 10 }}>{cm.who}</span>
                <span className="mono faint" style={{ fontSize: 10 }}>{cm.t}</span>
              </div>
              <div style={{ color: "var(--fg)" }}>{cm.c}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

window.DocsModule = DocsModule;
