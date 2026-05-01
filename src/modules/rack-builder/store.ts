import { create } from "zustand";
import { DEFAULT_RACK, RACK_CATALOG } from "@/lib/rack-data";
import type { RackItem, RackSize } from "@/types";

interface RackState {
  items: RackItem[];
  selectedIid: number | null;
  rackSize: RackSize;
  filter: string;
  search: string;
  hoverPos: number | null;
  draggingId: string | null;

  setItems: (items: RackItem[]) => void;
  setSelectedIid: (iid: number | null) => void;
  setRackSize: (s: RackSize) => void;
  setFilter: (f: string) => void;
  setSearch: (s: string) => void;
  setHoverPos: (p: number | null) => void;
  setDraggingId: (id: string | null) => void;

  addItem: (id: string) => void;
  placeItem: (id: string, pos: number) => boolean;
  removeItem: (iid: number) => void;
  movePos: (iid: number, pos: number) => void;
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

function nextIid(items: RackItem[]): number {
  return items.reduce((m, i) => Math.max(m, i.iid), 0) + 1;
}

export const useRack = create<RackState>((set, get) => ({
  items: DEFAULT_RACK,
  selectedIid: 13,
  rackSize: 42,
  filter: "All",
  search: "",
  hoverPos: null,
  draggingId: null,

  setItems: (items) => set({ items }),
  setSelectedIid: (selectedIid) => set({ selectedIid }),
  setRackSize: (rackSize) => set({ rackSize }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setHoverPos: (hoverPos) => set({ hoverPos }),
  setDraggingId: (draggingId) => set({ draggingId }),

  addItem: (id) => {
    const { items, rackSize } = get();
    const def = RACK_CATALOG.find((d) => d.id === id);
    if (!def) return;
    const pos = findSlotFor(items, rackSize, def.u);
    if (pos == null) return;
    const iid = nextIid(items);
    set({ items: [...items, { iid, id, pos }], selectedIid: iid });
  },

  placeItem: (id, pos) => {
    const { items, rackSize } = get();
    const def = RACK_CATALOG.find((d) => d.id === id);
    if (!def) return false;
    if (!fits(items, rackSize, def, pos)) return false;
    const iid = nextIid(items);
    set({ items: [...items, { iid, id, pos }], selectedIid: iid });
    return true;
  },

  removeItem: (iid) => {
    const { items, selectedIid } = get();
    set({
      items: items.filter((i) => i.iid !== iid),
      selectedIid: selectedIid === iid ? null : selectedIid,
    });
  },

  movePos: (iid, pos) => {
    const { items, rackSize } = get();
    const item = items.find((i) => i.iid === iid);
    if (!item) return;
    const def = RACK_CATALOG.find((d) => d.id === item.id);
    if (!def) return;
    const np = Math.max(1, Math.min(rackSize - def.u + 1, pos));
    // ensure it doesn't collide with others
    const others = items.filter((i) => i.iid !== iid);
    const used = buildUsedSlots(others);
    for (let k = np; k < np + def.u; k++) if (used.has(k)) return;
    set({ items: items.map((i) => (i.iid === iid ? { ...i, pos: np } : i)) });
  },
}));

export { buildUsedSlots, fits };
