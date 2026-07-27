import { create } from "zustand";
import { DEFAULT_RACKS, RACK_CATALOG } from "@/lib/rack-data";
import type { Rack, RackItem, RackSize } from "@/types";

interface RackState {
  racks: Rack[];
  rackId: string;
  selectedIid: number | null;
  filter: string;
  search: string;
  hoverPos: number | null;
  draggingId: string | null;
  draggingIid: number | null;

  setItems: (items: RackItem[]) => void;
  setSelectedIid: (iid: number | null) => void;
  setRackSize: (s: RackSize) => void;
  setFilter: (f: string) => void;
  setSearch: (s: string) => void;
  setHoverPos: (p: number | null) => void;
  setDraggingId: (id: string | null) => void;
  setDraggingIid: (iid: number | null) => void;

  setRackId: (id: string) => void;
  addRack: () => void;
  removeRack: (id: string) => void;
  updateRack: (id: string, patch: Partial<Omit<Rack, "id">>) => void;

  addItem: (id: string) => void;
  placeItem: (id: string, pos: number) => boolean;
  removeItem: (iid: number) => void;
  movePos: (iid: number, pos: number) => void;
  setItemDevice: (iid: number, deviceId: string | undefined) => void;
}

function buildUsedSlots(items: RackItem[]): Set<number> {
  const used = new Set<number>();
  for (const it of items) {
    const def = RACK_CATALOG.find((d) => d.id === it.id);
    if (!def) continue;
    for (let u = it.pos; u < it.pos + def.u; u++) used.add(u);
  }
  return used;
}

function findSlotFor(items: RackItem[], rackSize: number, defU: number): number | null {
  const used = buildUsedSlots(items);
  for (let u = 1; u <= rackSize - defU + 1; u++) {
    let ok = true;
    for (let k = u; k < u + defU; k++) {
      if (used.has(k)) {
        ok = false;
        break;
      }
    }
    if (ok) return u;
  }
  return null;
}

function fits(items: RackItem[], rackSize: number, def: { u: number }, pos: number): boolean {
  if (pos < 1 || pos + def.u - 1 > rackSize) return false;
  const used = buildUsedSlots(items);
  for (let k = pos; k < pos + def.u; k++) if (used.has(k)) return false;
  return true;
}

// Item ids only need to be unique within their own rack — items live inside one.
function nextIid(items: RackItem[]): number {
  return items.reduce((m, i) => Math.max(m, i.iid), 0) + 1;
}

function nextRackId(racks: Rack[]): string {
  let n = racks.length + 1;
  while (racks.some((r) => r.id === `R-${String(n).padStart(3, "0")}`)) n++;
  return `R-${String(n).padStart(3, "0")}`;
}

export function activeRackOf(s: { racks: Rack[]; rackId: string }): Rack {
  return s.racks.find((r) => r.id === s.rackId) ?? s.racks[0];
}

export const useRack = create<RackState>()((set, get) => ({
  racks: DEFAULT_RACKS,
  rackId: DEFAULT_RACKS[0].id,
  selectedIid: null,
  filter: "All",
  search: "",
  hoverPos: null,
  draggingId: null,
  draggingIid: null,

  setSelectedIid: (selectedIid) => set({ selectedIid }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setHoverPos: (hoverPos) => set({ hoverPos }),
  setDraggingId: (draggingId) => set({ draggingId }),
  setDraggingIid: (draggingIid) => set({ draggingIid }),

  setItems: (items) =>
    set((s) => ({ racks: s.racks.map((r) => (r.id === s.rackId ? { ...r, items } : r)) })),

  setRackSize: (size) =>
    set((s) => ({ racks: s.racks.map((r) => (r.id === s.rackId ? { ...r, size } : r)) })),

  setRackId: (rackId) => set({ rackId, selectedIid: null }),

  addRack: () =>
    set((s) => {
      const id = nextRackId(s.racks);
      const rack: Rack = {
        id,
        name: `Rack ${s.racks.length + 1}`,
        location: "",
        size: 42,
        items: [],
      };
      return { racks: [...s.racks, rack], rackId: id, selectedIid: null };
    }),

  // Mirrors the wall builder: the module always keeps at least one rack so the
  // canvas never has nothing to draw.
  removeRack: (id) =>
    set((s) => {
      if (s.racks.length <= 1) return s;
      const racks = s.racks.filter((r) => r.id !== id);
      const rackId = s.rackId === id ? racks[0].id : s.rackId;
      return { racks, rackId, selectedIid: s.rackId === id ? null : s.selectedIid };
    }),

  updateRack: (id, patch) =>
    set((s) => ({ racks: s.racks.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

  addItem: (id) => {
    const s = get();
    const rack = activeRackOf(s);
    const def = RACK_CATALOG.find((d) => d.id === id);
    if (!def) return;
    const pos = findSlotFor(rack.items, rack.size, def.u);
    if (pos == null) return;
    const iid = nextIid(rack.items);
    set({
      racks: s.racks.map((r) =>
        r.id === rack.id ? { ...r, items: [...r.items, { iid, id, pos }] } : r,
      ),
      selectedIid: iid,
    });
  },

  placeItem: (id, pos) => {
    const s = get();
    const rack = activeRackOf(s);
    const def = RACK_CATALOG.find((d) => d.id === id);
    if (!def) return false;
    if (!fits(rack.items, rack.size, def, pos)) return false;
    const iid = nextIid(rack.items);
    set({
      racks: s.racks.map((r) =>
        r.id === rack.id ? { ...r, items: [...r.items, { iid, id, pos }] } : r,
      ),
      selectedIid: iid,
    });
    return true;
  },

  removeItem: (iid) => {
    const s = get();
    set({
      racks: s.racks.map((r) =>
        r.id === s.rackId ? { ...r, items: r.items.filter((i) => i.iid !== iid) } : r,
      ),
      selectedIid: s.selectedIid === iid ? null : s.selectedIid,
    });
  },

  setItemDevice: (iid, deviceId) =>
    set((s) => ({
      racks: s.racks.map((r) =>
        r.id === s.rackId
          ? { ...r, items: r.items.map((i) => (i.iid === iid ? { ...i, deviceId } : i)) }
          : r,
      ),
    })),

  movePos: (iid, pos) => {
    const s = get();
    const rack = activeRackOf(s);
    const item = rack.items.find((i) => i.iid === iid);
    if (!item) return;
    const def = RACK_CATALOG.find((d) => d.id === item.id);
    if (!def) return;
    const np = Math.max(1, Math.min(rack.size - def.u + 1, pos));
    const used = buildUsedSlots(rack.items.filter((i) => i.iid !== iid));
    for (let k = np; k < np + def.u; k++) if (used.has(k)) return;
    set({
      racks: s.racks.map((r) =>
        r.id === rack.id
          ? { ...r, items: r.items.map((i) => (i.iid === iid ? { ...i, pos: np } : i)) }
          : r,
      ),
    });
  },
}));

export { buildUsedSlots, fits };
