import { useState } from "react";
import { I } from "@/components/Icon";
import { PrintSheet } from "@/components/PrintSheet";
import { downloadCsv, stamp } from "@/lib/export-csv";
import { canDeleteShared } from "@/lib/ownership";
import { useAuth } from "@/store/useAuth";
import { useDevices } from "@/store/useDevices";
import { confirmDialog, promptDialog } from "@/store/useDialog";
import { newEntryId, useMaintenance, type KindFilter } from "@/store/useMaintenance";
import { newVenueId, useVenues } from "@/store/useVenues";
import type { MaintenanceKind } from "@/types";

const KINDS: MaintenanceKind[] = [
  "repair",
  "replace",
  "firmware",
  "config",
  "inspect",
  "calibrate",
];

// Severity reads left to right: a repair is a fault, an inspection is routine.
const KIND_CHIP: Record<MaintenanceKind, string> = {
  repair: "err",
  replace: "warn",
  firmware: "info",
  config: "info",
  calibrate: "accent",
  inspect: "",
};

function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

// An entry's `at` is a calendar day, not an instant — the picker is a date field
// and every readout slices the first ten characters off the UTC string. Anchor
// it at midday UTC so that slice returns the day the technician actually chose:
// local noon put UTC+13 on the previous day, and a plain `new Date()` did the
// same to anything logged after 11am there.
function dayStamp(day: string): string {
  return `${day}T12:00:00.000Z`;
}

function todayStamp(): string {
  const d = new Date();
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return dayStamp(local);
}

export function MaintenanceModule() {
  const venues = useVenues((s) => s.venues);
  const addVenue = useVenues((s) => s.addVenue);
  const updateVenue = useVenues((s) => s.updateVenue);
  const removeVenue = useVenues((s) => s.removeVenue);

  const devices = useDevices((s) => s.devices);
  const updateDevice = useDevices((s) => s.updateDevice);

  const venueOwners = useVenues((s) => s.owners);
  const entryOwners = useMaintenance((s) => s.owners);
  const myId = useAuth((s) => s.user?.id);

  const entries = useMaintenance((s) => s.entries);
  const addEntry = useMaintenance((s) => s.addEntry);
  const updateEntry = useMaintenance((s) => s.updateEntry);
  const removeEntry = useMaintenance((s) => s.removeEntry);
  const selectedVenueId = useMaintenance((s) => s.selectedVenueId);
  const setSelectedVenueId = useMaintenance((s) => s.setSelectedVenueId);
  const selectedEntryId = useMaintenance((s) => s.selectedEntryId);
  const setSelectedEntryId = useMaintenance((s) => s.setSelectedEntryId);
  const selectedDeviceId = useMaintenance((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useMaintenance((s) => s.setSelectedDeviceId);
  const kindFilter = useMaintenance((s) => s.kindFilter);
  const setKindFilter = useMaintenance((s) => s.setKindFilter);
  const openOnly = useMaintenance((s) => s.openOnly);
  const setOpenOnly = useMaintenance((s) => s.setOpenOnly);
  // In the store rather than local state so goto() can clear it when a linked
  // reference jumps here — otherwise the target row could land filtered out.
  const search = useMaintenance((s) => s.search);
  const setSearch = useMaintenance((s) => s.setSearch);

  const [assigning, setAssigning] = useState(false);

  const venue = venues.find((v) => v.id === selectedVenueId) ?? venues[0];
  const venueDevices = venue ? devices.filter((d) => d.venueId === venue.id) : [];
  // Everything not already here, which includes gear installed at *another*
  // venue — those rows name where they'd be moved from and confirm first.
  const assignable = venue ? devices.filter((d) => d.venueId !== venue.id) : [];
  const venueName = (id: string | undefined) => venues.find((v) => v.id === id)?.name;

  const venueEntries = venue ? entries.filter((e) => e.venueId === venue.id) : [];
  const q = search.trim().toLowerCase();
  const visible = venueEntries
    .filter((e) => (selectedDeviceId ? e.deviceId === selectedDeviceId : true))
    .filter((e) => (kindFilter === "all" ? true : e.kind === kindFilter))
    .filter((e) => (openOnly ? !e.resolved : true))
    .filter((e) => (q ? `${e.summary} ${e.who} ${e.body}`.toLowerCase().includes(q) : true))
    .sort((a, b) => b.at.localeCompare(a.at));

  const entry = venueEntries.find((e) => e.id === selectedEntryId);
  const deviceLabel = (id: string) => devices.find((d) => d.id === id)?.label ?? "(removed device)";

  const openCount = venueEntries.filter((e) => !e.resolved).length;
  const lastServiced = venueEntries.reduce((acc, e) => (e.at > acc ? e.at : acc), "");

  const handleNewVenue = async () => {
    const name = (await promptDialog("Venue name?"))?.trim();
    if (!name) return;
    const address = (await promptDialog("Address? (optional)", ""))?.trim() ?? "";
    const id = newVenueId();
    addVenue({ id, name, address, notes: "" });
    setSelectedVenueId(id);
  };

  const handleRenameVenue = async () => {
    if (!venue) return;
    const name = (await promptDialog("Venue name?", venue.name))?.trim();
    if (!name) return;
    updateVenue(venue.id, { name });
  };

  const handleDeleteVenue = async () => {
    if (!venue) return;
    const count = venueEntries.length;
    const ok = await confirmDialog(
      count > 0
        ? `Delete ${venue.name}? Its ${count} log ${count === 1 ? "entry" : "entries"} stay in storage but become unreachable.`
        : `Delete ${venue.name}?`,
      { danger: true, confirmLabel: "Delete" },
    );
    if (!ok) return;
    removeVenue(venue.id);
    setSelectedVenueId("");
  };

  // Installing gear that lives at another venue is a move, not an addition, so
  // it asks — the row is otherwise indistinguishable from unassigned stock.
  const assignDevice = async (id: string, label: string, from: string | undefined) => {
    if (!venue) return;
    if (from) {
      const ok = await confirmDialog(
        `${label} is installed at ${from}. Move it to ${venue.name}?`,
        { confirmLabel: "Move" },
      );
      if (!ok) return;
    }
    updateDevice(id, { venueId: venue.id });
    setAssigning(false);
  };

  const handleLogEntry = async () => {
    if (!venue || !selectedDeviceId) return;
    const summary = (await promptDialog("What was done?"))?.trim();
    if (!summary) return;
    addEntry({
      id: newEntryId(),
      venueId: venue.id,
      deviceId: selectedDeviceId,
      at: todayStamp(),
      who: useAuth.getState().user?.email ?? "",
      kind: "inspect",
      summary,
      body: "",
      resolved: true,
    });
    // The entry is selected by addEntry, but an active filter could still hide
    // its row — the same reason goto() clears these when following a link.
    setKindFilter("all");
    setOpenOnly(false);
    setSearch("");
  };

  const exportCsv = () => {
    if (!venue) return;
    downloadCsv(
      `${venue.name.replace(/\s+/g, "-").toLowerCase()}-maintenance-${stamp()}.csv`,
      ["DATE", "KIND", "DEVICE", "SERIAL", "SUMMARY", "WHO", "STATUS"],
      visible.map((e) => {
        const d = devices.find((x) => x.id === e.deviceId);
        return [
          dayOf(e.at),
          e.kind.toUpperCase(),
          d?.label ?? "",
          d?.serial ?? "",
          e.summary,
          e.who,
          e.resolved ? "RESOLVED" : "OPEN",
        ];
      }),
    );
  };

  return (
    <>
      <div className="left-pane">
        <div className="pane-hd">
          <span>VENUES</span>
          <span className="spacer" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            {venues.length}
          </span>
          <button className="icon-btn" title="New venue" onClick={handleNewVenue}>
            <I.Plus size={12} />
          </button>
        </div>
        <div style={{ flex: "0 0 auto", maxHeight: 220, overflow: "auto" }}>
          {venues.length === 0 && (
            <div
              className="mono"
              style={{ padding: "8px 12px", fontSize: 10, color: "var(--color-fg-faint)" }}
            >
              No venues yet. Create one to start a log.
            </div>
          )}
          {venues.map((v) => {
            const open = entries.filter((e) => e.venueId === v.id && !e.resolved).length;
            return (
              <div
                key={v.id}
                className="list-row"
                data-active={venue?.id === v.id ? "1" : "0"}
                onClick={() => setSelectedVenueId(v.id)}
              >
                <I.Pin size={12} />
                <span className="lbl">{v.name}</span>
                {open > 0 && <span className="chip warn">{open}</span>}
              </div>
            );
          })}
        </div>

        <div className="pane-hd">
          <span>DEVICES AT VENUE</span>
          <span className="spacer" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            {venueDevices.length}
          </span>
          <button
            className="icon-btn"
            title="Assign a device to this venue"
            disabled={!venue}
            onClick={() => setAssigning((a) => !a)}
          >
            <I.Plus size={12} />
          </button>
        </div>
        <div className="pane-body">
          {venue && assigning && (
            <>
              <div
                className="mono"
                style={{ padding: "6px 12px", fontSize: 10, color: "var(--color-fg-faint)" }}
              >
                {assignable.length === 0
                  ? "Every device is already here."
                  : "Pick a device to install here:"}
              </div>
              {assignable.map((d) => {
                const from = venueName(d.venueId);
                return (
                  <div
                    key={d.id}
                    className="list-row"
                    onClick={() => void assignDevice(d.id, d.label, from)}
                  >
                    <I.Plus size={12} />
                    <span className="lbl">{d.label}</span>
                    {/* Where it is now, so moving another venue's gear is a
                        visible decision rather than a silent side effect. */}
                    <span className="meta">{from ? `at ${from}` : d.model}</span>
                  </div>
                );
              })}
              <div style={{ padding: "6px 12px" }}>
                <button
                  className="tb-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setAssigning(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          {!assigning && venueDevices.length === 0 && (
            <div
              className="mono"
              style={{ padding: "8px 12px", fontSize: 10, color: "var(--color-fg-faint)" }}
            >
              {venue ? "No devices installed here yet." : "Select a venue first."}
            </div>
          )}
          {!assigning &&
            venueDevices.map((d) => {
              const count = venueEntries.filter((e) => e.deviceId === d.id).length;
              return (
                <div
                  key={d.id}
                  className="list-row"
                  data-active={selectedDeviceId === d.id ? "1" : "0"}
                  onClick={() => setSelectedDeviceId(selectedDeviceId === d.id ? "" : d.id)}
                >
                  <I.Inventory size={12} />
                  <span className="lbl">{d.label}</span>
                  <span className="meta">{count}</span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="center-pane">
        <div className="canvas-toolbar">
          <div className="tg">
            <button
              data-active={kindFilter === "all" ? "1" : "0"}
              onClick={() => setKindFilter("all")}
            >
              ALL
            </button>
            {KINDS.map((k) => (
              <button
                key={k}
                data-active={kindFilter === k ? "1" : "0"}
                onClick={() => setKindFilter(k as KindFilter)}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="divider-v" />
          <button
            className="tb-btn"
            data-active={openOnly ? "1" : "0"}
            onClick={() => setOpenOnly(!openOnly)}
            title="Show only unresolved entries"
          >
            <I.Eye size={13} /> Open only
          </button>
          <div className="search" style={{ flex: 1, border: 0, padding: 0 }}>
            <I.Search size={12} />
            <input
              placeholder={venue ? `Filter ${venueEntries.length} entries…` : "No venue selected"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="tb-btn primary"
            disabled={!venue || !selectedDeviceId}
            title={
              !venue
                ? "Select a venue first"
                : !selectedDeviceId
                  ? "Select the device you worked on"
                  : "Log a maintenance entry"
            }
            onClick={handleLogEntry}
          >
            <I.Plus size={13} /> Log Entry
          </button>
          <button className="tb-btn" disabled={visible.length === 0} onClick={exportCsv}>
            <I.Export size={13} /> CSV
          </button>
          <button
            className="tb-btn"
            disabled={visible.length === 0}
            onClick={() => window.print()}
          >
            <I.File size={13} /> Print
          </button>
        </div>

        {venue && (
          <div className="readout-grid">
            <div className="readout">
              <div className="lbl">ENTRIES</div>
              <div className="val">{venueEntries.length}</div>
            </div>
            <div className="readout">
              <div className="lbl">OPEN</div>
              <div className="val">{openCount}</div>
            </div>
            <div className="readout">
              <div className="lbl">DEVICES</div>
              <div className="val">{venueDevices.length}</div>
            </div>
            <div className="readout">
              <div className="lbl">LAST SERVICE</div>
              <div className="val">{lastServiced ? dayOf(lastServiced) : "—"}</div>
            </div>
          </div>
        )}

        {!venue ? (
          <div className="empty" style={{ padding: 30 }}>
            <I.Wrench size={28} />
            <div className="t">NO VENUE SELECTED</div>
            <div className="s">Create a venue in the left pane to start its maintenance log.</div>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty" style={{ padding: 30 }}>
            <I.Wrench size={28} />
            <div className="t">NO ENTRIES</div>
            <div className="s">
              {venueEntries.length === 0
                ? "Select a device at this venue and log the first entry."
                : "No entries match the current filters."}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>KIND</th>
                  <th>DEVICE</th>
                  <th>SUMMARY</th>
                  <th>WHO</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr
                    key={e.id}
                    data-active={selectedEntryId === e.id ? "1" : "0"}
                    onClick={() => setSelectedEntryId(e.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="mono">{dayOf(e.at)}</td>
                    <td>
                      <span className={`chip ${KIND_CHIP[e.kind]}`}>{e.kind.toUpperCase()}</span>
                    </td>
                    <td>{deviceLabel(e.deviceId)}</td>
                    <td>{e.summary}</td>
                    <td className={e.who ? "" : "muted"}>{e.who || "—"}</td>
                    <td>
                      <span className={`chip ${e.resolved ? "" : "warn"}`}>
                        {e.resolved ? "RESOLVED" : "OPEN"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {venue && (
          <PrintSheet
            title="Maintenance Log"
            subtitle={`${venue.name}${venue.address ? ` · ${venue.address}` : ""} · ${visible.length} entries`}
          >
            <table className="tbl">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>KIND</th>
                  <th>DEVICE</th>
                  <th>SERIAL</th>
                  <th>SUMMARY</th>
                  <th>WHO</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => {
                  const d = devices.find((x) => x.id === e.deviceId);
                  return (
                    <tr key={e.id}>
                      <td>{dayOf(e.at)}</td>
                      <td>{e.kind.toUpperCase()}</td>
                      <td>{d?.label ?? "—"}</td>
                      <td>{d?.serial || "—"}</td>
                      <td>{e.summary}</td>
                      <td>{e.who || "—"}</td>
                      <td>{e.resolved ? "RESOLVED" : "OPEN"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </PrintSheet>
        )}
      </div>

      <div className="right-pane">
        <div className="pane-hd">
          <span>{entry ? "LOG ENTRY" : "VENUE"}</span>
          <span className="spacer" />
          <span className="mono" style={{ fontSize: 10, color: "var(--color-fg-faint)" }}>
            {entry ? entry.id : (venue?.id ?? "")}
          </span>
        </div>

        {entry ? (
          <div className="pane-body">
            <div className="section-h">
              <span>RECORD</span>
              <span className="line" />
            </div>
            <div className="kv">
              <span className="k">Device</span>
              <span className="v">{deviceLabel(entry.deviceId)}</span>
              <span className="k">Venue</span>
              <span className="v">{venue?.name ?? "—"}</span>
            </div>

            <div className="fld">
              <span className="k">Date</span>
              <input
                type="date"
                value={dayOf(entry.at)}
                onChange={(ev) => {
                  const d = ev.target.value;
                  if (d) updateEntry(entry.id, { at: dayStamp(d) });
                }}
              />
            </div>
            <div className="fld">
              <span className="k">Kind</span>
              <select
                value={entry.kind}
                onChange={(ev) =>
                  updateEntry(entry.id, { kind: ev.target.value as MaintenanceKind })
                }
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <span className="k">Technician</span>
              <input
                value={entry.who}
                placeholder="Who did the work"
                onChange={(ev) => updateEntry(entry.id, { who: ev.target.value })}
              />
            </div>
            <div className="fld">
              <span className="k">Summary</span>
              <input
                value={entry.summary}
                onChange={(ev) => updateEntry(entry.id, { summary: ev.target.value })}
              />
            </div>

            <div className="section-h">
              <span>DETAIL</span>
              <span className="line" />
            </div>
            <div style={{ padding: "0 12px 8px" }}>
              <textarea
                className="insp-textarea"
                style={{ minHeight: 120 }}
                placeholder="Parts used, readings, follow-up…"
                value={entry.body}
                onChange={(ev) => updateEntry(entry.id, { body: ev.target.value })}
              />
            </div>

            <div style={{ padding: "0 12px 8px", display: "flex", gap: 6 }}>
              <button
                className="tb-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => updateEntry(entry.id, { resolved: !entry.resolved })}
              >
                {entry.resolved ? <I.Undo size={12} /> : <I.Check size={12} />}
                {entry.resolved ? " Reopen" : " Resolve"}
              </button>
              {canDeleteShared(entryOwners[entry.id], myId) && (
                <button
                  className="tb-btn danger"
                  onClick={async () => {
                    const ok = await confirmDialog("Delete this log entry?", {
                      danger: true,
                      confirmLabel: "Delete",
                    });
                    if (ok) removeEntry(entry.id);
                  }}
                >
                  <I.Cross size={12} /> Delete
                </button>
              )}
            </div>
          </div>
        ) : venue ? (
          <div className="pane-body">
            <div className="section-h">
              <span>VENUE</span>
              <span className="line" />
            </div>
            <div className="fld">
              <span className="k">Name</span>
              <input
                value={venue.name}
                onChange={(ev) => updateVenue(venue.id, { name: ev.target.value })}
              />
            </div>
            <div className="fld">
              <span className="k">Address</span>
              <input
                value={venue.address}
                placeholder="Street, city"
                onChange={(ev) => updateVenue(venue.id, { address: ev.target.value })}
              />
            </div>
            <div className="section-h">
              <span>NOTES</span>
              <span className="line" />
            </div>
            <div style={{ padding: "0 12px 8px" }}>
              <textarea
                className="insp-textarea"
                placeholder="Access, contacts, site quirks…"
                value={venue.notes}
                onChange={(ev) => updateVenue(venue.id, { notes: ev.target.value })}
              />
            </div>
            <div style={{ padding: "0 12px 8px", display: "flex", gap: 6 }}>
              <button
                className="tb-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleRenameVenue}
              >
                <I.Edit size={12} /> Rename
              </button>
              {canDeleteShared(venueOwners[venue.id], myId) && (
                <button className="tb-btn danger" onClick={handleDeleteVenue}>
                  <I.Cross size={12} /> Delete
                </button>
              )}
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
              Select an entry to edit it
            </div>
          </div>
        ) : (
          <div className="pane-body">
            <div className="empty" style={{ padding: 30 }}>
              <I.Pin size={28} />
              <div className="t">NO VENUE</div>
              <div className="s">Create a venue to begin.</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
