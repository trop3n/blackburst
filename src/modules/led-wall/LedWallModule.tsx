import { useEffect } from "react";
import { I } from "@/components/Icon";
import { PrintSheet } from "@/components/PrintSheet";
import { FAULT_PANELS, PANEL_LIBRARY } from "@/lib/data";
import { LED_PROCESSORS } from "@/lib/led-processor-data";
import { canDeleteShared } from "@/lib/ownership";
import { useApp } from "@/store/useApp";
import { useAuth } from "@/store/useAuth";
import { useCatalog } from "@/store/useCatalog";
import { confirmDialog, promptDialog } from "@/store/useDialog";
import { computeWallCalc } from "./calculations";
import { useLedWall } from "./store";
import { validateWall } from "./validation";


export function LedWallModule() {
  const canvasStyle = useApp((s) => s.tweaks.canvasStyle);
  const latestRev = useApp((s) => s.revisions[0]);
  const walls = useLedWall((s) => s.walls);
  const layoutId = useLedWall((s) => s.layoutId);
  const selected = useLedWall((s) => s.selected);
  const tool = useLedWall((s) => s.tool);
  const zoom = useLedWall((s) => s.zoom);
  const showDims = useLedWall((s) => s.showDims);
  const showFaults = useLedWall((s) => s.showFaults);
  const tab = useLedWall((s) => s.tab);
  const setLayoutId = useLedWall((s) => s.setLayoutId);
  const setTool = useLedWall((s) => s.setTool);
  const setZoom = useLedWall((s) => s.setZoom);
  const setShowDims = useLedWall((s) => s.setShowDims);
  const setShowFaults = useLedWall((s) => s.setShowFaults);
  const setTab = useLedWall((s) => s.setTab);
  const updateWall = useLedWall((s) => s.updateWall);
  const addWall = useLedWall((s) => s.addWall);
  const removeWall = useLedWall((s) => s.removeWall);
  const measureFrom = useLedWall((s) => s.measureFrom);
  const measureTo = useLedWall((s) => s.measureTo);
  const handleCellClick = useLedWall((s) => s.handleCellClick);
  const clearMeasure = useLedWall((s) => s.clearMeasure);
  const addCol = useLedWall((s) => s.addCol);
  const addRow = useLedWall((s) => s.addRow);
  const panelSearch = useLedWall((s) => s.panelSearch);
  const setPanelSearch = useLedWall((s) => s.setPanelSearch);
  const customPanels = useCatalog((s) => s.panel);
  const addPanelDef = useCatalog((s) => s.addPanelDef);
  const removePanelDef = useCatalog((s) => s.removePanelDef);
  const catalogOwners = useCatalog((s) => s.owners);
  const myId = useAuth((s) => s.user?.id);

  const addPanel = async () => {
    const model = (await promptDialog("Panel model?"))?.trim();
    if (!model) return;
    const pitch = Number(await promptDialog("Pixel pitch (mm)?", "2.6")) || 2.6;
    const w = Math.max(1, Math.round(Number(await promptDialog("Panel width (mm)?", "500")) || 500));
    const h = Math.max(1, Math.round(Number(await promptDialog("Panel height (mm)?", "500")) || 500));
    const pxW = Math.max(
      1,
      Math.round(
        Number(await promptDialog("Pixels across?", String(Math.round(w / pitch)))) ||
          Math.round(w / pitch),
      ),
    );
    const pxH = Math.max(
      1,
      Math.round(
        Number(await promptDialog("Pixels down?", String(Math.round(h / pitch)))) ||
          Math.round(h / pitch),
      ),
    );
    const weight = Math.max(0, Number(await promptDialog("Weight (kg)?", "0")) || 0);
    const watts = Math.max(0, Math.round(Number(await promptDialog("Max power (W)?", "0")) || 0));
    addPanelDef({
      id: `panel-custom-${Date.now().toString(36)}`,
      model,
      pitch,
      w,
      h,
      pxW,
      pxH,
      weight,
      watts,
    });
  };

  const removePanel = async (id: string, model: string) => {
    const ok = await confirmDialog(`Remove custom panel "${model}" from the library?`, {
      danger: true,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    // Reset any wall still using it to the first built-in panel before removal.
    const fallback = PANEL_LIBRARY[0].id;
    for (const w of walls) if (w.panel === id) updateWall(w.id, { panel: fallback });
    removePanelDef(id);
  };

  const layout = walls.find((l) => l.id === layoutId) ?? walls[0];
  const panel = PANEL_LIBRARY.find((p) => p.id === layout.panel) ?? PANEL_LIBRARY[0];
  const panelSearchLc = panelSearch.trim().toLowerCase();
  const filteredPanels = panelSearchLc
    ? PANEL_LIBRARY.filter(
        (p) =>
          p.model.toLowerCase().includes(panelSearchLc) ||
          String(p.pitch).includes(panelSearchLc) ||
          p.id.toLowerCase().includes(panelSearchLc),
      )
    : PANEL_LIBRARY;
  const calc = computeWallCalc(layout, panel);
  const issues = validateWall(layout, panel, calc);

  // Render scale: fit wall into ~520×320 frame
  const maxFrameW = 520;
  const maxFrameH = 320;
  const aspectFit = Math.min(maxFrameW / calc.wallWmm, maxFrameH / calc.wallHmm);
  const scale = aspectFit * (zoom / 100);
  const frameW = calc.wallWmm * scale;
  const frameH = calc.wallHmm * scale;
  const panelPxW = panel.w * scale;
  const panelPxH = panel.h * scale;

  const dataRateGbps = (calc.resW * calc.resH * 60 * 30) / 1e9;

  useEffect(() => {
    if (tool !== "measure") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearMeasure();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, clearMeasure]);

  const measureDistMm =
    measureFrom && measureTo
      ? Math.hypot(
          (measureTo.c - measureFrom.c) * panel.w,
          (measureTo.r - measureFrom.r) * panel.h,
        )
      : null;
  const cursorByTool: Record<typeof tool, string> = {
    select: "default",
    draw: "default",
    erase: "not-allowed",
    measure: "crosshair",
  };
  const drawZoneSize = Math.max(22, Math.min(panelPxW, panelPxH));

  return (
    <>
      <PrintSheet
        title="Wall Elevation"
        subtitle={`${layout.name} · ${panel.model} · ${layout.cols}×${layout.rows} panels`}
      >
        <h2>Elevation</h2>
        <table className="wall-grid">
          <tbody>
            {Array.from({ length: layout.rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: layout.cols }).map((_, c) => (
                  <td key={c}>
                    {c + 1},{r + 1}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Specification</h2>
        <table className="print-tbl">
          <tbody>
            <tr>
              <th>Panel</th>
              <td>
                {panel.model} · {panel.pitch}mm · {panel.pxW}×{panel.pxH}px
              </td>
              <th>Panels</th>
              <td className="num">{calc.totalPanels}</td>
            </tr>
            <tr>
              <th>Physical size</th>
              <td>
                {calc.wallWmm} × {calc.wallHmm} mm ({calc.wallWft.toFixed(1)} × {calc.wallHft.toFixed(1)} ft)
              </td>
              <th>Resolution</th>
              <td className="num">
                {calc.resW}×{calc.resH}
              </td>
            </tr>
            <tr>
              <th>Processor</th>
              <td>
                {calc.procName} · {calc.procsNeeded} unit{calc.procsNeeded === 1 ? "" : "s"}
              </td>
              <th>Capacity</th>
              <td className="num">{(calc.procCapacity / 1e6).toFixed(1)} MP each</td>
            </tr>
            <tr>
              <th>Weight</th>
              <td className="num">{calc.totalWeight.toFixed(1)} kg</td>
              <th>+ 15% headers</th>
              <td className="num">{(calc.totalWeight * 1.15).toFixed(1)} kg</td>
            </tr>
            <tr>
              <th>Power</th>
              <td className="num">{(calc.totalWatts / 1000).toFixed(2)} kW</td>
              <th>Circuits</th>
              <td className="num">{calc.circuitsNeeded} × 20A</td>
            </tr>
          </tbody>
        </table>

        <div className="print-summary">
          <div>
            <dt>Resolution</dt>
            <dd>
              {calc.resW}×{calc.resH}
            </dd>
          </div>
          <div>
            <dt>Total pixels</dt>
            <dd>{(calc.totalPixels / 1e6).toFixed(2)} MP</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{calc.totalWeight.toFixed(0)} kg</dd>
          </div>
          <div>
            <dt>Power</dt>
            <dd>{(calc.totalWatts / 1000).toFixed(1)} kW</dd>
          </div>
        </div>
      </PrintSheet>

      {/* LEFT — Walls + Panel library + Rigging */}
      <div className="left-pane">
        <div className="pane-hd">
          <span>WALLS</span>
          <span className="spacer" />
          <button
            className="icon-btn"
            aria-label="New wall"
            onClick={() => addWall()}
          >
            <I.Plus size={12} />
          </button>
        </div>
        <div style={{ flex: "0 0 auto" }}>
          {walls.map((l) => (
            <div
              key={l.id}
              className="list-row"
              data-active={l.id === layoutId ? "1" : "0"}
              onClick={() => setLayoutId(l.id)}
            >
              <I.Wall size={13} />
              <span className="lbl">{l.name}</span>
              <span className="meta">
                {l.cols}×{l.rows}
              </span>
              {walls.length > 1 && (
                <button
                  className="icon-btn"
                  aria-label={`Delete ${l.name}`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (await confirmDialog(`Delete wall "${l.name}"?`, { danger: true, confirmLabel: "Delete" }))
                      removeWall(l.id);
                  }}
                  style={{ marginLeft: 4 }}
                >
                  <I.Cross size={11} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pane-hd">
          <span>PANEL LIBRARY</span>
          <span className="spacer" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            {filteredPanels.length}/{PANEL_LIBRARY.length}
          </span>
          <button className="icon-btn" title="Add panel" onClick={addPanel}>
            <I.Plus size={12} />
          </button>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input
            placeholder="Filter by pitch, model…"
            value={panelSearch}
            onChange={(e) => setPanelSearch(e.target.value)}
          />
        </div>
        <div className="pane-body">
          {filteredPanels.map((p) => {
            const isCustom = customPanels.some((d) => d.id === p.id);
            return (
              <div
                key={p.id}
                className="list-row"
                data-active={panel.id === p.id ? "1" : "0"}
                onClick={() => updateWall(layout.id, { panel: p.id })}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: "var(--accent)",
                    opacity: panel.id === p.id ? 1 : 0.3,
                  }}
                />
                <span className="lbl mono" style={{ fontSize: 11 }}>
                  {p.model}
                </span>
                <span className="meta">P{p.pitch}</span>
                {isCustom && canDeleteShared(catalogOwners[p.id], myId) && (
                  <button
                    className="icon-btn"
                    title="Remove custom panel"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePanel(p.id, p.model);
                    }}
                  >
                    <I.Cross size={11} />
                  </button>
                )}
              </div>
            );
          })}

          <div className="section-h">
            <span>RIGGING</span>
            <span className="line" />
          </div>
          <div className="kv">
            <span className="k">Total weight</span>
            <span className="v">{calc.totalWeight.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* CENTER — Canvas */}
      <div className="center-pane">
        <div className="canvas-toolbar">
          <div className="tg">
            <button data-active={tool === "select" ? "1" : "0"} onClick={() => setTool("select")}>
              SELECT
            </button>
            <button data-active={tool === "draw" ? "1" : "0"} onClick={() => setTool("draw")}>
              DRAW
            </button>
            <button data-active={tool === "erase" ? "1" : "0"} onClick={() => setTool("erase")}>
              ERASE
            </button>
            <button data-active={tool === "measure" ? "1" : "0"} onClick={() => setTool("measure")}>
              MEASURE
            </button>
          </div>
          <div className="divider-v" />
          <button className="tb-btn" onClick={() => window.print()}>
            <I.Docs size={13} /> Print
          </button>
          <div className="divider-v" />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={showDims}
              onChange={(e) => setShowDims(e.target.checked)}
            />
            <span className="box" />
            DIMENSIONS
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={showFaults}
              onChange={(e) => setShowFaults(e.target.checked)}
            />
            <span className="box" />
            FAULT MAP
          </label>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            ZOOM
          </span>
          <input
            type="range"
            min={40}
            max={160}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: 80 }}
          />
          <span className="mono" style={{ fontSize: 11, width: 36 }}>
            {zoom}%
          </span>
        </div>

        <div className="led-canvas" data-canvas-style={canvasStyle}>
          <div className="canvas-overlay tl">
            <div className="row">
              <span className="k">WALL</span>
              <span className="v">{layout.name}</span>
            </div>
            <div className="row">
              <span className="k">PANEL</span>
              <span className="v">{panel.model}</span>
            </div>
            <div className="row">
              <span className="k">PITCH</span>
              <span className="v">{panel.pitch}mm</span>
            </div>
          </div>
          <div className="canvas-overlay tr">
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <span className="k">REV</span>
              <span className="v">{String(latestRev?.n ?? 0).padStart(4, "0")}</span>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <span className="k">SCALE</span>
              <span className="v">1:{(Math.round((1 / scale) * 100) / 100).toFixed(2)}</span>
            </div>
          </div>
          <div className="canvas-stage">
            <div
              style={{
                position: "relative",
                paddingTop: showDims ? 30 : 0,
                paddingLeft: showDims ? 50 : 0,
              }}
            >
              <div
                className="led-wall-frame"
                style={{ width: frameW, height: frameH, cursor: cursorByTool[tool] }}
              >
                {showDims && (
                  <>
                    <div className="dim-arrow h">
                      {calc.wallWmm}mm · {calc.wallWft.toFixed(1)}ft
                    </div>
                    <div className="dim-arrow v">
                      {calc.wallHmm}mm · {calc.wallHft.toFixed(1)}ft
                    </div>
                  </>
                )}
                {Array.from({ length: layout.rows }).map((_, r) =>
                  Array.from({ length: layout.cols }).map((_, c) => {
                    const fault =
                      showFaults && FAULT_PANELS.some((f) => f.c === c && f.r === r);
                    const sel = selected && selected.c === c && selected.r === r;
                    const isMeasureFrom =
                      measureFrom && measureFrom.c === c && measureFrom.r === r;
                    const isMeasureTo =
                      measureTo && measureTo.c === c && measureTo.r === r;
                    const eraseTarget =
                      tool === "erase" &&
                      ((c === layout.cols - 1 && layout.cols > 1) ||
                        (r === layout.rows - 1 && layout.rows > 1));
                    let cellCursor: string | undefined;
                    if (tool === "erase") cellCursor = eraseTarget ? "pointer" : "not-allowed";
                    return (
                      <div
                        key={`${c}-${r}`}
                        className="led-panel"
                        data-fault={fault ? "1" : "0"}
                        data-selected={sel ? "1" : "0"}
                        data-measure={isMeasureFrom ? "from" : isMeasureTo ? "to" : undefined}
                        data-erase-target={tool === "erase" && eraseTarget ? "1" : undefined}
                        style={{
                          left: c * panelPxW,
                          top: r * panelPxH,
                          width: panelPxW,
                          height: panelPxH,
                          cursor: cellCursor,
                        }}
                        onClick={() => handleCellClick({ c, r })}
                      >
                        {panelPxW > 28 && `${c + 1},${r + 1}`}
                      </div>
                    );
                  })
                )}
                {/* Draw mode: clickable grow zones outside the wall */}
                {tool === "draw" && (
                  <>
                    <div
                      className="draw-zone right"
                      style={{
                        left: frameW + 4,
                        top: 0,
                        width: drawZoneSize,
                        height: frameH,
                      }}
                      onClick={() => addCol()}
                      title="Add column"
                    >
                      <span>+ COL</span>
                    </div>
                    <div
                      className="draw-zone bottom"
                      style={{
                        left: 0,
                        top: frameH + 4,
                        width: frameW,
                        height: drawZoneSize,
                      }}
                      onClick={() => addRow()}
                      title="Add row"
                    >
                      <span>+ ROW</span>
                    </div>
                  </>
                )}
                {/* Measure connecting line */}
                {measureFrom && measureTo && (
                  <svg
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      overflow: "visible",
                    }}
                  >
                    <line
                      x1={(measureFrom.c + 0.5) * panelPxW}
                      y1={(measureFrom.r + 0.5) * panelPxH}
                      x2={(measureTo.c + 0.5) * panelPxW}
                      y2={(measureTo.r + 0.5) * panelPxH}
                      stroke="var(--color-info)"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  </svg>
                )}
                {/* Processor split overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: frameW / 2 - 0.5,
                    width: 1,
                    background: "var(--accent)",
                    opacity: 0.4,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="crosshair-readout">
            {tool === "measure" ? (
              measureDistMm != null && measureFrom && measureTo ? (
                <>
                  MEASURE · ({measureFrom.c + 1},{measureFrom.r + 1}) → ({measureTo.c + 1},
                  {measureTo.r + 1}) · {measureDistMm.toFixed(0)}mm ·{" "}
                  {(measureDistMm / 304.8).toFixed(2)}ft · ESC to clear
                </>
              ) : measureFrom ? (
                <>
                  MEASURE · from ({measureFrom.c + 1},{measureFrom.r + 1}) — click second panel
                </>
              ) : (
                <>MEASURE · click first panel</>
              )
            ) : tool === "draw" ? (
              <>DRAW · click + COL or + ROW to grow the wall</>
            ) : tool === "erase" ? (
              <>ERASE · click last column or last row to remove</>
            ) : (
              <>
                X: {selected ? selected.c * panel.w : 0}mm · Y:{" "}
                {selected ? selected.r * panel.h : 0}mm · GRID {panel.w}×{panel.h}
              </>
            )}
          </div>
        </div>

        {/* Bottom meter row */}
        <div className="canvas-meter">
          <div className="meter-block">
            <div className="h">PROC #1</div>
            <div className="v accent">
              {Math.min(100, calc.proc1Pct)}
              <span style={{ fontSize: 10, color: "var(--color-fg-faint)", marginLeft: 4 }}>%</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${Math.min(100, calc.proc1Pct)}%` }} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
              {Math.min(calc.totalPixels, calc.procCapacity).toLocaleString()} px
            </div>
          </div>
          <div className="meter-block">
            <div className="h">PROC #2</div>
            <div className="v accent">
              {Math.min(100, calc.proc2Pct)}
              <span style={{ fontSize: 10, color: "var(--color-fg-faint)", marginLeft: 4 }}>%</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${Math.min(100, calc.proc2Pct)}%` }} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
              {Math.max(0, calc.totalPixels - calc.procCapacity).toLocaleString()} px
            </div>
          </div>
          <div className="meter-block">
            <div className="h">POWER</div>
            <div className="v warn">
              {(calc.totalWatts / 1000).toFixed(1)}
              <span style={{ fontSize: 10, color: "var(--color-fg-faint)", marginLeft: 4 }}>kW</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
              {calc.circuitsNeeded} × 20A circuits
            </div>
          </div>
          <div className="meter-block">
            <div className="h">DATA RATE · UNCOMP 4:4:4</div>
            <div className="v">
              {dataRateGbps.toFixed(1)}
              <span style={{ fontSize: 10, color: "var(--color-fg-faint)", marginLeft: 4 }}>
                Gbps
              </span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
              60p · 10-bit · 4:4:4
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Inspector */}
      <div className="right-pane">
        <div className="inspector-tabs">
          <button data-active={tab === "wall" ? "1" : "0"} onClick={() => setTab("wall")}>
            Wall
          </button>
          <button data-active={tab === "panel" ? "1" : "0"} onClick={() => setTab("panel")}>
            Panel
          </button>
          <button data-active={tab === "calc" ? "1" : "0"} onClick={() => setTab("calc")}>
            Calc
          </button>
        </div>

        {tab === "wall" && (
          <div className="pane-body">
            <div className="readout-grid">
              <div className="readout accent">
                <div className="lbl">Resolution</div>
                <div className="val">
                  {calc.resW.toLocaleString()}
                  <span className="unit">×{calc.resH}</span>
                </div>
              </div>
              <div className="readout">
                <div className="lbl">Aspect</div>
                <div className="val">
                  {calc.aspectRatio.toFixed(2)}
                  <span className="unit">:1</span>
                </div>
              </div>
            </div>
            <div className="section-h">
              <span>IDENTITY</span>
              <span className="line" />
            </div>
            <div className="fld">
              <span className="k">Name</span>
              <input
                value={layout.name}
                onChange={(e) =>
                  updateWall(layout.id, { name: e.target.value })
                }
              />
            </div>
            <div className="section-h">
              <span>GEOMETRY</span>
              <span className="line" />
            </div>
            <div className="fld">
              <span className="k">Columns</span>
              <input
                value={layout.cols}
                type="number"
                min={1}
                onChange={(e) => {
                  const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                  updateWall(layout.id, { cols: n });
                }}
              />
            </div>
            <div className="fld">
              <span className="k">Rows</span>
              <input
                value={layout.rows}
                type="number"
                min={1}
                onChange={(e) => {
                  const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                  updateWall(layout.id, { rows: n });
                }}
              />
            </div>
            <div className="fld">
              <span className="k">Curve °</span>
              <input
                value={layout.curve}
                type="number"
                min={-30}
                max={30}
                onChange={(e) => {
                  const n = Math.max(-30, Math.min(30, Number(e.target.value) || 0));
                  updateWall(layout.id, { curve: n });
                }}
              />
            </div>
            <div className="fld">
              <span className="k">Pitch</span>
              <select
                value={panel.id}
                onChange={(e) => updateWall(layout.id, { panel: e.target.value })}
              >
                {PANEL_LIBRARY.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.model} (P{p.pitch})
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <span className="k">Processor</span>
              <select
                value={layout.processor}
                onChange={(e) => updateWall(layout.id, { processor: e.target.value })}
              >
                {LED_PROCESSORS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <span className="k">Dimensions</span>
              <div className="row-pair">
                <span className="unit-input" data-unit="mm">
                  <input value={calc.wallWmm} readOnly />
                </span>
                <span className="unit-input" data-unit="mm">
                  <input value={calc.wallHmm} readOnly />
                </span>
              </div>
            </div>

            <div className="section-h">
              <span>PHYSICAL</span>
              <span className="line" />
            </div>
            <div className="kv">
              <span className="k">Panels</span>
              <span className="v">{calc.totalPanels}</span>
              <span className="k">Weight</span>
              <span className="v">{calc.totalWeight.toFixed(1)} kg</span>
              <span className="k">Power draw</span>
              <span className="v" style={{ color: "var(--color-warn)" }}>
                {(calc.totalWatts / 1000).toFixed(2)} kW
              </span>
              <span className="k">Heat output</span>
              <span className="v">{calc.btuPerHr} BTU/h</span>
              <span className="k">Circuits</span>
              <span className="v">{calc.circuitsNeeded} × 20A</span>
            </div>

            <div className="section-h">
              <span>SIGNAL CHAIN</span>
              <span className="line" />
            </div>
            <div className="kv">
              <span className="k">Processor</span>
              <span className="v">{calc.procName}</span>
              <span className="k">Units needed</span>
              <span className="v">{calc.procsNeeded}</span>
              <span className="k">Capacity</span>
              <span className="v">{(calc.procCapacity / 1e6).toFixed(1)} MP each</span>
            </div>
          </div>
        )}

        {tab === "panel" && selected && (
          <div className="pane-body">
            <div className="section-h">
              <span>
                PANEL [{selected.c + 1}, {selected.r + 1}]
              </span>
              <span className="line" />
            </div>
            <div className="kv">
              <span className="k">Position</span>
              <span className="v">
                {selected.c * panel.w} × {selected.r * panel.h}mm
              </span>
            </div>
          </div>
        )}
        {tab === "panel" && !selected && (
          <div className="empty">
            <I.Grid size={28} />
            <span className="mono" style={{ fontSize: 11, color: "var(--color-fg-faint)" }}>
              SELECT A PANEL
            </span>
          </div>
        )}

        {tab === "calc" && (
          <div className="pane-body">
            <div className="section-h">
              <span>VALIDATION</span>
              <span className="line" />
            </div>
            {issues.length === 0 ? (
              <div className="issue-row" data-level="ok">
                <span className="dot ok" />
                <div>
                  <div className="title mono">All checks passing</div>
                  <div className="detail">No errors or warnings on this wall.</div>
                </div>
              </div>
            ) : (
              issues.map((iss) => (
                <div key={iss.id} className="issue-row" data-level={iss.level}>
                  <span className={`dot ${iss.level}`} />
                  <div>
                    <div className="title mono">{iss.title}</div>
                    <div className="detail">{iss.detail}</div>
                  </div>
                </div>
              ))
            )}
            <div className="section-h">
              <span>CALCULATIONS</span>
              <span className="line" />
            </div>
            <div className="readout">
              <div className="lbl">Total pixels</div>
              <div className="val">
                {(calc.totalPixels / 1e6).toFixed(2)}
                <span className="unit">MP</span>
              </div>
            </div>
            <div className="readout">
              <div className="lbl">Viewing distance (min)</div>
              <div className="val">
                {panel.pitch.toFixed(1)}
                <span className="unit">m</span>
              </div>
            </div>
            <div className="readout">
              <div className="lbl">Bandwidth · 60p / 10-bit / 4:2:2</div>
              <div className="val">
                {((calc.resW * calc.resH * 60 * 20) / 1e9).toFixed(2)}
                <span className="unit">Gbps</span>
              </div>
            </div>
            <div className="readout warn">
              <div className="lbl">Peak current draw</div>
              <div className="val">
                {(calc.totalWatts / 240).toFixed(1)}
                <span className="unit">A @ 240V</span>
              </div>
            </div>
            <div className="section-h">
              <span>RIGGING LOAD</span>
              <span className="line" />
            </div>
            <div className="kv">
              <span className="k">Live load</span>
              <span className="v">{calc.totalWeight.toFixed(1)} kg</span>
              <span className="k">+ headers/cable</span>
              <span className="v">+{(calc.totalWeight * 0.15).toFixed(1)} kg</span>
              <span className="k">Total</span>
              <span className="v" style={{ color: "var(--accent)" }}>
                {(calc.totalWeight * 1.15).toFixed(1)} kg
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
