import { Fragment, useRef, useState } from "react";
import { DeviceLink } from "@/components/DeviceLink";
import { I } from "@/components/Icon";
import { PrintSheet } from "@/components/PrintSheet";
import { downloadCsv, stamp } from "@/lib/export-csv";
import { SYSTEM_DEVICES } from "@/lib/system-data";
import { useApp } from "@/store/useApp";
import { useCatalog } from "@/store/useCatalog";
import { confirmDialog, promptDialog } from "@/store/useDialog";
import type { Lane, PatchEntry, PatchLane, SystemEdge, SystemNode } from "@/types";
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

const LANE_TO_PATCH_LANE: Record<Lane, PatchLane> = {
  video: "video",
  audio: "audio",
  network: "net",
  power: "pwr",
};

// Default cable per signal type. The graph models lanes, not connector types, so
// this is the starting assumption a designer overrides on the real patch sheet.
const LANE_CABLE: Record<Lane, string> = {
  video: "SDI",
  audio: "XLR",
  network: "CAT6A",
  power: "AC",
};

// A patch row is an edge plus the fields it doesn't carry itself. Ports are
// numbered per node per lane in the order connections were made; any of the
// three editable fields falls back to that derivation when not overridden.
interface PatchRow extends PatchEntry {
  edge: SystemEdge;
  custom: { srcPort: boolean; destPort: boolean; cable: boolean };
}

function buildPatchRows(nodes: SystemNode[], edges: SystemEdge[]): PatchRow[] {
  const outSeen = new Map<string, number>();
  const inSeen = new Map<string, number>();
  return edges.map((e, i) => {
    const outKey = `${e.from}|${e.lane}`;
    const inKey = `${e.to}|${e.lane}`;
    const outN = (outSeen.get(outKey) ?? 0) + 1;
    const inN = (inSeen.get(inKey) ?? 0) + 1;
    outSeen.set(outKey, outN);
    inSeen.set(inKey, inN);
    return {
      id: `P${String(i + 1).padStart(3, "0")}`,
      src: nodes.find((n) => n.id === e.from)?.name ?? e.from,
      srcPort: e.srcPort ?? `OUT ${outN}`,
      dest: nodes.find((n) => n.id === e.to)?.name ?? e.to,
      destPort: e.destPort ?? `IN ${inN}`,
      lane: LANE_TO_PATCH_LANE[e.lane],
      cable: e.cable ?? LANE_CABLE[e.lane],
      edge: e,
      custom: {
        srcPort: e.srcPort != null,
        destPort: e.destPort != null,
        cable: e.cable != null,
      },
    };
  });
}

type PatchField = "srcPort" | "destPort" | "cable";

// An editable patch cell. Derived values render muted; once overridden the value
// reads as normal text, so a designer can see at a glance which parts of the
// schedule are the app's assumption and which they've confirmed. Clearing the
// field drops the override rather than storing an empty string.
function PatchCell({
  row,
  field,
  onCommit,
}: {
  row: PatchRow;
  field: PatchField;
  onCommit: (row: PatchRow, field: PatchField, value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? row[field];
  return (
    <input
      className="tbl-input"
      data-custom={row.custom[field] ? "1" : "0"}
      value={value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft != null) onCommit(row, field, draft);
        setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

const NODE_W = 150;
const NODE_H_BASE = 56;

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
  const projectName = useApp((s) => s.project.name);
  const projectCode = useApp((s) => s.project.code);
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
  const updateEdge = useSystem((s) => s.updateEdge);
  const devices = useCatalog((s) => s.system);
  const addSystemDef = useCatalog((s) => s.addSystemDef);
  const removeSystemDef = useCatalog((s) => s.removeSystemDef);
  const [paletteSearch, setPaletteSearch] = useState("");

  const addDevice = async () => {
    const name = (await promptDialog("Device name?"))?.trim();
    if (!name) return;
    const cat = (await promptDialog("Palette group / category?", "VIDEO SOURCES"))?.trim() || "CUSTOM";
    const type = (
      (await promptDialog("Node type? (SOURCE, PROC, MIXER, AUDIO, POWER…)", "SOURCE"))?.trim() || "SOURCE"
    ).toUpperCase();
    const laneRaw =
      (await promptDialog("Primary signal? (video, audio, network, power)", "video"))?.trim().toLowerCase() ?? "video";
    const lane = (LANES.includes(laneRaw as Lane) ? laneRaw : "video") as Lane;
    const role = (await promptDialog("Role? (source, sink, inline)", "source"))?.trim().toLowerCase() || "source";
    addSystemDef({
      id: `sys-custom-${Date.now().toString(36)}`,
      cat,
      type,
      name,
      in: role === "sink" || role === "inline" ? [lane] : undefined,
      out: role === "source" || role === "inline" ? [lane] : undefined,
      details: {},
    });
  };

  const node = nodes.find((n) => n.id === selectedId);
  const visibleEdges = edges.filter((e) => lanes[e.lane]);
  const patchRows = buildPatchRows(nodes, edges);

  const isRowCustom = (p: PatchRow) => p.custom.srcPort || p.custom.destPort || p.custom.cable;

  const commitPatchField = (p: PatchRow, field: PatchField, raw: string) => {
    const next = raw.trim();
    const { from, to, lane } = p.edge;
    // An empty field means "go back to the derived value", not "blank it out".
    updateEdge(from, to, lane, { [field]: next === "" ? undefined : next });
  };

  const resetPatchRow = (p: PatchRow) => {
    const { from, to, lane } = p.edge;
    updateEdge(from, to, lane, { srcPort: undefined, destPort: undefined, cable: undefined });
  };

  const exportPatchCsv = () => {
    downloadCsv(
      `Blackburst-${projectCode}-patch-${stamp()}.csv`,
      ["ID", "Lane", "Source", "Src port", "Destination", "Dest port", "Cable"],
      patchRows.map((p) => [p.id, p.lane.toUpperCase(), p.src, p.srcPort, p.dest, p.destPort, p.cable]),
    );
  };

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
    const id = e.dataTransfer.getData(PALETTE_MIME);
    if (!id) return;
    e.preventDefault();
    const dev = SYSTEM_DEVICES.find((d) => d.id === id);
    if (!dev) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.round(e.clientX - rect.left - NODE_W / 2));
    const y = Math.max(0, Math.round(e.clientY - rect.top - NODE_H_BASE / 2));
    addNode({
      type: dev.type,
      name: dev.name,
      x,
      y,
      in: dev.in,
      out: dev.out,
      details: { ...dev.details },
    });
  };

  const paletteQuery = paletteSearch.trim().toLowerCase();
  const visibleDevices = paletteQuery
    ? SYSTEM_DEVICES.filter(
        (d) =>
          d.name.toLowerCase().includes(paletteQuery) ||
          d.cat.toLowerCase().includes(paletteQuery) ||
          d.type.toLowerCase().includes(paletteQuery),
      )
    : SYSTEM_DEVICES;
  const paletteCats: string[] = [];
  for (const d of visibleDevices) if (!paletteCats.includes(d.cat)) paletteCats.push(d.cat);

  return (
    <>
      <PrintSheet title="Patch Schedule" subtitle={`${nodes.length} devices · ${patchRows.length} connections`}>
        <h2>Connections</h2>
        <table className="print-tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Lane</th>
              <th>Source</th>
              <th>Src port</th>
              <th>Destination</th>
              <th>Dest port</th>
              <th>Cable</th>
            </tr>
          </thead>
          <tbody>
            {patchRows.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.lane.toUpperCase()}</td>
                <td>{p.src}</td>
                <td>{p.srcPort}</td>
                <td>{p.dest}</td>
                <td>{p.destPort}</td>
                <td>{p.cable}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="print-summary">
          {PATCH_LANES.map((l) => (
            <div key={l}>
              <dt>{l.toUpperCase()}</dt>
              <dd>{patchRows.filter((p) => p.lane === l).length}</dd>
            </div>
          ))}
        </div>
      </PrintSheet>

      {/* LEFT — palette */}
      <div className="left-pane">
        <div className="pane-hd">
          <span>DEVICE PALETTE</span>
          <span className="spacer" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            {visibleDevices.length}
          </span>
          <button className="icon-btn" title="Add device" onClick={addDevice}>
            <I.Plus size={12} />
          </button>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input
            placeholder="Search devices…"
            value={paletteSearch}
            onChange={(e) => setPaletteSearch(e.target.value)}
          />
        </div>
        <div className="pane-body">
          {paletteCats.map((cat) => (
            <Fragment key={cat}>
              <div className="section-h">
                <span>{cat}</span>
                <span className="line" />
              </div>
              {visibleDevices
                .filter((d) => d.cat === cat)
                .map((d) => {
                  const isCustom = devices.some((c) => c.id === d.id);
                  return (
                    <div
                      key={d.id}
                      className="list-row"
                      style={{ cursor: "grab" }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(PALETTE_MIME, d.id);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                    >
                      <I.Move size={12} />
                      <span className="lbl">{d.name}</span>
                      {isCustom && (
                        <button
                          className="icon-btn"
                          style={{ marginLeft: "auto" }}
                          title="Remove custom device"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const ok = await confirmDialog(
                              `Remove custom device "${d.name}" from the palette?`,
                              { danger: true, confirmLabel: "Remove" },
                            );
                            if (ok) removeSystemDef(d.id);
                          }}
                        >
                          <I.Cross size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
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
          {view === "patch" && (
            <>
              <button className="tb-btn" disabled={patchRows.length === 0} onClick={exportPatchCsv}>
                <I.Export size={13} /> CSV
              </button>
              <button
                className="tb-btn"
                disabled={patchRows.length === 0}
                onClick={() => window.print()}
              >
                <I.Docs size={13} /> Print
              </button>
            </>
          )}
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
                <span className="v">{projectName}</span>
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

        {view === "patch" && patchRows.length === 0 && (
          <div style={{ flex: 1, background: "var(--color-bg-2)" }}>
            <div className="empty" style={{ padding: 40 }}>
              <I.System size={28} />
              <span className="mono" style={{ fontSize: 11, color: "var(--color-fg-faint)" }}>
                NO CONNECTIONS YET
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--color-fg-faint)",
                  textAlign: "center",
                  maxWidth: 260,
                  lineHeight: 1.4,
                }}
              >
                Drag between node ports in the GRAPH view. Every connection you make appears here
                as a patch row.
              </span>
            </div>
          </div>
        )}

        {view === "patch" && patchRows.length > 0 && (
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
                {patchRows.map((p) => {
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
                      <td>
                        <PatchCell row={p} field="srcPort" onCommit={commitPatchField} />
                      </td>
                      <td>{p.dest}</td>
                      <td>
                        <PatchCell row={p} field="destPort" onCommit={commitPatchField} />
                      </td>
                      <td>
                        <PatchCell row={p} field="cable" onCommit={commitPatchField} />
                      </td>
                      <td>
                        {isRowCustom(p) && (
                          <button
                            className="icon-btn"
                            title="Reset this row to derived values"
                            onClick={() => resetPatchRow(p)}
                          >
                            <I.Undo size={11} />
                          </button>
                        )}
                      </td>
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
            <DeviceLink
              deviceId={node.deviceId}
              onChange={(id) => updateNode(node.id, { deviceId: id })}
              defaultLabel={node.name}
              model={node.name}
              omit={{ kind: "node", id: node.id }}
            />

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
              <span>ACTIONS</span>
              <span className="line" />
            </div>
            <button
              className="tb-btn danger"
              onClick={async () => {
                const ok = await confirmDialog(
                  `Remove node "${node.name}"? Connected edges will also be deleted.`,
                  { danger: true, confirmLabel: "Remove" },
                );
                if (ok) removeNode(node.id);
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
                <div className="val">{patchRows.length}</div>
              </div>
              <div className="readout">
                <div className="lbl">Devices</div>
                <div className="val">{nodes.length}</div>
              </div>
            </div>
            <div className="section-h">
              <span>BY LANE</span>
              <span className="line" />
            </div>
            {PATCH_LANES.map((l) => {
              const count = patchRows.filter((p) => p.lane === l).length;
              const maxCount = Math.max(
                1,
                ...PATCH_LANES.map((x) => patchRows.filter((p) => p.lane === x).length),
              );
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
                      style={{ width: `${(count / maxCount) * 100}%`, background: LANE_COLOR[lane] }}
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
