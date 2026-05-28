import { Fragment, useRef, useState } from "react";
import { I } from "@/components/Icon";
import { PATCH_SHEET } from "@/lib/data";
import { useApp } from "@/store/useApp";
import type { Lane, PatchLane, SystemEdge, SystemNode } from "@/types";
import { useSystem } from "./store";

const DRAG_THRESHOLD_PX = 3;

const LANE_COLOR: Record<Lane, string> = {
  video: "var(--color-magenta)",
  audio: "var(--color-info)",
  network: "var(--accent)",
  power: "var(--color-warn)",
};

const PATCH_LANE_TO_LANE: Record<PatchLane, Lane> = {
  video: "video",
  audio: "audio",
  net: "network",
  pwr: "power",
};

const NODE_W = 150;
const NODE_H_BASE = 56;

interface PaletteGroup {
  cat: string;
  type: string;
  in?: Lane[];
  out?: Lane[];
  details: Record<string, string>;
  items: string[];
}

const PALETTE_GROUPS: PaletteGroup[] = [
  {
    cat: "VIDEO SOURCES",
    type: "SOURCE",
    out: ["video", "network"],
    details: { res: "1920×1080", fps: "60p" },
    items: ["Resolume Mac", "Disguise gx 2c", "BMD HyperDeck", "PTZ Camera"],
  },
  {
    cat: "PROCESSORS",
    type: "PROC",
    in: ["video"],
    out: ["network"],
    details: { ports: "4×10GbE", load: "0%" },
    items: ["Brompton SX40", "Brompton Tessera S8", "Novastar MX40", "Megapixel Helios"],
  },
  {
    cat: "MIXERS",
    type: "MIXER",
    in: ["video", "video"],
    out: ["video"],
    details: { inputs: "4×SDI", outputs: "2×SDI" },
    items: ["vMix M4", "Blackmagic ATEM", "Roland V-160HD"],
  },
  {
    cat: "AUDIO",
    type: "AUDIO",
    in: ["audio"],
    out: ["audio"],
    details: { channels: "32", aux: "8" },
    items: ["DiGiCo SD12", "Yamaha CL5", "Shure ULXD4Q"],
  },
  {
    cat: "POWER",
    type: "POWER",
    out: ["power"],
    details: { capacity: "—", load: "—" },
    items: ["Distro 200A 3ϕ", "Lex SQ-12IL"],
  },
];

const PALETTE_MIME = "application/x-blackburst-palette";

const LANES: Lane[] = ["video", "audio", "network", "power"];
const PATCH_LANES: PatchLane[] = ["video", "audio", "net", "pwr"];

function pathFor(e: SystemEdge, nodes: SystemNode[]): string {
  const a = nodes.find((n) => n.id === e.from);
  const b = nodes.find((n) => n.id === e.to);
  if (!a || !b) return "";
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H_BASE / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H_BASE / 2;
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

export function SystemDesignerModule() {
  const canvasStyle = useApp((s) => s.tweaks.canvasStyle);
  const nodes = useSystem((s) => s.nodes);
  const edges = useSystem((s) => s.edges);
  const lanes = useSystem((s) => s.lanes);
  const toggleLane = useSystem((s) => s.toggleLane);
  const selectedId = useSystem((s) => s.selectedNodeId);
  const setSelected = useSystem((s) => s.setSelectedNodeId);
  const view = useSystem((s) => s.view);
  const setView = useSystem((s) => s.setView);
  const updateNode = useSystem((s) => s.updateNode);
  const addNode = useSystem((s) => s.addNode);
  const removeNode = useSystem((s) => s.removeNode);
  const addEdge = useSystem((s) => s.addEdge);
  const removeEdge = useSystem((s) => s.removeEdge);

  const node = nodes.find((n) => n.id === selectedId);
  const visibleEdges = edges.filter((e) => lanes[e.lane]);

  const dragRef = useRef<{
    id: string;
    startCx: number;
    startCy: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [edgeDraft, setEdgeDraft] = useState<{
    fromId: string;
    lane: Lane;
    startX: number;
    startY: number;
    cursorX: number;
    cursorY: number;
  } | null>(null);

  const onPortMouseDown = (e: React.MouseEvent, fromNode: SystemNode, lane: Lane) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startX = fromNode.x + NODE_W;
    const startY = fromNode.y + NODE_H_BASE / 2;
    setEdgeDraft({
      fromId: fromNode.id,
      lane,
      startX,
      startY,
      cursorX: e.clientX - rect.left,
      cursorY: e.clientY - rect.top,
    });

    const onMove = (ev: MouseEvent) => {
      setEdgeDraft((d) =>
        d ? { ...d, cursorX: ev.clientX - rect.left, cursorY: ev.clientY - rect.top } : null,
      );
    };
    const cleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
    };
    const onUp = (ev: MouseEvent) => {
      cleanup();
      setEdgeDraft(null);
      const el = ev.target as HTMLElement | null;
      if (!el) return;
      const dir = el.dataset?.portDir;
      const targetId = el.dataset?.nodeId;
      const targetLane = el.dataset?.lane as Lane | undefined;
      if (dir !== "in" || !targetId || !targetLane) return;
      if (targetLane !== lane) return;
      if (targetId === fromNode.id) return;
      addEdge({ from: fromNode.id, to: targetId, lane, label: lane.toUpperCase() });
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        cleanup();
        setEdgeDraft(null);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
  };

  const onNodeMouseDown = (e: React.MouseEvent, n: SystemNode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      id: n.id,
      startCx: e.clientX,
      startCy: e.clientY,
      nodeX: n.x,
      nodeY: n.y,
      moved: false,
    };
    setDraggingId(n.id);

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = ev.clientX - d.startCx;
      const dy = ev.clientY - d.startCy;
      if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) d.moved = true;
      if (d.moved) {
        updateNode(d.id, {
          x: Math.max(0, Math.round(d.nodeX + dx)),
          y: Math.max(0, Math.round(d.nodeY + dy)),
        });
      }
    };

    const onUp = () => {
      const d = dragRef.current;
      if (d && !d.moved) setSelected(d.id);
      dragRef.current = null;
      setDraggingId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes(PALETTE_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const raw = e.dataTransfer.getData(PALETTE_MIME);
    if (!raw) return;
    e.preventDefault();
    const [giStr, iiStr] = raw.split(":");
    const gi = Number(giStr);
    const ii = Number(iiStr);
    const group = PALETTE_GROUPS[gi];
    const name = group?.items[ii];
    if (!group || !name) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.round(e.clientX - rect.left - NODE_W / 2));
    const y = Math.max(0, Math.round(e.clientY - rect.top - NODE_H_BASE / 2));
    addNode({
      type: group.type,
      name,
      x,
      y,
      in: group.in,
      out: group.out,
      details: { ...group.details },
    });
  };

  return (
    <>
      {/* LEFT — palette */}
      <div className="left-pane">
        <div className="pane-hd">
          <span>DEVICE PALETTE</span>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input placeholder="Drag to canvas…" />
        </div>
        <div className="pane-body">
          {PALETTE_GROUPS.map((g, gi) => (
            <Fragment key={g.cat}>
              <div className="section-h">
                <span>{g.cat}</span>
                <span className="line" />
              </div>
              {g.items.map((it, ii) => (
                <div
                  key={it}
                  className="list-row"
                  style={{ cursor: "grab" }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(PALETTE_MIME, `${gi}:${ii}`);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                >
                  <I.Move size={12} />
                  <span className="lbl">{it}</span>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      {/* CENTER — graph or patch */}
      <div className="center-pane">
        <div className="canvas-toolbar">
          <div className="tg">
            <button data-active={view === "graph" ? "1" : "0"} onClick={() => setView("graph")}>
              GRAPH
            </button>
            <button data-active={view === "patch" ? "1" : "0"} onClick={() => setView("patch")}>
              PATCH SHEET
            </button>
          </div>
          <div className="divider-v" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            LAYERS
          </span>
          <div className="lane-toggles">
            {LANES.map((l) => (
              <button
                key={l}
                className={`lane-tg ${l}`}
                data-on={lanes[l] ? "1" : "0"}
                onClick={() => toggleLane(l)}
              >
                <span className="sw" />
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ flex: 1 }} />
          <button className="tb-btn">
            <I.Bolt size={13} /> Auto-Route
          </button>
          <button className="tb-btn">
            <I.Export size={13} /> PDF / CAD
          </button>
        </div>

        {view === "graph" && (
          <div
            ref={canvasRef}
            className="led-canvas"
            data-canvas-style={canvasStyle}
            data-edge-draft={edgeDraft?.lane ?? undefined}
            style={{ cursor: edgeDraft ? "crosshair" : "default" }}
            onDragOver={onCanvasDragOver}
            onDrop={onCanvasDrop}
          >
            <div className="canvas-overlay tl">
              <div className="row">
                <span className="k">SYSTEM</span>
                <span className="v">Helios Auditorium · v0042</span>
              </div>
              <div className="row">
                <span className="k">NODES</span>
                <span className="v">{nodes.length}</span>
                <span className="k">EDGES</span>
                <span className="v">
                  {visibleEdges.length}/{edges.length}
                </span>
              </div>
            </div>
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10" fill="currentColor" />
                </marker>
              </defs>
              {visibleEdges.map((e, i) => (
                <g key={`p${i}`} style={{ color: LANE_COLOR[e.lane] }}>
                  <path
                    d={pathFor(e, nodes)}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeOpacity="0.7"
                    markerEnd="url(#arrow)"
                  />
                </g>
              ))}
              {visibleEdges.map((e, i) => {
                const a = nodes.find((n) => n.id === e.from);
                const b = nodes.find((n) => n.id === e.to);
                if (!a || !b) return null;
                const mx = (a.x + NODE_W + b.x) / 2;
                const my = (a.y + b.y) / 2 + NODE_H_BASE / 2;
                return (
                  <g key={`l${i}`}>
                    <rect
                      x={mx - 28}
                      y={my - 8}
                      width="56"
                      height="14"
                      rx="2"
                      fill="var(--color-bg-1)"
                      stroke={LANE_COLOR[e.lane]}
                      strokeWidth="0.5"
                      strokeOpacity="0.5"
                    />
                    <text
                      x={mx}
                      y={my + 2}
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      fontSize="9"
                      fill={LANE_COLOR[e.lane]}
                    >
                      {e.label}
                    </text>
                  </g>
                );
              })}
              {edgeDraft && (
                <line
                  x1={edgeDraft.startX}
                  y1={edgeDraft.startY}
                  x2={edgeDraft.cursorX}
                  y2={edgeDraft.cursorY}
                  stroke={LANE_COLOR[edgeDraft.lane]}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.85"
                />
              )}
            </svg>

            {nodes.map((n) => (
              <div
                key={n.id}
                className="node"
                data-selected={selectedId === n.id ? "1" : "0"}
                data-dragging={draggingId === n.id ? "1" : "0"}
                style={{ left: n.x, top: n.y, width: NODE_W }}
                onMouseDown={(e) => onNodeMouseDown(e, n)}
              >
                <div className="node-hd">
                  <span style={{ color: "var(--accent)" }}>●</span>
                  <span className="typ">{n.type}</span>
                  <span style={{ marginLeft: "auto", color: "var(--color-fg-faint)" }}>
                    {n.id}
                  </span>
                </div>
                <div className="node-bd">
                  <div
                    style={{
                      color: "var(--color-fg)",
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      marginBottom: 4,
                    }}
                  >
                    {n.name}
                  </div>
                  {Object.entries(n.details).map(([k, v]) => (
                    <div className="row" key={k}>
                      <span className="k">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                {n.in?.map((lane, i) => (
                  <span
                    key={`in${i}`}
                    className={`node-port in ${lane}`}
                    style={{ top: 28 + i * 14 }}
                    data-node-id={n.id}
                    data-port-dir="in"
                    data-lane={lane}
                  />
                ))}
                {n.out?.map((lane, i) => (
                  <span
                    key={`out${i}`}
                    className={`node-port out ${lane}`}
                    style={{ top: 28 + i * 14 }}
                    data-node-id={n.id}
                    data-port-dir="out"
                    data-lane={lane}
                    onMouseDown={(e) => onPortMouseDown(e, n, lane)}
                  />
                ))}
              </div>
            ))}

            <div className="crosshair-readout">
              SCHEMATIC · GRID 16 · AUTO-ROUTE: ORTHOGONAL
            </div>
          </div>
        )}

        {view === "patch" && (
          <div style={{ flex: 1, overflow: "auto", background: "var(--color-bg-2)" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>LANE</th>
                  <th>SOURCE</th>
                  <th>SRC PORT</th>
                  <th>DEST</th>
                  <th>DEST PORT</th>
                  <th>CABLE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {PATCH_SHEET.map((p) => {
                  const lane = PATCH_LANE_TO_LANE[p.lane];
                  return (
                    <tr key={p.id}>
                      <td className="muted">{p.id}</td>
                      <td>
                        <span
                          className="chip"
                          style={{
                            color: LANE_COLOR[lane],
                            borderColor: "var(--color-line-strong)",
                          }}
                        >
                          {p.lane.toUpperCase()}
                        </span>
                      </td>
                      <td>{p.src}</td>
                      <td className="muted">{p.srcPort}</td>
                      <td>{p.dest}</td>
                      <td className="muted">{p.destPort}</td>
                      <td className="muted">{p.cable}</td>
                      <td className="muted">●</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT — Inspector */}
      <div className="right-pane">
        <div className="pane-hd">
          <span>{view === "graph" ? "NODE INSPECTOR" : "PATCH STATS"}</span>
          <span className="spacer" />
          <span className="chip accent">{node?.id ?? "—"}</span>
        </div>

        {view === "graph" && node && (
          <div className="pane-body">
            <div className="readout accent">
              <div className="lbl">{node.type}</div>
              <div className="val" style={{ fontSize: 16 }}>
                {node.name}
              </div>
            </div>
            <div className="section-h">
              <span>SPECIFICATION</span>
              <span className="line" />
            </div>
            <div className="kv">
              {Object.entries(node.details).map(([k, v]) => (
                <Fragment key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </Fragment>
              ))}
            </div>
            <div className="section-h">
              <span>CONNECTIONS</span>
              <span className="line" />
            </div>
            {edges
              .filter((e) => e.from === node.id || e.to === node.id)
              .map((e, i) => {
                const isOut = e.from === node.id;
                const peer = nodes.find((n) => n.id === (isOut ? e.to : e.from));
                if (!peer) return null;
                return (
                  <div key={`c${i}`} className="list-row">
                    <span className="chip" style={{ color: LANE_COLOR[e.lane] }}>
                      {isOut ? "→" : "←"}
                    </span>
                    <span className="lbl">{peer.name}</span>
                    <span className="meta">{e.label}</span>
                    <button
                      className="icon-btn"
                      aria-label={`Remove edge to ${peer.name}`}
                      onClick={() => removeEdge(e.from, e.to, e.lane)}
                      style={{ marginLeft: 4 }}
                    >
                      <I.Cross size={11} />
                    </button>
                  </div>
                );
              })}
            <div className="section-h">
              <span>HEALTH</span>
              <span className="line" />
            </div>
            <div className="kv">
              <span className="k">Status</span>
              <span className="v" style={{ color: "var(--accent)" }}>
                ● ONLINE
              </span>
              <span className="k">Last sync</span>
              <span className="v">14:21:08</span>
              <span className="k">Firmware</span>
              <span className="v">3.4.12</span>
              <span className="k">Errors (24h)</span>
              <span className="v">0</span>
            </div>
            <div className="section-h">
              <span>ACTIONS</span>
              <span className="line" />
            </div>
            <button
              className="tb-btn danger"
              onClick={() => {
                if (confirm(`Remove node "${node.name}"? Connected edges will also be deleted.`)) {
                  removeNode(node.id);
                }
              }}
              style={{ width: "100%", justifyContent: "center" }}
            >
              <I.Cross size={12} /> Remove node
            </button>
          </div>
        )}

        {view === "patch" && (
          <div className="pane-body">
            <div className="readout-grid">
              <div className="readout accent">
                <div className="lbl">Connections</div>
                <div className="val">{PATCH_SHEET.length}</div>
              </div>
              <div className="readout">
                <div className="lbl">Total cable</div>
                <div className="val">
                  486<span className="unit">ft</span>
                </div>
              </div>
            </div>
            <div className="section-h">
              <span>BY LANE</span>
              <span className="line" />
            </div>
            {PATCH_LANES.map((l) => {
              const count = PATCH_SHEET.filter((p) => p.lane === l).length;
              const lane = PATCH_LANE_TO_LANE[l];
              return (
                <div
                  key={l}
                  className="fld"
                  style={{ gridTemplateColumns: "60px 1fr 40px" }}
                >
                  <span className="k">{l.toUpperCase()}</span>
                  <div className="bar">
                    <div
                      className="bar-fill"
                      style={{ width: `${count * 8}%`, background: LANE_COLOR[lane] }}
                    />
                  </div>
                  <span className="mono num" style={{ textAlign: "right" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
