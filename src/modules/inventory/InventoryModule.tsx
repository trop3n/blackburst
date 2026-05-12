import { useMemo, useState } from "react";
import { I } from "@/components/Icon";
import { ASSET_CATEGORIES, SHOWS } from "@/lib/inventory-data";
import type { AssetStatus } from "@/types";
import { useInventory } from "./store";
import { issuesByAsset, summarizeAssetIssues, validateAssets } from "./validation";

const CAT_OPTIONS = ASSET_CATEGORIES.filter((c) => c.name !== "All gear").map((c) => c.name);
const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "in", label: "IN" },
  { value: "out", label: "OUT" },
  { value: "maint", label: "MAINT" },
];

export function InventoryModule() {
  const assets = useInventory((s) => s.assets);
  const cat = useInventory((s) => s.cat);
  const setCat = useInventory((s) => s.setCat);
  const selected = useInventory((s) => s.selected);
  const setSelected = useInventory((s) => s.setSelected);
  const view = useInventory((s) => s.view);
  const setView = useInventory((s) => s.setView);
  const checkIn = useInventory((s) => s.checkIn);
  const checkOut = useInventory((s) => s.checkOut);
  const updateAsset = useInventory((s) => s.updateAsset);
  const addAsset = useInventory((s) => s.addAsset);
  const removeAsset = useInventory((s) => s.removeAsset);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const base = cat === "All gear" ? assets : assets.filter((a) => a.cat === cat);
    if (!filter.trim()) return base;
    const q = filter.trim().toLowerCase();
    return base.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.show.toLowerCase().includes(q),
    );
  }, [assets, cat, filter]);

  const asset = assets.find((a) => a.id === selected);
  const totalIn = assets.filter((a) => a.status === "in").length;
  const totalOut = assets.filter((a) => a.status === "out").length;
  const totalMaint = assets.filter((a) => a.status === "maint").length;
  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assets) m.set(a.cat, (m.get(a.cat) ?? 0) + 1);
    return m;
  }, [assets]);
  const allIssues = useMemo(() => validateAssets(assets, SHOWS), [assets]);
  const issuesIndex = useMemo(() => issuesByAsset(allIssues), [allIssues]);
  const issuesSummary = summarizeAssetIssues(allIssues);
  const selectedIssues = asset ? issuesIndex.get(asset.id) ?? [] : [];

  const handleCheckIn = () => {
    if (!asset) return;
    if (asset.status === "in") return;
    checkIn(asset.id);
  };
  const handleCheckOut = () => {
    if (!asset) return;
    if (asset.status === "out") return;
    const show = prompt(`Check out ${asset.id} — show / job name?`, asset.show !== "—" ? asset.show : "")?.trim();
    if (!show) return;
    const due = prompt(`Due back date (e.g. "Apr 28")?`, asset.due !== "—" ? asset.due : "")?.trim();
    if (!due) return;
    checkOut(asset.id, show, due);
  };
  const handleNewAsset = () => {
    const id = prompt("Asset ID (e.g. BMD-S40-004)?")?.trim();
    if (!id) return;
    if (assets.some((a) => a.id === id)) {
      alert(`Asset ID "${id}" already exists.`);
      return;
    }
    const model = prompt("Model name?")?.trim();
    if (!model) return;
    const catName = prompt("Category?", CAT_OPTIONS[0])?.trim();
    if (!catName) return;
    const today = new Date().toISOString().slice(0, 10);
    addAsset({
      id,
      model,
      cat: catName,
      status: "in",
      show: "—",
      due: "—",
      utilization: 0,
      last: today,
    });
    setSelected(id);
  };
  const handleDecommission = () => {
    if (!asset) return;
    if (!confirm(`Decommission ${asset.id} (${asset.model})? This removes it from the fleet.`)) return;
    const idx = filtered.findIndex((a) => a.id === asset.id);
    const fallback = filtered[idx + 1]?.id ?? filtered[idx - 1]?.id ?? assets.find((a) => a.id !== asset.id)?.id ?? "";
    removeAsset(asset.id);
    setSelected(fallback);
  };

  const avgUtilization =
    assets.length > 0
      ? Math.round(assets.reduce((s, a) => s + a.utilization, 0) / assets.length)
      : 0;

  return (
    <>
      <div className="left-pane">
        <div className="pane-hd"><span>CATEGORIES</span></div>
        <div style={{ flex: "0 0 auto" }}>
          {ASSET_CATEGORIES.map((c) => {
            const live = c.name === "All gear" ? assets.length : countByCat.get(c.name) ?? 0;
            return (
              <div
                key={c.name}
                className="list-row"
                data-active={cat === c.name ? "1" : "0"}
                onClick={() => setCat(c.name)}
              >
                <I.Folder size={12} />
                <span className="lbl">{c.name}</span>
                <span className="meta">{live}</span>
              </div>
            );
          })}
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
          <div className="section-h">
            <span>CONSISTENCY</span>
            <span className="line" />
          </div>
          <div style={{ padding: "0 12px 8px" }}>
            {issuesSummary.level === "ok" ? (
              <div className="issue-row" data-level="ok">
                <span className="dot ok" />
                <div>
                  <div className="title mono">All assignments consistent</div>
                  <div className="detail">No conflicts between assets and the show schedule.</div>
                </div>
              </div>
            ) : (
              allIssues.map((iss) => (
                <div
                  key={iss.id}
                  className="issue-row"
                  data-level={iss.level}
                  onClick={() => setSelected(iss.assetId)}
                  style={{ cursor: "pointer" }}
                >
                  <span className={`dot ${iss.level}`} />
                  <div>
                    <div className="title mono">{iss.title}</div>
                    <div className="detail">{iss.detail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="section-h"><span>FLEET UTILIZATION</span><span className="line" /></div>
          <div style={{ padding: "0 12px 12px" }}>
            <div
              className="mono"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--color-fg-faint)",
                marginBottom: 4,
              }}
            >
              <span>AVG</span>
              <span
                style={{
                  color: avgUtilization > 85 ? "var(--color-warn)" : "var(--accent)",
                }}
              >
                {avgUtilization}%
              </span>
            </div>
            <div className="bar">
              <div
                className="bar-fill"
                style={{
                  width: `${avgUtilization}%`,
                  background: avgUtilization > 85 ? "var(--color-warn)" : "var(--accent)",
                }}
              />
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--color-fg-faint)",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {assets.length} asset{assets.length === 1 ? "" : "s"} tracked
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
          <button className="tb-btn" onClick={handleNewAsset} title="Add a new asset to the fleet">
            <I.Plus size={13} /> New
          </button>
          <button
            className="tb-btn"
            onClick={handleCheckIn}
            disabled={!asset || asset.status === "in"}
            title={asset ? `Check in ${asset.id}` : "Select an asset first"}
          >
            <I.Plus size={13} /> Check In
          </button>
          <button
            className="tb-btn primary"
            onClick={handleCheckOut}
            disabled={!asset || asset.status === "out"}
            title={asset ? `Check out ${asset.id}` : "Select an asset first"}
          >
            <I.Export size={13} /> Check Out
          </button>
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
                {filtered.map((a) => {
                  const rowIssues = issuesIndex.get(a.id);
                  const rowLevel = rowIssues?.some((i) => i.level === "error")
                    ? "error"
                    : rowIssues?.length
                      ? "warn"
                      : null;
                  return (
                  <tr
                    key={a.id}
                    data-active={selected === a.id ? "1" : "0"}
                    onClick={() => setSelected(a.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      {rowLevel && (
                        <span
                          className={`dot ${rowLevel}`}
                          title={rowIssues?.map((i) => i.title).join(" · ")}
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            marginRight: 6,
                            verticalAlign: "middle",
                            background:
                              rowLevel === "error" ? "var(--color-err)" : "var(--color-warn)",
                          }}
                        />
                      )}
                      {a.id}
                    </td>
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
                  );
                })}
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
          <span className="chip accent">{asset?.id ?? "—"}</span>
        </div>
        {!asset && (
          <div className="pane-body">
            <div className="empty" style={{ padding: 30 }}>
              <I.Inventory size={28} />
              <span className="mono" style={{ fontSize: 11, color: "var(--color-fg-faint)" }}>
                NO ASSET SELECTED
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--color-fg-faint)",
                  textAlign: "center",
                  maxWidth: 200,
                  lineHeight: 1.4,
                }}
              >
                Click a row in the list, or pick an issue on the left, to inspect.
              </span>
            </div>
          </div>
        )}
        {asset && (
          <div className="pane-body">
            <div className="readout">
              <div className="lbl">{asset.cat}</div>
              <div className="val" style={{ fontSize: 14 }}>{asset.model}</div>
            </div>
            {selectedIssues.length > 0 && (
              <>
                <div className="section-h">
                  <span>ISSUES</span>
                  <span className="line" />
                </div>
                <div style={{ padding: "0 12px" }}>
                  {selectedIssues.map((iss) => (
                    <div key={iss.id} className="issue-row" data-level={iss.level}>
                      <span className={`dot ${iss.level}`} />
                      <div>
                        <div className="title mono">{iss.title}</div>
                        <div className="detail">{iss.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="section-h"><span>IDENTITY</span><span className="line" /></div>
            <div style={{ padding: "0 12px" }}>
              <div className="fld">
                <span className="k">Model</span>
                <input
                  value={asset.model}
                  onChange={(e) => updateAsset(asset.id, { model: e.target.value })}
                />
              </div>
              <div className="fld">
                <span className="k">Category</span>
                <select
                  value={asset.cat}
                  onChange={(e) => updateAsset(asset.id, { cat: e.target.value })}
                >
                  {CAT_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="fld">
                <span className="k">Status</span>
                <select
                  value={asset.status}
                  onChange={(e) => updateAsset(asset.id, { status: e.target.value as AssetStatus })}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="fld">
                <span className="k">Utilization</span>
                <div className="unit-input" data-unit="%">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={asset.utilization}
                    onChange={(e) =>
                      updateAsset(asset.id, {
                        utilization: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="section-h"><span>ASSIGNMENT</span><span className="line" /></div>
            <div style={{ padding: "0 12px" }}>
              <div className="fld">
                <span className="k">Show</span>
                <input
                  value={asset.show}
                  onChange={(e) => updateAsset(asset.id, { show: e.target.value })}
                />
              </div>
              <div className="fld">
                <span className="k">Due back</span>
                <input
                  value={asset.due}
                  onChange={(e) => updateAsset(asset.id, { due: e.target.value })}
                />
              </div>
            </div>
            <div className="section-h"><span>MAINTENANCE</span><span className="line" /></div>
            <div style={{ padding: "0 12px" }}>
              <div className="fld">
                <span className="k">Last svc</span>
                <input
                  value={asset.last}
                  onChange={(e) => updateAsset(asset.id, { last: e.target.value })}
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>
            <div className="section-h"><span>ACTIONS</span><span className="line" /></div>
            <div style={{ padding: "0 12px 12px" }}>
              <button
                className="tb-btn danger"
                onClick={handleDecommission}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <I.Cross size={13} /> Decommission asset
              </button>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--color-fg-faint)",
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Removes {asset.id} from the fleet.
              </div>
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
