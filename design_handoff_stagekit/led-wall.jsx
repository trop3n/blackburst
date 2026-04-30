// led-wall.jsx — LED Wall Builder module

const { I, DATA } = window;

function LedWallModule({ canvasStyle }) {
  const [layoutId, setLayoutId] = React.useState("W1");
  const [selected, setSelected] = React.useState(null);
  const [tool, setTool] = React.useState("select");
  const [zoom, setZoom] = React.useState(100);
  const [showDims, setShowDims] = React.useState(true);
  const [showFaults, setShowFaults] = React.useState(true);
  const [tab, setTab] = React.useState("wall");

  const layout = DATA.WALL_LAYOUTS.find((l) => l.id === layoutId);
  const panel = DATA.PANEL_LIBRARY.find((p) => p.id === layout.panel);

  // Calculations
  const totalPanels = layout.cols * layout.rows;
  const totalWeight = (totalPanels * panel.weight).toFixed(1);
  const totalWatts = (totalPanels * panel.watts);
  const wallWmm = layout.cols * panel.w;
  const wallHmm = layout.rows * panel.h;
  const wallWft = (wallWmm / 304.8).toFixed(1);
  const wallHft = (wallHmm / 304.8).toFixed(1);
  const resW = Math.round(wallWmm / panel.pitch);
  const resH = Math.round(wallHmm / panel.pitch);
  const aspectRatio = (resW / resH).toFixed(2);
  const procCapacity = 8800000;
  const totalPixels = resW * resH;
  const procsNeeded = Math.max(1, Math.ceil(totalPixels / procCapacity));
  const proc1Pct = Math.round((Math.min(procCapacity, totalPixels) / procCapacity) * 100);
  const proc2Pct = Math.round((Math.max(0, totalPixels - procCapacity) / procCapacity) * 100);
  const circuitsNeeded = Math.ceil(totalWatts / 2400);

  // Render scale: fit wall into ~520×360 frame
  const maxFrameW = 520, maxFrameH = 320;
  const aspectFit = Math.min(maxFrameW / wallWmm, maxFrameH / wallHmm);
  const scale = aspectFit * (zoom / 100);
  const frameW = wallWmm * scale;
  const frameH = wallHmm * scale;
  const panelPxW = panel.w * scale;
  const panelPxH = panel.h * scale;

  return (
    <>
      {/* LEFT — Wall list + Panel library */}
      <div className="left-pane">
        <div className="pane-hd">
          <span>WALLS</span>
          <span className="spacer" />
          <button className="icon-btn"><I.Plus size={12} /></button>
        </div>
        <div style={{ flex: "0 0 auto" }}>
          {DATA.WALL_LAYOUTS.map((l) => (
            <div key={l.id} className="list-row"
                 data-active={l.id === layoutId ? "1" : "0"}
                 onClick={() => { setLayoutId(l.id); setSelected(null); }}>
              <I.Wall size={13} />
              <span className="lbl">{l.name}</span>
              <span className="meta">{l.cols}×{l.rows}</span>
            </div>
          ))}
        </div>

        <div className="pane-hd">
          <span>PANEL LIBRARY</span>
          <span className="spacer" />
          <span className="mono faint" style={{ fontSize: 10 }}>{DATA.PANEL_LIBRARY.length}</span>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input placeholder="Filter by pitch, model…" />
        </div>
        <div className="pane-body">
          {DATA.PANEL_LIBRARY.map((p) => (
            <div key={p.id} className="list-row" data-active={panel.id === p.id ? "1" : "0"}>
              <span style={{ width: 8, height: 8, background: "var(--accent)", opacity: panel.id === p.id ? 1 : 0.3 }} />
              <span className="lbl mono" style={{ fontSize: 11 }}>{p.model}</span>
              <span className="meta">P{p.pitch}</span>
            </div>
          ))}

          <div className="section-h"><span>RIGGING</span><span className="line" /></div>
          <div className="kv">
            <span className="k">Total weight</span><span className="v">{totalWeight} kg</span>
            <span className="k">Per truss point</span><span className="v">{(totalWeight / 6).toFixed(1)} kg</span>
            <span className="k">Truss SWL</span><span className="v">600 kg/pt</span>
            <span className="k">Safety margin</span><span className="v" style={{ color: "var(--accent)" }}>4.6×</span>
          </div>
        </div>
      </div>

      {/* CENTER — Canvas */}
      <div className="center-pane">
        <div className="canvas-toolbar">
          <div className="tg">
            <button data-active={tool === "select" ? "1" : "0"} onClick={() => setTool("select")}>SELECT</button>
            <button data-active={tool === "draw" ? "1" : "0"} onClick={() => setTool("draw")}>DRAW</button>
            <button data-active={tool === "erase" ? "1" : "0"} onClick={() => setTool("erase")}>ERASE</button>
            <button data-active={tool === "measure" ? "1" : "0"} onClick={() => setTool("measure")}>MEASURE</button>
          </div>
          <div className="divider-v" />
          <button className="tb-btn"><I.Grid size={13} /> Snap 1px</button>
          <button className="tb-btn">Curve <span className="mono accent" style={{ marginLeft: 4 }}>{layout.curve}°</span></button>
          <div className="divider-v" />
          <label className="checkbox">
            <input type="checkbox" checked={showDims} onChange={(e) => setShowDims(e.target.checked)} />
            <span className="box" />DIMENSIONS
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={showFaults} onChange={(e) => setShowFaults(e.target.checked)} />
            <span className="box" />FAULT MAP
          </label>
          <span style={{ flex: 1 }} />
          <span className="mono faint" style={{ fontSize: 10 }}>ZOOM</span>
          <input type="range" min="40" max="160" value={zoom}
                 onChange={(e) => setZoom(Number(e.target.value))}
                 style={{ width: 80 }} />
          <span className="mono" style={{ fontSize: 11, width: 36 }}>{zoom}%</span>
        </div>

        <div className="led-canvas" data-canvas-style={canvasStyle}>
          <div className="canvas-overlay tl">
            <div className="row"><span className="k">WALL</span><span className="v">{layout.name}</span></div>
            <div className="row"><span className="k">PANEL</span><span className="v">{panel.model}</span></div>
            <div className="row"><span className="k">PITCH</span><span className="v">{panel.pitch}mm</span></div>
          </div>
          <div className="canvas-overlay tr">
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <span className="k">REV</span><span className="v">0042</span>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <span className="k">SCALE</span><span className="v">1:{Math.round(1 / scale * 100) / 100}</span>
            </div>
          </div>
          <div className="canvas-stage">
            <div style={{ position: "relative", paddingTop: showDims ? 30 : 0, paddingLeft: showDims ? 50 : 0 }}>
              {showDims && (
                <>
                  <div className="dim-arrow h" style={{ width: frameW }}>
                    {wallWmm}mm · {wallWft}ft
                  </div>
                  <div className="dim-arrow v" style={{ height: frameH }}>
                    {wallHmm}mm · {wallHft}ft
                  </div>
                </>
              )}
              <div className="led-wall-frame" style={{ width: frameW, height: frameH }}>
                {Array.from({ length: layout.rows }).map((_, r) =>
                  Array.from({ length: layout.cols }).map((_, c) => {
                    const fault = showFaults && DATA.FAULT_PANELS.some((f) => f.c === c && f.r === r);
                    const sel = selected && selected.c === c && selected.r === r;
                    return (
                      <div key={`${c}-${r}`} className="led-panel"
                           data-fault={fault ? "1" : "0"}
                           data-selected={sel ? "1" : "0"}
                           style={{
                             left: c * panelPxW,
                             top: r * panelPxH,
                             width: panelPxW,
                             height: panelPxH,
                           }}
                           onClick={() => setSelected({ c, r })}>
                        {panelPxW > 28 && `${c+1},${r+1}`}
                      </div>
                    );
                  })
                )}
                {/* processor split overlay (left/right halves to procs) */}
                <div style={{
                  position: "absolute",
                  top: 0, bottom: 0,
                  left: frameW / 2 - 0.5,
                  width: 1,
                  background: "var(--accent)",
                  opacity: 0.4,
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute",
                  top: -10, left: frameW / 4 - 12,
                  fontFamily: "var(--mono)", fontSize: 9, color: "var(--accent)",
                }}>SX40 #1</div>
                <div style={{
                  position: "absolute",
                  top: -10, left: 3 * frameW / 4 - 12,
                  fontFamily: "var(--mono)", fontSize: 9, color: "var(--accent)",
                }}>SX40 #2</div>
              </div>
            </div>
          </div>

          <div className="crosshair-readout">
            X: {selected ? selected.c * panel.w : 0}mm · Y: {selected ? selected.r * panel.h : 0}mm · GRID {panel.w}×{panel.h}
          </div>
        </div>

        {/* Bottom meter row — processor + power */}
        <div className="canvas-meter">
          <div className="meter-block">
            <div className="h">PROC #1 · SX40 <span className="chip accent">10GbE A</span></div>
            <div className="v accent">{Math.min(100, proc1Pct)}<span style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>%</span></div>
            <div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, proc1Pct)}%` }} /></div>
            <div className="mono faint" style={{ fontSize: 10 }}>{Math.min(totalPixels, procCapacity).toLocaleString()} px</div>
          </div>
          <div className="meter-block">
            <div className="h">PROC #2 · SX40 <span className="chip accent">10GbE B</span></div>
            <div className="v accent">{Math.min(100, proc2Pct)}<span style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>%</span></div>
            <div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, proc2Pct)}%` }} /></div>
            <div className="mono faint" style={{ fontSize: 10 }}>{Math.max(0, totalPixels - procCapacity).toLocaleString()} px</div>
          </div>
          <div className="meter-block">
            <div className="h">POWER · 200A 3ϕ DISTRO</div>
            <div className="v warn">{(totalWatts / 1000).toFixed(1)}<span style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>kW</span></div>
            <div className="bar-stack">
              <div className="bar-seg" style={{ width: `${(totalWatts/144000)*100}%`, background: "var(--accent)" }} />
              <div className="bar-seg" style={{ width: `${100-(totalWatts/144000)*100}%`, background: "var(--bg-3)" }} />
            </div>
            <div className="mono faint" style={{ fontSize: 10 }}>{circuitsNeeded} × 20A circuits · 144kVA cap</div>
          </div>
          <div className="meter-block">
            <div className="h">DATA RATE · UNCOMP 4:4:4</div>
            <div className="v">{((resW * resH * 60 * 30) / 1e9).toFixed(1)}<span style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>Gbps</span></div>
            <div className="bar"><div className="bar-fill" style={{ width: `66%` }} /></div>
            <div className="mono faint" style={{ fontSize: 10 }}>10GbE × 2 · headroom 38%</div>
          </div>
        </div>
      </div>

      {/* RIGHT — Inspector */}
      <div className="right-pane">
        <div className="inspector-tabs">
          <button data-active={tab === "wall" ? "1" : "0"} onClick={() => setTab("wall")}>Wall</button>
          <button data-active={tab === "panel" ? "1" : "0"} onClick={() => setTab("panel")}>Panel</button>
          <button data-active={tab === "calc" ? "1" : "0"} onClick={() => setTab("calc")}>Calc</button>
        </div>

        {tab === "wall" && (
          <div className="pane-body">
            <div className="readout-grid">
              <div className="readout accent">
                <div className="lbl">Resolution</div>
                <div className="val">{resW.toLocaleString()}<span className="unit">×{resH}</span></div>
              </div>
              <div className="readout">
                <div className="lbl">Aspect</div>
                <div className="val">{aspectRatio}<span className="unit">:1</span></div>
              </div>
            </div>
            <div className="section-h"><span>GEOMETRY</span><span className="line" /></div>
            <div className="fld"><span className="k">Columns</span>
              <input defaultValue={layout.cols} type="number" /></div>
            <div className="fld"><span className="k">Rows</span>
              <input defaultValue={layout.rows} type="number" /></div>
            <div className="fld"><span className="k">Curve °</span>
              <input defaultValue={layout.curve} type="number" /></div>
            <div className="fld"><span className="k">Pitch</span>
              <select defaultValue={panel.id}>
                {DATA.PANEL_LIBRARY.map((p) => <option key={p.id} value={p.id}>{p.model} (P{p.pitch})</option>)}
              </select>
            </div>
            <div className="fld"><span className="k">Dimensions</span>
              <div className="row-pair">
                <span className="unit-input" data-unit="mm"><input value={wallWmm} readOnly /></span>
                <span className="unit-input" data-unit="mm"><input value={wallHmm} readOnly /></span>
              </div>
            </div>

            <div className="section-h"><span>PHYSICAL</span><span className="line" /></div>
            <div className="kv">
              <span className="k">Panels</span><span className="v">{totalPanels}</span>
              <span className="k">Weight</span><span className="v">{totalWeight} kg</span>
              <span className="k">Power draw</span><span className="v" style={{ color: "var(--warn)" }}>{(totalWatts/1000).toFixed(2)} kW</span>
              <span className="k">Heat output</span><span className="v">{Math.round(totalWatts * 3.412)} BTU/h</span>
              <span className="k">Circuits</span><span className="v">{circuitsNeeded} × 20A</span>
            </div>

            <div className="section-h"><span>SIGNAL CHAIN</span><span className="line" /></div>
            <div className="kv">
              <span className="k">Processors</span><span className="v">{procsNeeded} × SX40</span>
              <span className="k">Cabling</span><span className="v">CAT6A · {procsNeeded * 4} runs</span>
              <span className="k">Refresh</span><span className="v">3840 Hz</span>
              <span className="k">Bit depth</span><span className="v">12-bit</span>
            </div>
          </div>
        )}

        {tab === "panel" && selected && (
          <div className="pane-body">
            <div className="section-h"><span>PANEL [{selected.c+1}, {selected.r+1}]</span><span className="line" /></div>
            <div className="kv">
              <span className="k">Position</span><span className="v">{selected.c * panel.w} × {selected.r * panel.h}mm</span>
              <span className="k">Serial</span><span className="v">RB-{(selected.r * layout.cols + selected.c + 100001)}</span>
              <span className="k">Cabinet</span><span className="v">A{Math.floor((selected.r * layout.cols + selected.c)/12)+1}</span>
              <span className="k">Proc port</span><span className="v">SX40 #{selected.c < layout.cols/2 ? 1 : 2} · ETH 1</span>
              <span className="k">Status</span><span className="v" style={{ color: "var(--accent)" }}>● ONLINE</span>
              <span className="k">Brightness</span><span className="v">88%</span>
              <span className="k">Temp</span><span className="v">42°C</span>
              <span className="k">Hours</span><span className="v">2,184</span>
            </div>
          </div>
        )}
        {tab === "panel" && !selected && (
          <div className="empty">
            <I.Grid size={28} />
            <span className="mono faint" style={{ fontSize: 11 }}>SELECT A PANEL</span>
          </div>
        )}

        {tab === "calc" && (
          <div className="pane-body">
            <div className="section-h"><span>CALCULATIONS</span><span className="line" /></div>
            <div className="readout">
              <div className="lbl">Total pixels</div>
              <div className="val">{(totalPixels / 1e6).toFixed(2)}<span className="unit">MP</span></div>
            </div>
            <div className="readout">
              <div className="lbl">Viewing distance (min)</div>
              <div className="val">{(panel.pitch * 1).toFixed(1)}<span className="unit">m</span></div>
            </div>
            <div className="readout">
              <div className="lbl">Bandwidth · 60p / 10-bit / 4:2:2</div>
              <div className="val">{((resW * resH * 60 * 20) / 1e9).toFixed(2)}<span className="unit">Gbps</span></div>
            </div>
            <div className="readout warn">
              <div className="lbl">Peak current draw</div>
              <div className="val">{(totalWatts / 240).toFixed(1)}<span className="unit">A @ 240V</span></div>
            </div>
            <div className="section-h"><span>RIGGING LOAD</span><span className="line" /></div>
            <div className="kv">
              <span className="k">Live load</span><span className="v">{totalWeight} kg</span>
              <span className="k">+ headers/cable</span><span className="v">+{(totalWeight*0.15).toFixed(1)} kg</span>
              <span className="k">Total</span><span className="v" style={{ color: "var(--accent)" }}>{(totalWeight*1.15).toFixed(1)} kg</span>
              <span className="k">Pickup pts</span><span className="v">6</span>
              <span className="k">Per pt</span><span className="v">{(totalWeight*1.15/6).toFixed(1)} kg</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

window.LedWallModule = LedWallModule;
