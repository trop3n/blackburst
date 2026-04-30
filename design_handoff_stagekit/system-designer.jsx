// system-designer.jsx — node graph + patch sheet

const { I, DATA } = window;

const LANE_COLOR = {
  video: "var(--magenta)",
  audio: "var(--info)",
  network: "var(--accent)",
  power: "var(--warn)",
};

function SystemDesignerModule() {
  const [lanes, setLanes] = React.useState({ video: true, audio: true, network: true, power: true });
  const [selected, setSelected] = React.useState("n4");
  const [view, setView] = React.useState("graph");

  const NODE_W = 150;
  const NODE_H_BASE = 56;
  const node = DATA.SYSTEM_NODES.find((n) => n.id === selected);

  const toggleLane = (l) => setLanes((p) => ({ ...p, [l]: !p[l] }));

  const visibleEdges = DATA.SYSTEM_EDGES.filter((e) => lanes[e.lane]);

  // Edge path
  const pathFor = (e) => {
    const a = DATA.SYSTEM_NODES.find((n) => n.id === e.from);
    const b = DATA.SYSTEM_NODES.find((n) => n.id === e.to);
    const x1 = a.x + NODE_W;
    const y1 = a.y + NODE_H_BASE / 2;
    const x2 = b.x;
    const y2 = b.y + NODE_H_BASE / 2;
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  return (
    <>
      {/* LEFT — palette */}
      <div className="left-pane">
        <div className="pane-hd"><span>DEVICE PALETTE</span></div>
        <div className="search">
          <I.Search size={12} />
          <input placeholder="Drag to canvas…" />
        </div>
        <div className="pane-body">
          {[
            { cat: "VIDEO SOURCES", items: ["Resolume Mac", "Disguise gx 2c", "BMD HyperDeck", "PTZ Camera"] },
            { cat: "PROCESSORS", items: ["Brompton SX40", "Brompton Tessera S8", "Novastar MX40", "Megapixel Helios"] },
            { cat: "MIXERS", items: ["vMix M4", "Blackmagic ATEM", "Roland V-160HD"] },
            { cat: "AUDIO", items: ["DiGiCo SD12", "Yamaha CL5", "Shure ULXD4Q"] },
            { cat: "POWER", items: ["Distro 200A 3ϕ", "Lex SQ-12IL"] },
          ].map((g) => (
            <React.Fragment key={g.cat}>
              <div className="section-h"><span>{g.cat}</span><span className="line" /></div>
              {g.items.map((i) => (
                <div key={i} className="list-row" style={{ cursor: "grab" }}>
                  <I.Move size={12} />
                  <span className="lbl">{i}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* CENTER — graph */}
      <div className="center-pane">
        <div className="canvas-toolbar">
          <div className="tg">
            <button data-active={view === "graph" ? "1" : "0"} onClick={() => setView("graph")}>GRAPH</button>
            <button data-active={view === "patch" ? "1" : "0"} onClick={() => setView("patch")}>PATCH SHEET</button>
          </div>
          <div className="divider-v" />
          <span className="mono faint" style={{ fontSize: 10 }}>LAYERS</span>
          <div className="lane-toggles">
            {["video", "audio", "network", "power"].map((l) => (
              <button key={l} className={`lane-tg ${l}`}
                      data-on={lanes[l] ? "1" : "0"}
                      onClick={() => toggleLane(l)}>
                <span className="sw" />{l.toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ flex: 1 }} />
          <button className="tb-btn"><I.Bolt size={13} /> Auto-Route</button>
          <button className="tb-btn"><I.Export size={13} /> PDF / CAD</button>
        </div>

        {view === "graph" && (
          <div className="led-canvas" data-canvas-style="schematic" style={{ cursor: "default" }}>
            <div className="canvas-overlay tl">
              <div className="row"><span className="k">SYSTEM</span><span className="v">Helios Auditorium · v0042</span></div>
              <div className="row"><span className="k">NODES</span><span className="v">{DATA.SYSTEM_NODES.length}</span><span className="k">EDGES</span><span className="v">{visibleEdges.length}/{DATA.SYSTEM_EDGES.length}</span></div>
            </div>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M0,0 L10,5 L0,10" fill="currentColor" />
                </marker>
              </defs>
              {visibleEdges.map((e, i) => (
                <g key={i} style={{ color: LANE_COLOR[e.lane] }}>
                  <path d={pathFor(e)} fill="none" stroke="currentColor" strokeWidth="1.2"
                        strokeOpacity="0.7" markerEnd="url(#arrow)" />
                </g>
              ))}
              {visibleEdges.map((e, i) => {
                const a = DATA.SYSTEM_NODES.find((n) => n.id === e.from);
                const b = DATA.SYSTEM_NODES.find((n) => n.id === e.to);
                const mx = (a.x + NODE_W + b.x) / 2;
                const my = (a.y + b.y) / 2 + NODE_H_BASE / 2;
                return (
                  <g key={`l${i}`}>
                    <rect x={mx - 28} y={my - 8} width="56" height="14" rx="2"
                          fill="var(--bg-1)" stroke={LANE_COLOR[e.lane]} strokeWidth="0.5" strokeOpacity="0.5" />
                    <text x={mx} y={my + 2} textAnchor="middle"
                          fontFamily="var(--mono)" fontSize="9" fill={LANE_COLOR[e.lane]}>
                      {e.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {DATA.SYSTEM_NODES.map((n) => (
              <div key={n.id} className="node"
                   data-selected={selected === n.id ? "1" : "0"}
                   style={{ left: n.x, top: n.y, width: NODE_W }}
                   onClick={() => setSelected(n.id)}>
                <div className="node-hd">
                  <span style={{ color: "var(--accent)" }}>●</span>
                  <span className="typ">{n.type}</span>
                  <span style={{ marginLeft: "auto", color: "var(--fg-faint)" }}>{n.id}</span>
                </div>
                <div className="node-bd">
                  <div style={{ color: "var(--fg)", fontFamily: "var(--sans)", fontSize: 11, marginBottom: 4 }}>{n.name}</div>
                  {Object.entries(n.details).map(([k, v]) => (
                    <div className="row" key={k}><span className="k">{k}</span><span>{v}</span></div>
                  ))}
                </div>
                {n.in && n.in.map((lane, i) => (
                  <span key={`in${i}`} className={`node-port in ${lane}`}
                        style={{ top: 28 + i * 14 }} />
                ))}
                {n.out && n.out.map((lane, i) => (
                  <span key={`out${i}`} className={`node-port out ${lane}`}
                        style={{ top: 28 + i * 14 }} />
                ))}
              </div>
            ))}

            <div className="crosshair-readout">SCHEMATIC · GRID 16 · AUTO-ROUTE: ORTHOGONAL</div>
          </div>
        )}

        {view === "patch" && (
          <div style={{ flex: 1, overflow: "auto", background: "var(--bg-2)" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th><th>LANE</th>
                  <th>SOURCE</th><th>SRC PORT</th>
                  <th>DEST</th><th>DEST PORT</th>
                  <th>CABLE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {DATA.PATCH_SHEET.map((p) => (
                  <tr key={p.id}>
                    <td className="muted">{p.id}</td>
                    <td><span className="chip" style={{ color: LANE_COLOR[p.lane === "net" ? "network" : p.lane === "pwr" ? "power" : p.lane], borderColor: "var(--line-strong)" }}>{p.lane.toUpperCase()}</span></td>
                    <td>{p.src}</td><td className="muted">{p.srcPort}</td>
                    <td>{p.dest}</td><td className="muted">{p.destPort}</td>
                    <td className="muted">{p.cable}</td>
                    <td className="muted">●</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT — Node inspector */}
      <div className="right-pane">
        <div className="pane-hd">
          <span>{view === "graph" ? "NODE INSPECTOR" : "PATCH STATS"}</span>
          <span className="spacer" />
          <span className="chip accent">{node?.id || "—"}</span>
        </div>
        {view === "graph" && node && (
          <div className="pane-body">
            <div className="readout accent">
              <div className="lbl">{node.type}</div>
              <div className="val" style={{ fontSize: 16 }}>{node.name}</div>
            </div>
            <div className="section-h"><span>SPECIFICATION</span><span className="line" /></div>
            <div className="kv">
              {Object.entries(node.details).map(([k, v]) => (
                <React.Fragment key={k}>
                  <span className="k">{k}</span><span className="v">{v}</span>
                </React.Fragment>
              ))}
            </div>
            <div className="section-h"><span>CONNECTIONS</span><span className="line" /></div>
            {DATA.SYSTEM_EDGES.filter((e) => e.from === node.id || e.to === node.id).map((e, i) => {
              const isOut = e.from === node.id;
              const peer = DATA.SYSTEM_NODES.find((n) => n.id === (isOut ? e.to : e.from));
              return (
                <div key={i} className="list-row">
                  <span className="chip" style={{ color: LANE_COLOR[e.lane] }}>{isOut ? "→" : "←"}</span>
                  <span className="lbl">{peer.name}</span>
                  <span className="meta">{e.label}</span>
                </div>
              );
            })}
            <div className="section-h"><span>HEALTH</span><span className="line" /></div>
            <div className="kv">
              <span className="k">Status</span><span className="v" style={{ color: "var(--accent)" }}>● ONLINE</span>
              <span className="k">Last sync</span><span className="v">14:21:08</span>
              <span className="k">Firmware</span><span className="v">3.4.12</span>
              <span className="k">Errors (24h)</span><span className="v">0</span>
            </div>
          </div>
        )}
        {view === "patch" && (
          <div className="pane-body">
            <div className="readout-grid">
              <div className="readout accent">
                <div className="lbl">Connections</div>
                <div className="val">{DATA.PATCH_SHEET.length}</div>
              </div>
              <div className="readout">
                <div className="lbl">Total cable</div>
                <div className="val">486<span className="unit">ft</span></div>
              </div>
            </div>
            <div className="section-h"><span>BY LANE</span><span className="line" /></div>
            {["video", "audio", "net", "pwr"].map((l) => {
              const count = DATA.PATCH_SHEET.filter((p) => p.lane === l).length;
              return (
                <div key={l} className="fld" style={{ gridTemplateColumns: "60px 1fr 40px" }}>
                  <span className="k">{l.toUpperCase()}</span>
                  <div className="bar"><div className="bar-fill" style={{ width: `${count*8}%`, background: LANE_COLOR[l === "net" ? "network" : l === "pwr" ? "power" : l] }} /></div>
                  <span className="mono num" style={{ textAlign: "right" }}>{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

window.SystemDesignerModule = SystemDesignerModule;
