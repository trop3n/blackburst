// rack-builder.jsx — Server Rack Builder module

const { I } = window;

const RACK_CATALOG = [
  // Processors / Switchers
  { id: "sx40",   model: "Brompton SX40",            cat: "Processor", u: 1, w: 8.6,  watts: 350, depth: 432, color: "accent" },
  { id: "tess",   model: "Brompton Tessera S8",      cat: "Processor", u: 1, w: 7.2,  watts: 280, depth: 432, color: "accent" },
  { id: "mx40",   model: "Novastar MX40 Pro",        cat: "Processor", u: 2, w: 12.4, watts: 420, depth: 480, color: "accent" },
  { id: "helios", model: "Megapixel Helios",         cat: "Processor", u: 2, w: 14.0, watts: 480, depth: 530, color: "accent" },
  { id: "vmix",   model: "vMix M4 Switcher",         cat: "Switcher",  u: 1, w: 6.4,  watts: 220, depth: 380, color: "magenta" },
  { id: "atem",   model: "BMD ATEM 4 M/E",           cat: "Switcher",  u: 4, w: 14.0, watts: 250, depth: 410, color: "magenta" },
  { id: "smtl",   model: "AJA Kumo 3232 SDI Router", cat: "Switcher",  u: 2, w: 8.5,  watts: 180, depth: 410, color: "magenta" },
  // Network
  { id: "net48",  model: "Cisco Cat 9300 · 48-port", cat: "Network",   u: 1, w: 6.8,  watts: 160, depth: 460, color: "info" },
  { id: "net10g", model: "Arista 7050X · 32×100GbE", cat: "Network",   u: 1, w: 9.4,  watts: 240, depth: 510, color: "info" },
  { id: "fw",     model: "Palo Alto PA-440",          cat: "Network",   u: 1, w: 4.5,  watts: 80,  depth: 360, color: "info" },
  // Servers / Compute
  { id: "srv1u",  model: "Dell R660 1U Server",       cat: "Compute",   u: 1, w: 16.5, watts: 600, depth: 720, color: "accent" },
  { id: "srv2u",  model: "HPE DL380 Gen11 2U",        cat: "Compute",   u: 2, w: 24.0, watts: 800, depth: 750, color: "accent" },
  { id: "media",  model: "Disguise gx 2c · 4U",       cat: "Compute",   u: 4, w: 36.0, watts: 1200, depth: 720, color: "accent" },
  // Audio
  { id: "sd12",   model: "DiGiCo SD-Rack",            cat: "Audio",     u: 6, w: 22.0, watts: 240, depth: 440, color: "info" },
  { id: "la12x",  model: "L-Acoustics LA12X",         cat: "Audio",     u: 2, w: 14.5, watts: 1500, depth: 480, color: "info" },
  { id: "mics",   model: "Shure ULXD4Q · 4ch",        cat: "Audio",     u: 1, w: 4.2,  watts: 60,  depth: 360, color: "info" },
  // Power
  { id: "pdu",    model: "APC AP8865 PDU · 30A",      cat: "Power",     u: 1, w: 5.0,  watts: 0,   depth: 110, color: "warn" },
  { id: "ups",    model: "Eaton 9PX 3000VA",          cat: "Power",     u: 2, w: 24.0, watts: 60,  depth: 540, color: "warn" },
  { id: "iso",    model: "Furman P-2400 IT Iso",      cat: "Power",     u: 2, w: 18.0, watts: 30,  depth: 280, color: "warn" },
  // Misc
  { id: "kvm",    model: "1U KVM Drawer · 17in",      cat: "Misc",      u: 1, w: 11.0, watts: 40,  depth: 590, color: "muted" },
  { id: "blank1", model: "Blank Panel · 1U",          cat: "Misc",      u: 1, w: 0.5,  watts: 0,   depth: 0,   color: "muted" },
  { id: "vent",   model: "Vented Panel · 2U",         cat: "Misc",      u: 2, w: 0.6,  watts: 0,   depth: 0,   color: "muted" },
];

const DEFAULT_RACK = [
  { iid: 1, id: "blank1", pos: 41 },
  { iid: 2, id: "kvm",    pos: 39 },
  { iid: 3, id: "vmix",   pos: 37 },
  { iid: 4, id: "atem",   pos: 33 },
  { iid: 5, id: "sx40",   pos: 31 },
  { iid: 6, id: "sx40",   pos: 30 },
  { iid: 7, id: "tess",   pos: 28 },
  { iid: 8, id: "smtl",   pos: 26 },
  { iid: 9, id: "net10g", pos: 24 },
  { iid:10, id: "net48",  pos: 22 },
  { iid:11, id: "fw",     pos: 21 },
  { iid:12, id: "srv2u",  pos: 18 },
  { iid:13, id: "media",  pos: 13 },
  { iid:14, id: "sd12",   pos: 7 },
  { iid:15, id: "ups",    pos: 4 },
  { iid:16, id: "pdu",    pos: 1 },
];

const COLOR_MAP = {
  accent:  { bg: "oklch(0.86 0.19 145 / 0.10)", bd: "oklch(0.86 0.19 145 / 0.45)", fg: "var(--accent)" },
  magenta: { bg: "oklch(0.78 0.22 330 / 0.10)", bd: "oklch(0.78 0.22 330 / 0.45)", fg: "var(--magenta)" },
  info:    { bg: "oklch(0.78 0.13 230 / 0.10)", bd: "oklch(0.78 0.13 230 / 0.45)", fg: "var(--info)" },
  warn:    { bg: "oklch(0.78 0.16 75 / 0.10)",  bd: "oklch(0.78 0.16 75 / 0.45)",  fg: "var(--warn)" },
  muted:   { bg: "var(--bg-2)",                  bd: "var(--line-strong)",          fg: "var(--fg-mute)" },
};

function RackBuilderModule() {
  const [items, setItems] = React.useState(DEFAULT_RACK);
  const [selectedIid, setSelectedIid] = React.useState(13);
  const [rackSize, setRackSize] = React.useState(42);
  const [filter, setFilter] = React.useState("All");
  const [hoverPos, setHoverPos] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [draggingId, setDraggingId] = React.useState(null);

  const cats = ["All", ...Array.from(new Set(RACK_CATALOG.map((c) => c.cat)))];
  const visibleCatalog = RACK_CATALOG.filter((c) => {
    if (filter !== "All" && c.cat !== filter) return false;
    if (search && !c.model.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Used U slots
  const usedSlots = new Set();
  items.forEach((i) => {
    const def = RACK_CATALOG.find((d) => d.id === i.id);
    for (let u = i.pos; u < i.pos + def.u; u++) usedSlots.add(u);
  });

  // Stats
  const totalU = items.reduce((s, i) => s + RACK_CATALOG.find((d) => d.id === i.id).u, 0);
  const totalW = items.reduce((s, i) => s + RACK_CATALOG.find((d) => d.id === i.id).w, 0);
  const totalWatts = items.reduce((s, i) => s + RACK_CATALOG.find((d) => d.id === i.id).watts, 0);
  const maxDepth = items.reduce((m, i) => Math.max(m, RACK_CATALOG.find((d) => d.id === i.id).depth), 0);
  const usedPct = Math.round((totalU / rackSize) * 100);
  const watts120 = Math.ceil(totalWatts / 1800); // 1800W per 15A circuit @ 120V
  const watts208 = (totalWatts / 208).toFixed(1);
  const btu = Math.round(totalWatts * 3.412);

  const selected = items.find((i) => i.iid === selectedIid);
  const selectedDef = selected ? RACK_CATALOG.find((d) => d.id === selected.id) : null;

  // Find lowest empty slot that fits a u-unit item
  const findSlotFor = (def) => {
    for (let u = 1; u <= rackSize - def.u + 1; u++) {
      let ok = true;
      for (let k = u; k < u + def.u; k++) {
        if (usedSlots.has(k)) { ok = false; break; }
      }
      if (ok) return u;
    }
    return null;
  };

  const addItem = (id) => {
    const def = RACK_CATALOG.find((d) => d.id === id);
    const pos = findSlotFor(def);
    if (pos == null) return;
    const iid = (items.reduce((m, i) => Math.max(m, i.iid), 0)) + 1;
    setItems([...items, { iid, id, pos }]);
    setSelectedIid(iid);
  };

  const removeItem = (iid) => {
    setItems(items.filter((i) => i.iid !== iid));
    if (selectedIid === iid) setSelectedIid(null);
  };

  // Rack UI
  const U_HEIGHT = 14;
  const RACK_W = 360;

  // Hover preview when dragging from catalog
  const hoverDef = draggingId ? RACK_CATALOG.find((d) => d.id === draggingId) : null;
  const hoverValid = hoverDef && hoverPos != null && (() => {
    if (hoverPos < 1 || hoverPos + hoverDef.u - 1 > rackSize) return false;
    for (let k = hoverPos; k < hoverPos + hoverDef.u; k++) if (usedSlots.has(k)) return false;
    return true;
  })();

  return (
    <>
      {/* LEFT — Equipment catalog */}
      <div className="left-pane">
        <div className="pane-hd">
          <span>EQUIPMENT CATALOG</span>
          <span className="spacer" />
          <span className="mono faint" style={{ fontSize: 10 }}>{visibleCatalog.length}</span>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input placeholder="Filter equipment…" value={search}
                 onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 10px", borderBottom: "1px solid var(--line)" }}>
          {cats.map((c) => (
            <button key={c} className="tb-btn"
                    style={{
                      padding: "2px 6px",
                      fontSize: 10,
                      background: filter === c ? "var(--accent-faint)" : "transparent",
                      color: filter === c ? "var(--accent)" : "var(--fg-mute)",
                      border: `1px solid ${filter === c ? "var(--accent-dim)" : "var(--line-strong)"}`,
                    }}
                    onClick={() => setFilter(c)}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="pane-body">
          {visibleCatalog.map((c) => {
            const col = COLOR_MAP[c.color];
            return (
              <div key={c.id}
                   className="list-row"
                   draggable
                   onDragStart={() => setDraggingId(c.id)}
                   onDragEnd={() => { setDraggingId(null); setHoverPos(null); }}
                   onDoubleClick={() => addItem(c.id)}
                   style={{ height: 40, padding: "4px 10px", flexDirection: "column", alignItems: "stretch", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 14, height: 14, background: col.bg, border: `1px solid ${col.bd}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontFamily: "var(--mono)", fontSize: 8, color: col.fg }}>
                    {c.u}U
                  </span>
                  <span className="lbl" style={{ fontFamily: "var(--sans)", fontSize: 11.5, color: "var(--fg)" }}>{c.model}</span>
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); addItem(c.id); }}>
                    <I.Plus size={11} />
                  </button>
                </div>
                <div className="mono faint" style={{ fontSize: 10, display: "flex", gap: 8, paddingLeft: 20 }}>
                  <span>{c.cat.toUpperCase()}</span>
                  <span>{c.w}kg</span>
                  <span>{c.watts}W</span>
                  <span>{c.depth}mm</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER — Rack canvas */}
      <div className="center-pane">
        <div className="canvas-toolbar">
          <div className="tg">
            <button data-active={rackSize === 24 ? "1" : "0"} onClick={() => setRackSize(24)}>24U</button>
            <button data-active={rackSize === 42 ? "1" : "0"} onClick={() => setRackSize(42)}>42U</button>
            <button data-active={rackSize === 48 ? "1" : "0"} onClick={() => setRackSize(48)}>48U</button>
          </div>
          <div className="divider-v" />
          <span className="mono faint" style={{ fontSize: 10 }}>RACK · R-001</span>
          <span className="chip">SHOW: HELIOS</span>
          <span style={{ flex: 1 }} />
          <span className="mono faint" style={{ fontSize: 10 }}>DRAG FROM CATALOG · ↕ TO REORDER</span>
          <div className="divider-v" />
          <button className="tb-btn"><I.Export size={13} /> Spec PDF</button>
          <button className="tb-btn primary"><I.Plus size={13} /> Add Rack</button>
        </div>

        <div className="led-canvas" data-canvas-style="schematic" style={{ cursor: "default", overflow: "auto" }}>
          <div className="canvas-overlay tl">
            <div className="row"><span className="k">RACK</span><span className="v">R-001 · Stage Left</span></div>
            <div className="row"><span className="k">SIZE</span><span className="v">{rackSize}U · 600×1070mm</span></div>
            <div className="row"><span className="k">SWL</span><span className="v">800 kg static</span></div>
          </div>
          <div className="canvas-overlay tr">
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <span className="k">USED</span>
              <span className="v" style={{ color: usedPct > 85 ? "var(--warn)" : "var(--accent)" }}>{usedPct}%</span>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <span className="k">FREE</span><span className="v">{rackSize - totalU}U</span>
            </div>
          </div>

          <div className="canvas-stage" style={{ paddingTop: 30, paddingBottom: 30 }}>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              {/* Front rack view */}
              <div>
                <div style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 10, color: "var(--fg-faint)",
                              letterSpacing: "0.08em", marginBottom: 8 }}>
                  FRONT VIEW
                </div>
                <div style={{
                  width: RACK_W + 56,
                  background: "var(--bg-1)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: 2,
                  padding: 14,
                }}>
                  {/* Rack header — top brace */}
                  <div style={{
                    height: 8,
                    background: "var(--bg-3)",
                    borderBottom: "1px solid var(--line-strong)",
                    marginBottom: 4,
                  }} />
                  <div style={{ display: "flex", gap: 4 }}>
                    {/* Left U-numbers (descending) */}
                    <div style={{ width: 22, display: "flex", flexDirection: "column",
                                  fontFamily: "var(--mono)", fontSize: 8, color: "var(--fg-ghost)" }}>
                      {Array.from({ length: rackSize }).map((_, i) => {
                        const u = rackSize - i;
                        return (
                          <div key={u} style={{ height: U_HEIGHT, display: "flex",
                                                 alignItems: "center", justifyContent: "flex-end",
                                                 paddingRight: 3, borderRight: "1px solid var(--line)" }}>
                            {u}
                          </div>
                        );
                      })}
                    </div>
                    {/* Slot column */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        const r = e.currentTarget.getBoundingClientRect();
                        const u = rackSize - Math.floor((e.clientY - r.top) / U_HEIGHT);
                        setHoverPos(Math.max(1, Math.min(rackSize, u)));
                      }}
                      onDragLeave={() => setHoverPos(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!draggingId || hoverPos == null) return;
                        const def = RACK_CATALOG.find((d) => d.id === draggingId);
                        // check fits
                        let ok = hoverPos >= 1 && hoverPos + def.u - 1 <= rackSize;
                        if (ok) for (let k = hoverPos; k < hoverPos + def.u; k++) if (usedSlots.has(k)) { ok = false; break; }
                        if (ok) {
                          const iid = (items.reduce((m, i) => Math.max(m, i.iid), 0)) + 1;
                          setItems([...items, { iid, id: draggingId, pos: hoverPos }]);
                          setSelectedIid(iid);
                        }
                        setDraggingId(null);
                        setHoverPos(null);
                      }}
                      style={{
                        position: "relative",
                        width: RACK_W,
                        height: rackSize * U_HEIGHT,
                        background: "var(--bg-2)",
                        border: "1px solid var(--line-strong)",
                        backgroundImage:
                          `linear-gradient(var(--line-faint) 1px, transparent 1px),
                           linear-gradient(90deg, transparent calc(100% - 6px), var(--line) 100%),
                           linear-gradient(90deg, var(--line) 0, var(--line) 6px, transparent 6px)`,
                        backgroundSize: `100% ${U_HEIGHT}px, 100% 100%, 100% 100%`,
                        backgroundPosition: "0 0, 0 0, 0 0",
                      }}>
                      {/* Mounting holes (left & right strip) */}
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: 6, background: "var(--bg-3)",
                        borderRight: "1px solid var(--line-strong)",
                      }} />
                      <div style={{
                        position: "absolute", right: 0, top: 0, bottom: 0,
                        width: 6, background: "var(--bg-3)",
                        borderLeft: "1px solid var(--line-strong)",
                      }} />
                      {Array.from({ length: rackSize }).map((_, i) => (
                        <React.Fragment key={i}>
                          <span style={{ position: "absolute", left: 1, top: i * U_HEIGHT + U_HEIGHT/2 - 1,
                                          width: 4, height: 2, background: "var(--bg-0)" }} />
                          <span style={{ position: "absolute", right: 1, top: i * U_HEIGHT + U_HEIGHT/2 - 1,
                                          width: 4, height: 2, background: "var(--bg-0)" }} />
                        </React.Fragment>
                      ))}

                      {/* Items */}
                      {items.map((it) => {
                        const def = RACK_CATALOG.find((d) => d.id === it.id);
                        const col = COLOR_MAP[def.color];
                        const top = (rackSize - (it.pos + def.u - 1)) * U_HEIGHT;
                        const h = def.u * U_HEIGHT;
                        const isSel = selectedIid === it.iid;
                        return (
                          <div key={it.iid}
                               onClick={() => setSelectedIid(it.iid)}
                               onDoubleClick={() => removeItem(it.iid)}
                               style={{
                                 position: "absolute",
                                 left: 8, right: 8,
                                 top, height: h - 1,
                                 background: col.bg,
                                 border: `1px solid ${isSel ? "var(--accent)" : col.bd}`,
                                 boxShadow: isSel ? "0 0 0 1px var(--accent)" : "none",
                                 display: "flex",
                                 alignItems: "center",
                                 padding: "0 8px",
                                 gap: 8,
                                 fontFamily: "var(--mono)",
                                 fontSize: 9.5,
                                 color: col.fg,
                                 cursor: "pointer",
                                 overflow: "hidden",
                               }}>
                            <span style={{ width: 4, height: "70%", background: col.fg, opacity: 0.8 }} />
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            fontFamily: "var(--sans)", fontSize: 11, color: "var(--fg)" }}>
                              {def.model}
                            </span>
                            {def.u > 1 && (
                              <>
                                <span style={{ opacity: 0.7 }}>{def.watts}W</span>
                                <span style={{ opacity: 0.5 }}>·</span>
                              </>
                            )}
                            <span>{def.u}U</span>
                            {/* Vent grille pattern for visual texture */}
                            {def.id === "vent" && (
                              <span style={{ position: "absolute", inset: 4,
                                              background: "repeating-linear-gradient(90deg, transparent 0 4px, var(--fg-ghost) 4px 5px)",
                                              opacity: 0.6, pointerEvents: "none" }} />
                            )}
                          </div>
                        );
                      })}

                      {/* Drag preview */}
                      {hoverDef && hoverPos != null && (
                        <div style={{
                          position: "absolute",
                          left: 8, right: 8,
                          top: (rackSize - (hoverPos + hoverDef.u - 1)) * U_HEIGHT,
                          height: hoverDef.u * U_HEIGHT - 1,
                          border: `1.5px dashed ${hoverValid ? "var(--accent)" : "var(--err)"}`,
                          background: hoverValid ? "var(--accent-faint)" : "oklch(0.68 0.21 25 / 0.1)",
                          pointerEvents: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: hoverValid ? "var(--accent)" : "var(--err)",
                        }}>
                          {hoverValid ? `+ ${hoverDef.model} @ U${hoverPos}` : "× SLOT OCCUPIED"}
                        </div>
                      )}
                    </div>
                    {/* Right U-numbers */}
                    <div style={{ width: 22, display: "flex", flexDirection: "column",
                                  fontFamily: "var(--mono)", fontSize: 8, color: "var(--fg-ghost)" }}>
                      {Array.from({ length: rackSize }).map((_, i) => {
                        const u = rackSize - i;
                        return (
                          <div key={u} style={{ height: U_HEIGHT, display: "flex",
                                                 alignItems: "center", paddingLeft: 3,
                                                 borderLeft: "1px solid var(--line)" }}>
                            {u}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* bottom brace */}
                  <div style={{
                    height: 8,
                    background: "var(--bg-3)",
                    borderTop: "1px solid var(--line-strong)",
                    marginTop: 4,
                  }} />
                </div>
              </div>

              {/* Side profile */}
              <div>
                <div style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 10, color: "var(--fg-faint)",
                              letterSpacing: "0.08em", marginBottom: 8 }}>
                  SIDE PROFILE
                </div>
                <div style={{
                  width: 80,
                  background: "var(--bg-1)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: 2,
                  padding: 14,
                }}>
                  <div style={{ height: 8, background: "var(--bg-3)", marginBottom: 4, borderBottom: "1px solid var(--line-strong)" }} />
                  <div style={{
                    position: "relative",
                    height: rackSize * U_HEIGHT,
                    background: "var(--bg-2)",
                    border: "1px solid var(--line-strong)",
                  }}>
                    {items.map((it) => {
                      const def = RACK_CATALOG.find((d) => d.id === it.id);
                      const col = COLOR_MAP[def.color];
                      const top = (rackSize - (it.pos + def.u - 1)) * U_HEIGHT;
                      const h = def.u * U_HEIGHT;
                      const dpct = def.depth ? (def.depth / 1070) : 0;
                      return (
                        <div key={it.iid}
                             onClick={() => setSelectedIid(it.iid)}
                             style={{
                               position: "absolute",
                               left: 1, top, height: h - 1,
                               width: `${Math.max(8, dpct * 100)}%`,
                               background: col.bg,
                               border: `1px solid ${selectedIid === it.iid ? "var(--accent)" : col.bd}`,
                             }} />
                      );
                    })}
                    {/* Depth scale */}
                    <div style={{ position: "absolute", right: 1, top: 0, bottom: 0,
                                  borderLeft: "1px dashed var(--line-strong)" }} />
                  </div>
                  <div style={{ height: 8, background: "var(--bg-3)", marginTop: 4, borderTop: "1px solid var(--line-strong)" }} />
                  <div style={{ marginTop: 6, fontFamily: "var(--mono)", fontSize: 9,
                                color: "var(--fg-faint)", textAlign: "center" }}>
                    1070mm
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="crosshair-readout">
            EIA-310 · 19in · {rackSize}U · DEEP {maxDepth}mm
          </div>
        </div>

        {/* Bottom meter row */}
        <div className="canvas-meter">
          <div className="meter-block">
            <div className="h">RACK USAGE</div>
            <div className="v" style={{ color: usedPct > 85 ? "var(--warn)" : "var(--accent)" }}>
              {totalU}<span style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>/ {rackSize}U</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${usedPct}%`,
                                  background: usedPct > 85 ? "var(--warn)" : "var(--accent)" }} /></div>
            <div className="mono faint" style={{ fontSize: 10 }}>{rackSize - totalU}U free · {items.length} devices</div>
          </div>
          <div className="meter-block">
            <div className="h">WEIGHT</div>
            <div className="v" style={{ color: totalW > 200 ? "var(--warn)" : "var(--fg)" }}>
              {totalW.toFixed(1)}<span style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>kg</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${(totalW/250)*100}%`,
                                  background: totalW > 200 ? "var(--warn)" : "var(--accent)" }} /></div>
            <div className="mono faint" style={{ fontSize: 10 }}>SWL 250kg · {Math.round((totalW/250)*100)}% loaded</div>
          </div>
          <div className="meter-block">
            <div className="h">POWER DRAW</div>
            <div className="v warn">
              {(totalWatts/1000).toFixed(2)}<span style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>kW</span>
            </div>
            <div className="bar-stack">
              <div className="bar-seg" style={{ width: `${Math.min(100, (totalWatts/8000)*100)}%`, background: "var(--warn)" }} />
              <div className="bar-seg" style={{ width: `${Math.max(0, 100 - (totalWatts/8000)*100)}%`, background: "var(--bg-3)" }} />
            </div>
            <div className="mono faint" style={{ fontSize: 10 }}>{watts120} × 15A · {watts208}A @ 208V</div>
          </div>
          <div className="meter-block">
            <div className="h">THERMAL · BTU/h</div>
            <div className="v">
              {btu.toLocaleString()}<span style={{ fontSize: 10, color: "var(--fg-faint)", marginLeft: 4 }}>BTU/h</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, (btu/30000)*100)}%` }} /></div>
            <div className="mono faint" style={{ fontSize: 10 }}>≈ {(btu/12000).toFixed(2)} ton AC · airflow F→B</div>
          </div>
        </div>
      </div>

      {/* RIGHT — inspector */}
      <div className="right-pane">
        <div className="pane-hd">
          <span>RACK INSPECTOR</span>
          <span className="spacer" />
          <span className="chip accent">R-001</span>
        </div>

        {selected && selectedDef && (() => {
          const col = COLOR_MAP[selectedDef.color];
          return (
            <div className="pane-body">
              <div className="readout accent">
                <div className="lbl">SELECTED · U{selected.pos}{selectedDef.u > 1 ? `–${selected.pos + selectedDef.u - 1}` : ""}</div>
                <div className="val" style={{ fontSize: 14, color: col.fg }}>{selectedDef.model}</div>
              </div>
              <div className="readout-grid">
                <div className="readout">
                  <div className="lbl">Size</div>
                  <div className="val">{selectedDef.u}<span className="unit">U</span></div>
                </div>
                <div className="readout">
                  <div className="lbl">Depth</div>
                  <div className="val">{selectedDef.depth}<span className="unit">mm</span></div>
                </div>
              </div>
              <div className="section-h"><span>SPECIFICATION</span><span className="line" /></div>
              <div className="kv">
                <span className="k">Category</span><span className="v">{selectedDef.cat}</span>
                <span className="k">Weight</span><span className="v">{selectedDef.w} kg</span>
                <span className="k">Power</span><span className="v">{selectedDef.watts} W</span>
                <span className="k">Mount</span><span className="v">EIA-310 · 4-post</span>
                <span className="k">Cable mgmt</span><span className="v">Rear · L-bar</span>
                <span className="k">Asset ref</span><span className="v" style={{ color: "var(--accent)" }}>BMD-{selected.iid.toString().padStart(3,"0")}</span>
              </div>

              <div className="section-h"><span>POSITION</span><span className="line" /></div>
              <div className="fld" style={{ gridTemplateColumns: "90px 1fr 60px 60px" }}>
                <span className="k">U slot</span>
                <input type="number" value={selected.pos} min={1} max={rackSize - selectedDef.u + 1}
                       onChange={(e) => {
                         const np = Math.max(1, Math.min(rackSize - selectedDef.u + 1, Number(e.target.value)));
                         setItems(items.map((i) => i.iid === selected.iid ? { ...i, pos: np } : i));
                       }} />
                <button className="tb-btn" onClick={() => {
                  const np = Math.min(rackSize - selectedDef.u + 1, selected.pos + 1);
                  setItems(items.map((i) => i.iid === selected.iid ? { ...i, pos: np } : i));
                }}>↑</button>
                <button className="tb-btn" onClick={() => {
                  const np = Math.max(1, selected.pos - 1);
                  setItems(items.map((i) => i.iid === selected.iid ? { ...i, pos: np } : i));
                }}>↓</button>
              </div>

              <div style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
                <button className="tb-btn" style={{ flex: 1 }} onClick={() => removeItem(selected.iid)}>
                  <I.Cross size={12} /> Remove
                </button>
                <button className="tb-btn primary" style={{ flex: 1 }}>Edit Spec</button>
              </div>
            </div>
          );
        })()}

        {!selected && (
          <div className="pane-body">
            <div className="empty" style={{ padding: 30 }}>
              <I.Inventory size={28} />
              <span className="mono faint" style={{ fontSize: 11 }}>SELECT A DEVICE</span>
              <span className="mono faint" style={{ fontSize: 10, textAlign: "center", maxWidth: 200, lineHeight: 1.4 }}>
                Click a slot, drag from the catalog, or double-click to auto-place.
              </span>
            </div>
          </div>
        )}

        <div className="pane-hd"><span>POWER BUDGET</span></div>
        <div className="pane-body">
          {(() => {
            const byCat = {};
            items.forEach((i) => {
              const d = RACK_CATALOG.find((x) => x.id === i.id);
              byCat[d.cat] = (byCat[d.cat] || 0) + d.watts;
            });
            const max = Math.max(...Object.values(byCat), 1);
            return Object.entries(byCat).map(([k, v]) => (
              <div key={k} className="fld" style={{ gridTemplateColumns: "70px 1fr 60px" }}>
                <span className="k">{k}</span>
                <div className="bar"><div className="bar-fill" style={{ width: `${(v/max)*100}%` }} /></div>
                <span className="num" style={{ textAlign: "right" }}>{v}W</span>
              </div>
            ));
          })()}
          <div className="section-h"><span>CIRCUIT MAP</span><span className="line" /></div>
          <div className="kv">
            <span className="k">L6-30 #1</span><span className="v" style={{ color: "var(--accent)" }}>{Math.min(2400, totalWatts)}W / 2400W</span>
            <span className="k">L6-30 #2</span><span className="v">{Math.max(0, Math.min(2400, totalWatts-2400))}W / 2400W</span>
            <span className="k">UPS runtime</span><span className="v">{Math.round(180000/totalWatts)} min @ load</span>
          </div>
        </div>
      </div>
    </>
  );
}

window.RackBuilderModule = RackBuilderModule;
