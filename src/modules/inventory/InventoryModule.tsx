import { memo, useMemo, useState } from "react";
import { DeviceLink } from "@/components/DeviceLink";
import { I } from "@/components/Icon";
import { ASSET_CATEGORIES, INV_MODELS } from "@/lib/inventory-data";
import { canDeleteShared } from "@/lib/ownership";
import { useAuth } from "@/store/useAuth";
import { useCatalog } from "@/store/useCatalog";
import { alertDialog, confirmDialog, promptDialog } from "@/store/useDialog";
import type { Asset, AssetStatus, ShowSchedule } from "@/types";
import { useInventory } from "./store";
import { issuesByAsset, summarizeAssetIssues, validateAssets } from "./validation";

const CAT_OPTIONS = ASSET_CATEGORIES.filter((c) => c.name !== "All gear").map((c) => c.name);
const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "in", label: "IN" },
  { value: "out", label: "OUT" },
  { value: "maint", label: "MAINT" },
];

// A show's start/end are 1-based day positions in this window, not dates.
const SCHEDULE_DAYS = 14;

function clampDay(raw: string, fallback: number): number {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(SCHEDULE_DAYS, n));
}

function nextShowId(shows: ShowSchedule[]): string {
  let n = 1;
  while (shows.some((s) => s.id === `SH-${n}`)) n++;
  return `SH-${n}`;
}

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
  const shows = useInventory((s) => s.shows);
  const addShow = useInventory((s) => s.addShow);
  const updateShow = useInventory((s) => s.updateShow);
  const removeShow = useInventory((s) => s.removeShow);
  const invModels = useCatalog((s) => s.inv);
  const addInvModel = useCatalog((s) => s.addInvModel);
  const removeInvModel = useCatalog((s) => s.removeInvModel);
  const catalogOwners = useCatalog((s) => s.owners);
  const myId = useAuth((s) => s.user?.id);
  const [filter, setFilter] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const modelQuery = modelSearch.trim().toLowerCase();
  const visibleModels = modelQuery
    ? INV_MODELS.filter(
        (m) => m.model.toLowerCase().includes(modelQuery) || m.cat.toLowerCase().includes(modelQuery),
      )
    : INV_MODELS;

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
  const sidebarCats = useMemo(() => {
    const extra = [...new Set(assets.map((a) => a.cat))]
      .filter((c) => !CAT_OPTIONS.includes(c))
      .sort((x, y) => x.localeCompare(y));
    return [...CAT_OPTIONS, ...extra];
  }, [assets]);
  const allIssues = useMemo(() => validateAssets(assets, shows), [assets, shows]);
  const issuesIndex = useMemo(() => issuesByAsset(allIssues), [allIssues]);
  const issuesSummary = summarizeAssetIssues(allIssues);
  const selectedIssues = asset ? issuesIndex.get(asset.id) ?? [] : [];

  const handleCheckIn = () => {
    if (!asset) return;
    if (asset.status === "in") return;
    checkIn(asset.id);
  };
  const handleCheckOut = async () => {
    if (!asset) return;
    if (asset.status === "out") return;
    const show = (await promptDialog(`Check out ${asset.id} — show / job name?`, asset.show !== "—" ? asset.show : ""))?.trim();
    if (!show) return;
    const due = (await promptDialog(`Due back date (e.g. "Apr 28")?`, asset.due !== "—" ? asset.due : ""))?.trim();
    if (!due) return;
    checkOut(asset.id, show, due);
  };
  // Create a unit of a known model: category is already resolved, so only the
  // serial/asset ID is prompted (with a suggested default derived from the model).
  const createUnit = async (model: string, catName: string) => {
    const base =
      model
        .split(/\s+/)
        .map((w) => w.replace(/[^A-Za-z0-9]/g, ""))
        .filter(Boolean)
        .join("-")
        .toUpperCase() || "ASSET";
    const n = assets.filter((a) => a.model === model).length + 1;
    const id = (await promptDialog("Asset ID / serial?", `${base}-${String(n).padStart(3, "0")}`))?.trim();
    if (!id) return;
    if (assets.some((a) => a.id === id)) {
      await alertDialog(`Asset ID "${id}" already exists.`);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    addAsset({ id, model, cat: catName, status: "in", show: "—", due: "—", utilization: 0, last: today });
    setSelected(id);
  };

  const handleNewAsset = async () => {
    const model = (await promptDialog("Model? (a known model auto-fills its category)"))?.trim();
    if (!model) return;
    const known = INV_MODELS.find((m) => m.model.toLowerCase() === model.toLowerCase());
    let catName: string;
    if (known) {
      catName = known.cat;
    } else {
      const entered = (await promptDialog("Category?", CAT_OPTIONS[0]))?.trim();
      if (!entered) return;
      catName = entered;
      // Remember the new model in the shared catalog for next time.
      addInvModel({ id: `im-custom-${Date.now().toString(36)}`, model, cat: catName });
    }
    await createUnit(model, catName);
  };

  const handleAddModel = async () => {
    const model = (await promptDialog("Model name?"))?.trim();
    if (!model) return;
    if (INV_MODELS.some((m) => m.model.toLowerCase() === model.toLowerCase())) {
      await alertDialog(`Model "${model}" is already in the catalog.`);
      return;
    }
    const catName = (await promptDialog("Category?", CAT_OPTIONS[0]))?.trim();
    if (!catName) return;
    addInvModel({ id: `im-custom-${Date.now().toString(36)}`, model, cat: catName });
  };

  const handleRemoveModel = async (id: string, model: string) => {
    const ok = await confirmDialog(`Remove model "${model}" from the catalog? Existing assets are unaffected.`, {
      danger: true,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    removeInvModel(id);
  };
  const handleDecommission = async () => {
    if (!asset) return;
    const ok = await confirmDialog(`Decommission ${asset.id} (${asset.model})? This removes it from the fleet.`, {
      danger: true,
      confirmLabel: "Decommission",
    });
    if (!ok) return;
    const idx = filtered.findIndex((a) => a.id === asset.id);
    const fallback = filtered[idx + 1]?.id ?? filtered[idx - 1]?.id ?? assets.find((a) => a.id !== asset.id)?.id ?? "";
    removeAsset(asset.id);
    setSelected(fallback);
  };
  const handleNewShow = async () => {
    const name = (await promptDialog("Show / job name?"))?.trim();
    if (!name) return;
    const startRaw = await promptDialog("Start day (1–14)?", "1");
    if (startRaw === null) return;
    const endRaw = await promptDialog("End day (1–14)?", "6");
    if (endRaw === null) return;
    const start = clampDay(startRaw, 1);
    // Inclusive days, so end === start is a legitimate one-day show.
    const end = Math.max(start, clampDay(endRaw, start));
    addShow({ id: nextShowId(shows), name, start, end, pct: 0 });
  };
  const handleEditShow = async (show: ShowSchedule) => {
    const name = (await promptDialog("Show / job name?", show.name))?.trim();
    if (!name) return;
    const startRaw = await promptDialog("Start day (1–14)?", String(show.start));
    if (startRaw === null) return;
    const endRaw = await promptDialog("End day (1–14)?", String(show.end));
    if (endRaw === null) return;
    const pctRaw = await promptDialog("Utilization %?", String(show.pct));
    if (pctRaw === null) return;
    const start = clampDay(startRaw, show.start);
    const end = Math.max(start, clampDay(endRaw, show.end));
    const pct = Math.max(0, Math.min(100, Math.round(Number(pctRaw)) || 0));
    updateShow(show.id, { name, start, end, pct });
  };
  const handleRemoveShow = async (show: ShowSchedule) => {
    const ok = await confirmDialog(`Remove show "${show.name}"?`, { danger: true, confirmLabel: "Remove" });
    if (!ok) return;
    removeShow(show.id);
  };

  const avgUtilization =
    assets.length > 0
      ? Math.round(assets.reduce((s, a) => s + a.utilization, 0) / assets.length)
      : 0;

  return (
    <>
      <datalist id="asset-cats">
        {sidebarCats.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="left-pane">
        <div className="pane-hd"><span>CATEGORIES</span></div>
        <div style={{ flex: "0 0 auto" }}>
          {["All gear", ...sidebarCats].map((name) => {
            const live = name === "All gear" ? assets.length : countByCat.get(name) ?? 0;
            return (
              <div
                key={name}
                className="list-row"
                data-active={cat === name ? "1" : "0"}
                onClick={() => setCat(name)}
              >
                <I.Folder size={12} />
                <span className="lbl">{name}</span>
                <span className="meta">{live}</span>
              </div>
            );
          })}
        </div>
        <div className="pane-hd">
          <span>MODEL CATALOG</span>
          <span className="spacer" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            {visibleModels.length}
          </span>
          <button className="icon-btn" title="Add model to catalog" onClick={handleAddModel}>
            <I.Plus size={12} />
          </button>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input
            placeholder="Search models…"
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: "0 0 auto", maxHeight: 176, overflow: "auto" }}>
          {visibleModels.map((m) => {
            const isCustom = invModels.some((c) => c.id === m.id);
            return (
              <div
                key={m.id}
                className="list-row"
                title={`Add a unit of ${m.model}`}
                style={{ cursor: "pointer" }}
                onClick={() => createUnit(m.model, m.cat)}
              >
                <I.Inventory size={12} />
                <span className="lbl">{m.model}</span>
                <span className="meta">{m.cat}</span>
                {isCustom && canDeleteShared(catalogOwners[m.id], myId) && (
                  <button
                    className="icon-btn"
                    title="Remove model"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveModel(m.id, m.model);
                    }}
                  >
                    <I.Cross size={11} />
                  </button>
                )}
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
                  return (
                    <AssetRow
                      key={a.id}
                      asset={a}
                      active={selected === a.id}
                      level={
                        rowIssues?.some((i) => i.level === "error")
                          ? "error"
                          : rowIssues?.length
                            ? "warn"
                            : null
                      }
                      issueTitles={rowIssues?.map((i) => i.title).join(" · ")}
                      onSelect={setSelected}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {view === "schedule" && (
          <div style={{ flex: 1, overflow: "auto", background: "var(--color-bg-2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr" }}>
              <div className="pane-hd" style={{ borderBottom: "1px solid var(--color-line)" }}>
                <span>SHOW</span>
                <span className="spacer" />
                <button className="icon-btn" onClick={handleNewShow} title="New show">
                  <I.Plus size={12} />
                </button>
              </div>
              {/* Day positions, not dates. A show stores start/end as offsets in a
                  14-day window and carries no calendar date, so the old axis
                  invented one — it read 28/04–11/05 whatever today was. */}
              <div className="gantt-hdr">
                {Array.from({ length: SCHEDULE_DAYS }).map((_, i) => (
                  <div key={i} className="gantt-hdr-cell">
                    D{i + 1}
                  </div>
                ))}
              </div>
              {shows.map((s) => (
                <GanttRow key={s.id} show={s} onEdit={handleEditShow} onRemove={handleRemoveShow} />
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
                <input
                  list="asset-cats"
                  value={asset.cat}
                  onChange={(e) => updateAsset(asset.id, { cat: e.target.value })}
                />
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
            <DeviceLink
              deviceId={asset.deviceId}
              onChange={(id) => updateAsset(asset.id, { deviceId: id })}
              defaultLabel={asset.model}
              model={asset.model}
              omit={{ kind: "asset", id: asset.id }}
            />

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

// Memoized because editing one asset in the inspector re-rendered every row —
// ~37ms per keystroke at 300 assets. The issue list is passed as a level plus a
// tooltip string rather than the array itself: validateAssets rebuilds that
// array on every keystroke, so passing it would defeat the memo for all rows.
// `asset` is safe to compare by identity — updateAsset replaces only the one it
// edits — and `onSelect` is the store action, which is stable.
const AssetRow = memo(function AssetRow({
  asset: a,
  active,
  level,
  issueTitles,
  onSelect,
}: {
  asset: Asset;
  active: boolean;
  level: "error" | "warn" | null;
  issueTitles: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <tr
      data-active={active ? "1" : "0"}
      onClick={() => onSelect(a.id)}
      style={{ cursor: "pointer" }}
    >
      <td>
        {level && (
          <span
            className={`dot ${level}`}
            title={issueTitles}
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              marginRight: 6,
              verticalAlign: "middle",
              background: level === "error" ? "var(--color-err)" : "var(--color-warn)",
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
});

function GanttRow({
  show: s,
  onEdit,
  onRemove,
}: {
  show: ShowSchedule;
  onEdit: (show: ShowSchedule) => void;
  onRemove: (show: ShowSchedule) => void;
}) {
  const borderColor =
    s.kind === "maint" ? "var(--color-err)" : s.kind === "warn" ? "var(--color-warn)" : "var(--color-line-strong)";
  return (
    <>
      <div className="gantt-label">
        <span className="chip" style={{ borderColor }}>{s.id}</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {s.name}
        </span>
        <span className="gantt-actions">
          <button type="button" title="Edit show" onClick={() => onEdit(s)}>
            <I.Edit size={11} />
          </button>
          <button type="button" title="Remove show" onClick={() => onRemove(s)}>
            <I.Cross size={11} />
          </button>
        </span>
      </div>
      <div className="gantt-track">
        <div
          className={`gantt-bar ${s.kind ?? ""}`}
          style={{
            // Days are 1-based and inclusive: day 1 is the first column, and a
            // show ending on day 6 covers day 6. The bar used to be offset by
            // start/14, which drew a day-1 show over the day-2 column. Shows
            // saved before the day range was clamped can hold 0, so normalise.
            left: `${((Math.max(1, s.start) - 1) / SCHEDULE_DAYS) * 100}%`,
            width: `${((Math.max(s.start, s.end) - Math.max(1, s.start) + 1) / SCHEDULE_DAYS) * 100}%`,
          }}
        >
          {s.name} · {s.pct}%
        </div>
      </div>
    </>
  );
}
