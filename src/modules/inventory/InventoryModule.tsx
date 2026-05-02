import { useMemo, useState } from "react";
import { I } from "@/components/Icon";
import { ASSETS, ASSET_CATEGORIES, ASSET_HISTORY, SHOWS } from "@/lib/inventory-data";
import { useInventory } from "./store";

export function InventoryModule() {
  const cat = useInventory((s) => s.cat);
  const setCat = useInventory((s) => s.setCat);
  const selected = useInventory((s) => s.selected);
  const setSelected = useInventory((s) => s.setSelected);
  const view = useInventory((s) => s.view);
  const setView = useInventory((s) => s.setView);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const base = cat === "All gear" ? ASSETS : ASSETS.filter((a) => a.cat === cat);
    if (!filter.trim()) return base;
    const q = filter.trim().toLowerCase();
    return base.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.show.toLowerCase().includes(q),
    );
  }, [cat, filter]);

  const asset = ASSETS.find((a) => a.id === selected);
  const totalIn = ASSETS.filter((a) => a.status === "in").length;
  const totalOut = ASSETS.filter((a) => a.status === "out").length;
  const totalMaint = ASSETS.filter((a) => a.status === "maint").length;

  return (
    <>
      <div className="left-pane">
        <div className="pane-hd"><span>CATEGORIES</span></div>
        <div style={{ flex: "0 0 auto" }}>
          {ASSET_CATEGORIES.map((c) => (
            <div
              key={c.name}
              className="list-row"
              data-active={cat === c.name ? "1" : "0"}
              onClick={() => setCat(c.name)}
            >
              <I.Folder size={12} />
              <span className="lbl">{c.name}</span>
              <span className="meta">{c.count}</span>
            </div>
          ))}
        </div>
        <div className="pane-hd"><span>FLEET STATUS</span></div>
        <div className="pane-body">
          <div className="readout-grid">
            <div className="readout accent">
              <div className="lbl">Available</div>
              <div className="val">{totalIn}</div>
            </div>
            <div className="readout">
              <div className="lbl">Deployed</div>
              <div className="val" style={{ color: "var(--color-warn)" }}>{totalOut}</div>
            </div>
          </div>
          <div className="readout">
            <div className="lbl">In Maintenance</div>
            <div className="val" style={{ color: "var(--color-err)" }}>{totalMaint}</div>
          </div>
          <div className="section-h"><span>UTILIZATION (30d)</span><span className="line" /></div>
          <div style={{ padding: "0 12px 12px" }}>
            <svg width="100%" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
              <polyline
                points="0,40 20,38 40,32 60,28 80,30 100,22 120,18 140,22 160,16 180,20 200,14"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.2"
              />
              <polygon
                points="0,40 20,38 40,32 60,28 80,30 100,22 120,18 140,22 160,16 180,20 200,14 200,60 0,60"
                fill="var(--accent-faint)"
                stroke="none"
              />
            </svg>
            <div
              className="mono"
              style={{
                fontSize: 10,
                display: "flex",
                justifyContent: "space-between",
                color: "var(--color-fg-faint)",
              }}
            >
              <span>30d AGO</span>
              <span style={{ color: "var(--accent)" }}>67%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="center-pane">
        <div className="canvas-toolbar">
          <div className="tg">
            <button data-active={view === "list" ? "1" : "0"} onClick={() => setView("list")}>LIST</button>
            <button data-active={view === "schedule" ? "1" : "0"} onClick={() => setView("schedule")}>SCHEDULE</button>
          </div>
          <div className="divider-v" />
          <div className="search" style={{ flex: 1, border: 0, padding: 0 }}>
            <I.Search size={12} />
            <input
              placeholder={`Filter ${filtered.length} items in ${cat}…`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button className="tb-btn"><I.Plus size={13} /> Check In</button>
          <button className="tb-btn primary"><I.Export size={13} /> Check Out</button>
        </div>

        {view === "list" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ASSET ID</th>
                  <th>MODEL</th>
                  <th>CATEGORY</th>
                  <th>STATUS</th>
                  <th>SHOW / JOB</th>
                  <th>DUE</th>
                  <th>UTIL</th>
                  <th>LAST SVC</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    data-active={selected === a.id ? "1" : "0"}
                    onClick={() => setSelected(a.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{a.id}</td>
                    <td style={{ fontFamily: "var(--font-sans)" }}>{a.model}</td>
                    <td className="muted">{a.cat}</td>
                    <td>
                      <span className={`status-pill ${a.status}`}>
                        {a.status === "maint" ? "MAINT" : a.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{a.show}</td>
                    <td className="muted">{a.due}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="bar" style={{ width: 50 }}>
                          <div
                            className="bar-fill"
                            style={{
                              width: `${a.utilization}%`,
                              background: a.utilization > 85 ? "var(--color-warn)" : "var(--accent)",
                            }}
                          />
                        </div>
                        <span>{a.utilization}%</span>
                      </div>
                    </td>
                    <td className="muted">{a.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === "schedule" && (
          <div style={{ flex: 1, overflow: "auto", background: "var(--color-bg-2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr" }}>
              <div className="pane-hd" style={{ borderBottom: "1px solid var(--color-line)" }}>SHOW</div>
              <div className="gantt-hdr">
                {Array.from({ length: 14 }).map((_, i) => {
                  const day = i + 28;
                  const d = day > 30 ? day - 30 : day;
                  const m = day > 30 ? "05" : "04";
                  return (
                    <div key={i} className="gantt-hdr-cell">
                      {String(d).padStart(2, "0")}/{m}
                    </div>
                  );
                })}
              </div>
              {SHOWS.map((s) => (
                <GanttRow key={s.id} show={s} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="right-pane">
        <div className="pane-hd">
          <span>ASSET DETAIL</span>
          <span className="spacer" />
          <span className="chip accent">{asset?.id}</span>
        </div>
        {asset && (
          <div className="pane-body">
            <div className="readout">
              <div className="lbl">{asset.cat}</div>
              <div className="val" style={{ fontSize: 14 }}>{asset.model}</div>
            </div>
            <div className="readout-grid">
              <div className="readout">
                <div className="lbl">Status</div>
                <div className="val" style={{ fontSize: 13 }}>
                  <span className={`status-pill ${asset.status}`}>{asset.status.toUpperCase()}</span>
                </div>
              </div>
              <div className="readout">
                <div className="lbl">Utilization</div>
                <div
                  className="val"
                  style={{ color: asset.utilization > 85 ? "var(--color-warn)" : "var(--accent)" }}
                >
                  {asset.utilization}<span className="unit">%</span>
                </div>
              </div>
            </div>
            <div className="section-h"><span>ASSIGNMENT</span><span className="line" /></div>
            <div className="kv">
              <span className="k">Show</span><span className="v">{asset.show}</span>
              <span className="k">Due back</span><span className="v">{asset.due}</span>
              <span className="k">Crew</span><span className="v">M. Reyes</span>
              <span className="k">Crate</span><span className="v">CASE-{asset.id.slice(-3)}</span>
            </div>
            <div className="section-h"><span>MAINTENANCE</span><span className="line" /></div>
            <div className="kv">
              <span className="k">Last svc</span><span className="v">{asset.last}</span>
              <span className="k">Next due</span><span className="v">2026-07-15</span>
              <span className="k">Total hrs</span><span className="v">2,184</span>
              <span className="k">PM cycle</span><span className="v">90 days</span>
            </div>
            <div className="section-h"><span>HISTORY</span><span className="line" /></div>
            <div style={{ padding: "0 12px 12px" }}>
              {ASSET_HISTORY.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    padding: "4px 0",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    borderBottom: "1px solid var(--color-line-faint)",
                  }}
                >
                  <span style={{ width: 50, color: "var(--color-fg-faint)" }}>{h.d}</span>
                  <span style={{ flex: 1 }}>{h.e}</span>
                  <span style={{ color: "var(--color-fg-faint)" }}>{h.t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function GanttRow({ show: s }: { show: typeof SHOWS[number] }) {
  const borderColor =
    s.kind === "maint" ? "var(--color-err)" : s.kind === "warn" ? "var(--color-warn)" : "var(--color-line-strong)";
  return (
    <>
      <div className="gantt-label">
        <span className="chip" style={{ borderColor }}>{s.id}</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {s.name}
        </span>
      </div>
      <div className="gantt-track">
        <div
          className={`gantt-bar ${s.kind ?? ""}`}
          style={{
            left: `${(s.start / 14) * 100}%`,
            width: `${((s.end - s.start) / 14) * 100}%`,
          }}
        >
          {s.name} · {s.pct}%
        </div>
      </div>
    </>
  );
}
