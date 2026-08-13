import { Fragment, useEffect } from "react";
import { DeviceLink } from "@/components/DeviceLink";
import { I } from "@/components/Icon";
import { PrintSheet } from "@/components/PrintSheet";
import { downloadCsv, stamp } from "@/lib/export-csv";
import { canDeleteShared } from "@/lib/ownership";
import { RACK_CATALOG, RACK_COLOR_MAP } from "@/lib/rack-data";
import { useApp } from "@/store/useApp";
import { useAuth } from "@/store/useAuth";
import { useCatalog } from "@/store/useCatalog";
import { alertDialog, confirmDialog, promptDialog } from "@/store/useDialog";
import type { RackColor, RackSize } from "@/types";
import { activeRackOf, fits, useRack } from "./store";

const U_HEIGHT = 14;
const RACK_W = 360;
const RACK_SIZES: RackSize[] = [24, 42, 48];
// Static load rating assumed for the shelf/rack until racks carry their own spec.
const RACK_SWL_KG = 800;
const RACK_SWL_WARN_KG = RACK_SWL_KG * 0.8;
// One 15A / 120V branch circuit, un-derated. The single source for both the
// power meter's circuit count and the inspector's circuit map.
const CIRCUIT_W = 1800;

// Colour a user-added device by its category, matching the built-in palette.
const CAT_COLOR: Record<string, RackColor> = {
  Processor: "accent",
  Compute: "accent",
  Switcher: "magenta",
  Signal: "magenta",
  Network: "info",
  Audio: "info",
  Power: "warn",
  Misc: "muted",
};

export function RackBuilderModule() {
  const canvasStyle = useApp((s) => s.tweaks.canvasStyle);
  const projectCode = useApp((s) => s.project.code);
  const racks = useRack((s) => s.racks);
  const rackId = useRack((s) => s.rackId);
  const setRackId = useRack((s) => s.setRackId);
  const addRack = useRack((s) => s.addRack);
  const removeRack = useRack((s) => s.removeRack);
  const updateRack = useRack((s) => s.updateRack);
  const rack = racks.find((r) => r.id === rackId) ?? racks[0];
  const items = rack.items;
  const rackSize = rack.size;
  const selectedIid = useRack((s) => s.selectedIid);
  const filter = useRack((s) => s.filter);
  const search = useRack((s) => s.search);
  const hoverPos = useRack((s) => s.hoverPos);
  const draggingId = useRack((s) => s.draggingId);
  const draggingIid = useRack((s) => s.draggingIid);
  const setSelectedIid = useRack((s) => s.setSelectedIid);
  const setRackSize = useRack((s) => s.setRackSize);
  const setFilter = useRack((s) => s.setFilter);
  const setSearch = useRack((s) => s.setSearch);
  const setHoverPos = useRack((s) => s.setHoverPos);
  const setDraggingId = useRack((s) => s.setDraggingId);
  const setDraggingIid = useRack((s) => s.setDraggingIid);
  const addItem = useRack((s) => s.addItem);
  const placeItem = useRack((s) => s.placeItem);
  const removeItem = useRack((s) => s.removeItem);
  const movePos = useRack((s) => s.movePos);
  const setItemDevice = useRack((s) => s.setItemDevice);
  const customRack = useCatalog((s) => s.rack);
  const addRackDef = useCatalog((s) => s.addRackDef);
  const removeRackDef = useCatalog((s) => s.removeRackDef);
  const catalogOwners = useCatalog((s) => s.owners);
  const myId = useAuth((s) => s.user?.id);

  // Elevation rows run top-of-rack down, the way a rack is read on site. A
  // device renders once at its topmost U and spans its height.
  const elevationRows = () => {
    const out: {
      u: number;
      def: (typeof RACK_CATALOG)[number] | null;
      span: number;
      covered: boolean;
    }[] = [];
    for (let u = rackSize; u >= 1; u--) {
      const item = items.find((i) => {
        const d = RACK_CATALOG.find((x) => x.id === i.id);
        return d ? u >= i.pos && u < i.pos + d.u : false;
      });
      const def = item ? RACK_CATALOG.find((d) => d.id === item.id) ?? null : null;
      if (item && def) {
        // Every U gets a row so the ruler stays continuous; the device cell is
        // emitted once at its topmost U and spans downward from there.
        const isTop = u === item.pos + def.u - 1;
        out.push({ u, def: isTop ? def : null, span: def.u, covered: !isTop });
      } else {
        out.push({ u, def: null, span: 1, covered: false });
      }
    }
    return out;
  };

  const rackRowsSorted = [...items]
    .map((i) => ({ item: i, def: RACK_CATALOG.find((d) => d.id === i.id) }))
    .filter((r): r is { item: typeof r.item; def: NonNullable<typeof r.def> } => r.def != null)
    .sort((a, b) => b.item.pos - a.item.pos);

  const exportRackCsv = () => {
    downloadCsv(
      `Blackburst-${projectCode}-${rack.id}-${stamp()}.csv`,
      ["Rack", "Location", "U", "Model", "Category", "U height", "Weight kg", "Power W", "Depth mm"],
      rackRowsSorted.map(({ item, def }) => [
        rack.name,
        rack.location,
        item.pos,
        def.model,
        def.cat,
        def.u,
        def.w,
        def.watts,
        def.depth,
      ]),
    );
  };

  // Shrinking past a mounted device used to leave it in a slot that no longer
  // exists: drawn outside the chassis, still counted in the totals, and absent
  // from the printed elevation. Refuse instead — nothing is moved or dropped.
  const changeRackSize = async (size: RackSize) => {
    if (size === rackSize) return;
    const above = items.filter((i) => {
      const d = RACK_CATALOG.find((x) => x.id === i.id);
      return d ? i.pos + d.u - 1 > size : false;
    });
    if (above.length > 0) {
      await alertDialog(
        `Can't switch ${rack.name} to ${size}U — ${above.length} ${
          above.length === 1 ? "device sits" : "devices sit"
        } above U${size}. Move or remove ${above.length === 1 ? "it" : "them"} first.`,
      );
      return;
    }
    setRackSize(size);
  };

  // A rack item can't be re-pointed at another model the way a wall can be
  // re-pointed at another panel — the slot maths depends on its U height — so an
  // in-use definition is refused rather than reassigned. Only the loaded
  // project can be checked; items elsewhere surface as MISSING MODEL.
  const removeEquipment = async (id: string, model: string) => {
    const uses = racks.reduce((n, r) => n + r.items.filter((i) => i.id === id).length, 0);
    if (uses > 0) {
      await alertDialog(
        `"${model}" is used by ${uses} rack ${uses === 1 ? "item" : "items"} in this project. Remove ${
          uses === 1 ? "it" : "them"
        } before deleting the model.`,
      );
      return;
    }
    const ok = await confirmDialog(
      `Remove custom equipment "${model}" from the catalog? Items in other projects that use it will show as a missing model.`,
      { danger: true, confirmLabel: "Remove" },
    );
    if (ok) removeRackDef(id);
  };

  const renameRack = async () => {
    const name = (await promptDialog("Rack name?", rack.name))?.trim();
    if (!name) return;
    const location = (await promptDialog("Location? (e.g. Stage Left, FOH)", rack.location))?.trim() ?? "";
    updateRack(rack.id, { name, location });
  };

  const addEquipment = async () => {
    const model = (await promptDialog("Model name?"))?.trim();
    if (!model) return;
    const cat = (await promptDialog("Category? (e.g. Processor, Switcher, Audio)", "Processor"))?.trim() || "Misc";
    const u = Math.max(1, Math.round(Number(await promptDialog("Rack units (U)?", "1")) || 1));
    const w = Math.max(0, Number(await promptDialog("Weight (kg)?", "0")) || 0);
    const watts = Math.max(0, Math.round(Number(await promptDialog("Power draw (W)?", "0")) || 0));
    const depth = Math.max(0, Math.round(Number(await promptDialog("Depth (mm)?", "0")) || 0));
    addRackDef({
      id: `custom-${Date.now().toString(36)}`,
      model,
      cat,
      u,
      w,
      watts,
      depth,
      color: CAT_COLOR[cat] ?? "muted",
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.tagName === "SELECT" ||
          tgt.isContentEditable)
      ) return;
      const state = useRack.getState();
      const iid = state.selectedIid;
      if (iid == null) return;
      const item = activeRackOf(state).items.find((i) => i.iid === iid);
      if (!item) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        state.removeItem(iid);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        state.movePos(iid, item.pos + 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        state.movePos(iid, item.pos - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cats = ["All", ...Array.from(new Set(RACK_CATALOG.map((c) => c.cat)))];
  const visibleCatalog = RACK_CATALOG.filter((c) => {
    if (filter !== "All" && c.cat !== filter) return false;
    if (search && !c.model.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalU = items.reduce((s, i) => {
    const d = RACK_CATALOG.find((x) => x.id === i.id);
    return s + (d?.u ?? 0);
  }, 0);
  const totalW = items.reduce((s, i) => {
    const d = RACK_CATALOG.find((x) => x.id === i.id);
    return s + (d?.w ?? 0);
  }, 0);
  const totalWatts = items.reduce((s, i) => {
    const d = RACK_CATALOG.find((x) => x.id === i.id);
    return s + (d?.watts ?? 0);
  }, 0);
  const maxDepth = items.reduce((m, i) => {
    const d = RACK_CATALOG.find((x) => x.id === i.id);
    return Math.max(m, d?.depth ?? 0);
  }, 0);
  const usedPct = Math.round((totalU / rackSize) * 100);
  // One figure feeds both the meter row and the inspector's circuit map. They
  // used to disagree: the meter counted 15A/120V circuits while the inspector
  // listed two fixed "L6-30" circuits capped at 2400W — an L6-30 is 30A/208V,
  // about 6.2kW, and 2400W is a 20A/120V circuit, so neither label matched.
  const circuits = Math.ceil(totalWatts / CIRCUIT_W);
  const amps208 = (totalWatts / 208).toFixed(1);
  const btu = Math.round(totalWatts * 3.412);

  const selected = items.find((i) => i.iid === selectedIid) ?? null;
  const selectedDef = selected ? RACK_CATALOG.find((d) => d.id === selected.id) : null;

  const movingItem = draggingIid != null ? items.find((i) => i.iid === draggingIid) : null;
  const movingDef = movingItem ? RACK_CATALOG.find((d) => d.id === movingItem.id) : null;
  const hoverDef = draggingId
    ? RACK_CATALOG.find((d) => d.id === draggingId) ?? null
    : movingDef;
  const hoverValid =
    hoverDef && hoverPos != null
      ? draggingIid != null
        ? fits(
            items.filter((i) => i.iid !== draggingIid),
            rackSize,
            hoverDef,
            hoverPos,
          )
        : fits(items, rackSize, hoverDef, hoverPos)
      : false;

  const byCat: Record<string, number> = {};
  for (const it of items) {
    const d = RACK_CATALOG.find((x) => x.id === it.id);
    if (!d) continue;
    byCat[d.cat] = (byCat[d.cat] ?? 0) + d.watts;
  }
  const maxByCat = Math.max(...Object.values(byCat), 1);

  return (
    <>
      <PrintSheet
        title="Rack Elevation"
        subtitle={`${rack.name}${rack.location ? ` · ${rack.location}` : ""} · ${rackSize}U`}
      >
        <h2>Elevation</h2>
        <table className="elev">
          <tbody>
            {elevationRows().map((r) => (
              <tr key={r.u}>
                <td className="u">{r.u}</td>
                {r.covered ? null : r.def ? (
                  <td className="dev" rowSpan={r.span}>
                    {r.def.model}
                    {r.span > 1 ? ` · ${r.span}U` : ""}
                  </td>
                ) : (
                  <td className="free">—</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Equipment</h2>
        <table className="print-tbl">
          <thead>
            <tr>
              <th>U</th>
              <th>Model</th>
              <th>Category</th>
              <th>Height</th>
              <th>Weight</th>
              <th>Power</th>
              <th>Depth</th>
            </tr>
          </thead>
          <tbody>
            {rackRowsSorted.map(({ item, def }) => (
              <tr key={item.iid}>
                <td className="num">{item.pos}</td>
                <td>{def.model}</td>
                <td>{def.cat}</td>
                <td className="num">{def.u}U</td>
                <td className="num">{def.w} kg</td>
                <td className="num">{def.watts} W</td>
                <td className="num">{def.depth} mm</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-summary">
          <div>
            <dt>Used</dt>
            <dd>
              {totalU}/{rackSize}U
            </dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{totalW.toFixed(1)} kg</dd>
          </div>
          <div>
            <dt>Power</dt>
            <dd>{(totalWatts / 1000).toFixed(2)} kW</dd>
          </div>
          <div>
            <dt>Max depth</dt>
            <dd>{maxDepth} mm</dd>
          </div>
        </div>
      </PrintSheet>

      {/* LEFT — Racks + equipment catalog */}
      <div className="left-pane">
        <div className="pane-hd">
          <span>RACKS</span>
          <span className="spacer" />
          <button className="icon-btn" aria-label="New rack" onClick={() => addRack()}>
            <I.Plus size={12} />
          </button>
        </div>
        <div style={{ flex: "0 0 auto" }}>
          {racks.map((r) => (
            <div
              key={r.id}
              className="list-row"
              data-active={r.id === rackId ? "1" : "0"}
              onClick={() => setRackId(r.id)}
            >
              <I.Rack size={13} />
              <span className="lbl">{r.name}</span>
              <span className="meta">
                {r.items.length} · {r.size}U
              </span>
              {racks.length > 1 && (
                <button
                  className="icon-btn"
                  aria-label={`Delete ${r.name}`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (
                      await confirmDialog(`Delete rack "${r.name}" and everything in it?`, {
                        danger: true,
                        confirmLabel: "Delete",
                      })
                    )
                      removeRack(r.id);
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
          <span>EQUIPMENT CATALOG</span>
          <span className="spacer" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            {visibleCatalog.length}
          </span>
          <button className="icon-btn" title="Add equipment" onClick={addEquipment}>
            <I.Plus size={12} />
          </button>
        </div>
        <div className="search">
          <I.Search size={12} />
          <input
            placeholder="Filter equipment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: "6px 10px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          {cats.map((c) => {
            const active = filter === c;
            return (
              <button
                key={c}
                className="tb-btn"
                style={{
                  padding: "2px 6px",
                  fontSize: 10,
                  background: active ? "var(--accent-faint)" : "transparent",
                  color: active ? "var(--accent)" : "var(--color-fg-mute)",
                  border: `1px solid ${active ? "var(--accent-dim)" : "var(--color-line-strong)"}`,
                }}
                onClick={() => setFilter(c)}
              >
                {c.toUpperCase()}
              </button>
            );
          })}
        </div>
        <div className="pane-body">
          {visibleCatalog.map((c) => {
            const col = RACK_COLOR_MAP[c.color];
            const isCustom = customRack.some((d) => d.id === c.id);
            return (
              <div
                key={c.id}
                className="list-row"
                draggable
                onDragStart={() => setDraggingId(c.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setHoverPos(null);
                }}
                onDoubleClick={() => addItem(c.id)}
                style={{
                  height: 40,
                  padding: "4px 10px",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 2,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      background: col.bg,
                      border: `1px solid ${col.bd}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: 8,
                      color: col.fg,
                    }}
                  >
                    {c.u}U
                  </span>
                  <span
                    className="lbl"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11.5,
                      color: "var(--color-fg)",
                    }}
                  >
                    {c.model}
                  </span>
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem(c.id);
                    }}
                  >
                    <I.Plus size={11} />
                  </button>
                  {isCustom && canDeleteShared(catalogOwners[c.id], myId) && (
                    <button
                      className="icon-btn"
                      title="Remove custom equipment"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEquipment(c.id, c.model);
                      }}
                    >
                      <I.Cross size={11} />
                    </button>
                  )}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    display: "flex",
                    gap: 8,
                    paddingLeft: 20,
                    color: "var(--color-fg-faint)",
                  }}
                >
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
            {RACK_SIZES.map((s) => (
              <button
                key={s}
                data-active={rackSize === s ? "1" : "0"}
                onClick={() => changeRackSize(s)}
              >
                {s}U
              </button>
            ))}
          </div>
          <div className="divider-v" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            RACK · {rack.id}
          </span>
          <button className="tb-btn" onClick={renameRack}>
            <I.Edit size={13} /> Rename
          </button>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            DRAG FROM CATALOG · ↕ TO REORDER
          </span>
          <div className="divider-v" />
          <button className="tb-btn" disabled={items.length === 0} onClick={exportRackCsv}>
            <I.Export size={13} /> CSV
          </button>
          <button className="tb-btn" disabled={items.length === 0} onClick={() => window.print()}>
            <I.Docs size={13} /> Print
          </button>
        </div>

        <div
          className="led-canvas"
          data-canvas-style={canvasStyle}
          style={{ cursor: "default" }}
        >
          <div className="canvas-overlay tl">
            <div className="row">
              <span className="k">RACK</span>
              <span className="v">
                {rack.name}
                {rack.location ? ` · ${rack.location}` : ""}
              </span>
            </div>
            <div className="row">
              <span className="k">SIZE</span>
              <span className="v">{rackSize}U · 600×1070mm</span>
            </div>
            <div className="row">
              <span className="k">SWL</span>
              <span className="v">{RACK_SWL_KG} kg static</span>
            </div>
          </div>
          <div className="canvas-overlay tr">
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <span className="k">USED</span>
              <span
                className="v"
                style={{ color: usedPct > 85 ? "var(--color-warn)" : "var(--accent)" }}
              >
                {usedPct}%
              </span>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <span className="k">FREE</span>
              <span className="v">{rackSize - totalU}U</span>
            </div>
          </div>

          <div className="canvas-stage" style={{ paddingTop: 30, paddingBottom: 30 }}>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              {/* Front rack view */}
              <div>
                <div
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--color-fg-faint)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  FRONT VIEW
                </div>
                <div
                  style={{
                    width: RACK_W + 56,
                    background: "var(--color-bg-1)",
                    border: "1px solid var(--color-line-strong)",
                    borderRadius: 2,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      height: 8,
                      background: "var(--color-bg-3)",
                      borderBottom: "1px solid var(--color-line-strong)",
                      marginBottom: 4,
                    }}
                  />
                  <div style={{ display: "flex", gap: 4 }}>
                    {/* Left U-numbers */}
                    <div
                      style={{
                        width: 22,
                        display: "flex",
                        flexDirection: "column",
                        fontFamily: "var(--font-mono)",
                        fontSize: 8,
                        color: "var(--color-fg-ghost)",
                      }}
                    >
                      {Array.from({ length: rackSize }).map((_, i) => {
                        const u = rackSize - i;
                        return (
                          <div
                            key={u}
                            style={{
                              height: U_HEIGHT,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              paddingRight: 3,
                              borderRight: "1px solid var(--color-line)",
                            }}
                          >
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
                        if (draggingIid != null && hoverPos != null) {
                          movePos(draggingIid, hoverPos);
                        } else if (draggingId && hoverPos != null) {
                          placeItem(draggingId, hoverPos);
                        }
                        setDraggingId(null);
                        setDraggingIid(null);
                        setHoverPos(null);
                      }}
                      style={{
                        position: "relative",
                        width: RACK_W,
                        height: rackSize * U_HEIGHT,
                        background: "var(--color-bg-2)",
                        border: "1px solid var(--color-line-strong)",
                        backgroundImage: `linear-gradient(var(--color-line-faint) 1px, transparent 1px)`,
                        backgroundSize: `100% ${U_HEIGHT}px`,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 6,
                          background: "var(--color-bg-3)",
                          borderRight: "1px solid var(--color-line-strong)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: 6,
                          background: "var(--color-bg-3)",
                          borderLeft: "1px solid var(--color-line-strong)",
                        }}
                      />
                      {Array.from({ length: rackSize }).map((_, i) => (
                        <Fragment key={i}>
                          <span
                            style={{
                              position: "absolute",
                              left: 1,
                              top: i * U_HEIGHT + U_HEIGHT / 2 - 1,
                              width: 4,
                              height: 2,
                              background: "var(--color-bg-0)",
                            }}
                          />
                          <span
                            style={{
                              position: "absolute",
                              right: 1,
                              top: i * U_HEIGHT + U_HEIGHT / 2 - 1,
                              width: 4,
                              height: 2,
                              background: "var(--color-bg-0)",
                            }}
                          />
                        </Fragment>
                      ))}

                      {/* Items */}
                      {items.map((it) => {
                        const def = RACK_CATALOG.find((d) => d.id === it.id);
                        // A custom model deleted from the shared catalog (possibly
                        // by another user) leaves its items behind. Draw them so
                        // they stay selectable and removable instead of becoming
                        // invisible ghosts that still occupy the bucket.
                        if (!def)
                          return (
                            <div
                              key={it.iid}
                              onClick={() => setSelectedIid(it.iid)}
                              style={{
                                position: "absolute",
                                left: 8,
                                right: 8,
                                top: (rackSize - it.pos) * U_HEIGHT,
                                height: U_HEIGHT - 1,
                                border: `1px dashed ${
                                  selectedIid === it.iid ? "var(--accent)" : "var(--color-err)"
                                }`,
                                background: "var(--color-bg-2)",
                                display: "flex",
                                alignItems: "center",
                                padding: "0 8px",
                                fontFamily: "var(--font-mono)",
                                fontSize: 9.5,
                                color: "var(--color-err)",
                                cursor: "pointer",
                                overflow: "hidden",
                              }}
                            >
                              MISSING MODEL · {it.id}
                            </div>
                          );
                        const col = RACK_COLOR_MAP[def.color];
                        const top = (rackSize - (it.pos + def.u - 1)) * U_HEIGHT;
                        const h = def.u * U_HEIGHT;
                        const isSel = selectedIid === it.iid;
                        return (
                          <div
                            key={it.iid}
                            draggable
                            onClick={() => setSelectedIid(it.iid)}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              setSelectedIid(it.iid);
                              setDraggingIid(it.iid);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", `iid:${it.iid}`);
                            }}
                            onDragEnd={() => {
                              setDraggingIid(null);
                              setHoverPos(null);
                            }}
                            style={{
                              position: "absolute",
                              left: 8,
                              right: 8,
                              top,
                              height: h - 1,
                              background: col.bg,
                              border: `1px solid ${isSel ? "var(--accent)" : col.bd}`,
                              boxShadow: isSel ? "0 0 0 1px var(--accent)" : "none",
                              display: "flex",
                              alignItems: "center",
                              padding: "0 8px",
                              gap: 8,
                              fontFamily: "var(--font-mono)",
                              fontSize: 9.5,
                              color: col.fg,
                              cursor: draggingIid === it.iid ? "grabbing" : "grab",
                              opacity: draggingIid === it.iid ? 0.4 : 1,
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{ width: 4, height: "70%", background: col.fg, opacity: 0.8 }}
                            />
                            <span
                              style={{
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontFamily: "var(--font-sans)",
                                fontSize: 11,
                                color: "var(--color-fg)",
                              }}
                            >
                              {def.model}
                            </span>
                            {def.u > 1 && (
                              <>
                                <span style={{ opacity: 0.7 }}>{def.watts}W</span>
                                <span style={{ opacity: 0.5 }}>·</span>
                              </>
                            )}
                            <span>{def.u}U</span>
                            {def.id === "vent" && (
                              <span
                                style={{
                                  position: "absolute",
                                  inset: 4,
                                  background:
                                    "repeating-linear-gradient(90deg, transparent 0 4px, var(--color-fg-ghost) 4px 5px)",
                                  opacity: 0.6,
                                  pointerEvents: "none",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}

                      {/* Drag preview */}
                      {hoverDef && hoverPos != null && (
                        <div
                          style={{
                            position: "absolute",
                            left: 8,
                            right: 8,
                            top: (rackSize - (hoverPos + hoverDef.u - 1)) * U_HEIGHT,
                            height: hoverDef.u * U_HEIGHT - 1,
                            border: `1.5px dashed ${
                              hoverValid ? "var(--accent)" : "var(--color-err)"
                            }`,
                            background: hoverValid
                              ? "var(--accent-faint)"
                              : "oklch(0.68 0.21 25 / 0.1)",
                            pointerEvents: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            color: hoverValid ? "var(--accent)" : "var(--color-err)",
                          }}
                        >
                          {hoverValid
                            ? draggingIid != null
                              ? `→ ${hoverDef.model} @ U${hoverPos}`
                              : `+ ${hoverDef.model} @ U${hoverPos}`
                            : "× SLOT OCCUPIED"}
                        </div>
                      )}
                    </div>
                    {/* Right U-numbers */}
                    <div
                      style={{
                        width: 22,
                        display: "flex",
                        flexDirection: "column",
                        fontFamily: "var(--font-mono)",
                        fontSize: 8,
                        color: "var(--color-fg-ghost)",
                      }}
                    >
                      {Array.from({ length: rackSize }).map((_, i) => {
                        const u = rackSize - i;
                        return (
                          <div
                            key={u}
                            style={{
                              height: U_HEIGHT,
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: 3,
                              borderLeft: "1px solid var(--color-line)",
                            }}
                          >
                            {u}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "var(--color-bg-3)",
                      borderTop: "1px solid var(--color-line-strong)",
                      marginTop: 4,
                    }}
                  />
                </div>
              </div>

              {/* Side profile */}
              <div>
                <div
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--color-fg-faint)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  SIDE PROFILE
                </div>
                <div
                  style={{
                    width: 80,
                    background: "var(--color-bg-1)",
                    border: "1px solid var(--color-line-strong)",
                    borderRadius: 2,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      height: 8,
                      background: "var(--color-bg-3)",
                      marginBottom: 4,
                      borderBottom: "1px solid var(--color-line-strong)",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      height: rackSize * U_HEIGHT,
                      background: "var(--color-bg-2)",
                      border: "1px solid var(--color-line-strong)",
                    }}
                  >
                    {items.map((it) => {
                      const def = RACK_CATALOG.find((d) => d.id === it.id);
                      if (!def) return null;
                      const col = RACK_COLOR_MAP[def.color];
                      const top = (rackSize - (it.pos + def.u - 1)) * U_HEIGHT;
                      const h = def.u * U_HEIGHT;
                      const dpct = def.depth ? def.depth / 1070 : 0;
                      return (
                        <div
                          key={it.iid}
                          onClick={() => setSelectedIid(it.iid)}
                          style={{
                            position: "absolute",
                            left: 1,
                            top,
                            height: h - 1,
                            width: `${Math.max(8, dpct * 100)}%`,
                            background: col.bg,
                            border: `1px solid ${
                              selectedIid === it.iid ? "var(--accent)" : col.bd
                            }`,
                          }}
                        />
                      );
                    })}
                    <div
                      style={{
                        position: "absolute",
                        right: 1,
                        top: 0,
                        bottom: 0,
                        borderLeft: "1px dashed var(--color-line-strong)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "var(--color-bg-3)",
                      marginTop: 4,
                      borderTop: "1px solid var(--color-line-strong)",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      color: "var(--color-fg-faint)",
                      textAlign: "center",
                    }}
                  >
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
            <div
              className="v"
              style={{ color: usedPct > 85 ? "var(--color-warn)" : "var(--accent)" }}
            >
              {totalU}
              <span style={{ fontSize: 10, color: "var(--color-fg-faint)", marginLeft: 4 }}>
                / {rackSize}U
              </span>
            </div>
            <div className="bar">
              <div
                className="bar-fill"
                style={{
                  width: `${usedPct}%`,
                  background: usedPct > 85 ? "var(--color-warn)" : "var(--accent)",
                }}
              />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
              {rackSize - totalU}U free · {items.length} devices
            </div>
          </div>
          <div className="meter-block">
            <div className="h">WEIGHT</div>
            <div
              className="v"
              style={{ color: totalW > RACK_SWL_WARN_KG ? "var(--color-warn)" : "var(--color-fg)" }}
            >
              {totalW.toFixed(1)}
              <span style={{ fontSize: 10, color: "var(--color-fg-faint)", marginLeft: 4 }}>
                kg
              </span>
            </div>
            <div className="bar">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min(100, (totalW / RACK_SWL_KG) * 100)}%`,
                  background: totalW > RACK_SWL_WARN_KG ? "var(--color-warn)" : "var(--accent)",
                }}
              />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
              SWL {RACK_SWL_KG}kg · {Math.round((totalW / RACK_SWL_KG) * 100)}% loaded
            </div>
          </div>
          <div className="meter-block">
            <div className="h">POWER DRAW</div>
            <div className="v warn">
              {(totalWatts / 1000).toFixed(2)}
              <span style={{ fontSize: 10, color: "var(--color-fg-faint)", marginLeft: 4 }}>
                kW
              </span>
            </div>
            <div className="bar-stack">
              <div
                className="bar-seg"
                style={{
                  width: `${Math.min(100, (totalWatts / 8000) * 100)}%`,
                  background: "var(--color-warn)",
                }}
              />
              <div
                className="bar-seg"
                style={{
                  width: `${Math.max(0, 100 - (totalWatts / 8000) * 100)}%`,
                  background: "var(--color-bg-3)",
                }}
              />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
              {circuits} × 15A · {amps208}A @ 208V
            </div>
          </div>
          <div className="meter-block">
            <div className="h">THERMAL · BTU/h</div>
            <div className="v">
              {btu.toLocaleString()}
              <span style={{ fontSize: 10, color: "var(--color-fg-faint)", marginLeft: 4 }}>
                BTU/h
              </span>
            </div>
            <div className="bar">
              <div
                className="bar-fill"
                style={{ width: `${Math.min(100, (btu / 30000) * 100)}%` }}
              />
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
              ≈ {(btu / 12000).toFixed(2)} ton AC · airflow F→B
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — inspector */}
      <div className="right-pane">
        <div className="pane-hd">
          <span>RACK INSPECTOR</span>
          <span className="spacer" />
          <span className="chip accent">{rack.id}</span>
        </div>

        {selected && selectedDef ? (
          <div className="pane-body">
            <div className="readout accent">
              <div className="lbl">
                SELECTED · U{selected.pos}
                {selectedDef.u > 1 ? `–${selected.pos + selectedDef.u - 1}` : ""}
              </div>
              <div
                className="val"
                style={{ fontSize: 14, color: RACK_COLOR_MAP[selectedDef.color].fg }}
              >
                {selectedDef.model}
              </div>
            </div>
            <div className="readout-grid">
              <div className="readout">
                <div className="lbl">Size</div>
                <div className="val">
                  {selectedDef.u}
                  <span className="unit">U</span>
                </div>
              </div>
              <div className="readout">
                <div className="lbl">Depth</div>
                <div className="val">
                  {selectedDef.depth}
                  <span className="unit">mm</span>
                </div>
              </div>
            </div>
            <div className="section-h">
              <span>SPECIFICATION</span>
              <span className="line" />
            </div>
            <div className="kv">
              <span className="k">Category</span>
              <span className="v">{selectedDef.cat}</span>
              <span className="k">Weight</span>
              <span className="v">{selectedDef.w} kg</span>
              <span className="k">Power</span>
              <span className="v">{selectedDef.watts} W</span>
            </div>

            <DeviceLink
              deviceId={selected.deviceId}
              onChange={(id) => setItemDevice(selected.iid, id)}
              defaultLabel={selectedDef.model}
              model={selectedDef.model}
              omit={{ kind: "rack-item", id: `${rack.id}:${selected.iid}` }}
            />

            <div className="section-h">
              <span>POSITION</span>
              <span className="line" />
            </div>
            <div className="fld" style={{ gridTemplateColumns: "90px 1fr 60px 60px" }}>
              <span className="k">U slot</span>
              <input
                type="number"
                value={selected.pos}
                min={1}
                max={rackSize - selectedDef.u + 1}
                onChange={(e) => movePos(selected.iid, Number(e.target.value))}
              />
              <button className="tb-btn" onClick={() => movePos(selected.iid, selected.pos + 1)}>
                ↑
              </button>
              <button className="tb-btn" onClick={() => movePos(selected.iid, selected.pos - 1)}>
                ↓
              </button>
            </div>

            <div style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
              <button
                className="tb-btn danger"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => removeItem(selected.iid)}
              >
                <I.Cross size={12} /> Remove
              </button>
            </div>
            <div
              className="mono"
              style={{
                padding: "0 12px 8px",
                fontSize: 10,
                color: "var(--color-fg-faint)",
                textAlign: "center",
              }}
            >
              ↑ / ↓ nudge · DEL removes · drag to reslot
            </div>
          </div>
        ) : selected ? (
          <div className="pane-body">
            <div className="readout">
              <div className="lbl">SELECTED · U{selected.pos}</div>
              <div className="val" style={{ fontSize: 14, color: "var(--color-err)" }}>
                Missing model
              </div>
            </div>
            <div className="kv">
              <span className="k">Model id</span>
              <span className="v mono">{selected.id}</span>
            </div>
            <div style={{ padding: "8px 12px", fontSize: 11, color: "var(--color-fg-mute)" }}>
              This model is no longer in the equipment catalog, so its specification —
              height, weight, power and depth — is gone and it counts for nothing in the
              rack totals. Remove the item, or re-add the model to the catalog.
            </div>
            <div style={{ padding: "0 12px 8px" }}>
              <button
                className="tb-btn danger"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => removeItem(selected.iid)}
              >
                <I.Cross size={12} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="pane-body">
            <div className="empty" style={{ padding: 30 }}>
              <I.Inventory size={28} />
              <span className="mono" style={{ fontSize: 11, color: "var(--color-fg-faint)" }}>
                SELECT A DEVICE
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
                Drag from the catalog or double-click a row to auto-place. Click a placed device to inspect.
              </span>
            </div>
          </div>
        )}

        <div className="pane-hd">
          <span>POWER BUDGET</span>
        </div>
        <div className="pane-body">
          {Object.entries(byCat).map(([k, v]) => (
            <div
              key={k}
              className="fld"
              style={{ gridTemplateColumns: "70px 1fr 60px" }}
            >
              <span className="k">{k}</span>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${(v / maxByCat) * 100}%` }} />
              </div>
              <span className="num" style={{ textAlign: "right" }}>
                {v}W
              </span>
            </div>
          ))}
          <div className="section-h">
            <span>CIRCUIT MAP</span>
            <span className="line" />
          </div>
          {circuits === 0 ? (
            <div
              className="mono"
              style={{ padding: "0 12px 8px", fontSize: 10, color: "var(--color-fg-faint)" }}
            >
              Nothing drawing power in this rack yet.
            </div>
          ) : (
            <div className="kv">
              {/* As many circuits as the load actually needs, filled in order —
                  the fixed pair of rows hid everything above 4800W. */}
              {Array.from({ length: circuits }).map((_, i) => {
                const load = Math.min(CIRCUIT_W, totalWatts - i * CIRCUIT_W);
                return (
                  <Fragment key={i}>
                    <span className="k">15A #{i + 1}</span>
                    <span className="v" style={i === 0 ? { color: "var(--accent)" } : undefined}>
                      {Math.round(load)}W / {CIRCUIT_W}W
                    </span>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
