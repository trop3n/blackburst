import { create } from "zustand";
import {
  deleteCatalogItem,
  fetchCatalogItems,
  insertCatalogItem,
  type CatalogKind,
} from "@/lib/catalog-remote";
import { loadCustomCatalog, saveCustomCatalog, type CustomCatalog } from "@/lib/catalog-storage";
import { setCustomPanelDefs } from "@/lib/data";
import { setCustomInvModels } from "@/lib/inventory-data";
import { setCustomRackDefs } from "@/lib/rack-data";
import { setCustomSystemDefs } from "@/lib/system-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { InventoryModelDef, Panel, RackItemDef, SystemDeviceDef } from "@/types";

interface CatalogState {
  rack: RackItemDef[];
  system: SystemDeviceDef[];
  panel: Panel[];
  inv: InventoryModelDef[];
  addRackDef: (def: RackItemDef) => boolean;
  removeRackDef: (id: string) => void;
  addSystemDef: (def: SystemDeviceDef) => boolean;
  removeSystemDef: (id: string) => void;
  addPanelDef: (def: Panel) => boolean;
  removePanelDef: (id: string) => void;
  addInvModel: (def: InventoryModelDef) => boolean;
  removeInvModel: (id: string) => void;
  hydrateFromServer: () => Promise<void>;
}

// Push the merged catalogs into the per-library live bindings so slot math, the
// palettes, and the pickers all resolve current custom items.
function applyBindings(c: CustomCatalog) {
  setCustomRackDefs(c.rack);
  setCustomSystemDefs(c.system);
  setCustomPanelDefs(c.panel);
  setCustomInvModels(c.inv);
}

// In accounts mode the shared library lives on the server and loads after
// sign-in (useApp.bootstrap → hydrateFromServer), so start empty. In local mode
// it's a per-browser library in localStorage, hydrated synchronously here.
const initial: CustomCatalog = isSupabaseConfigured
  ? { rack: [], system: [], panel: [], inv: [] }
  : loadCustomCatalog();
applyBindings(initial);

// Persist a change. Accounts mode: fire-and-forget server write (the optimistic
// local update is already applied, matching the project autosave pattern), so a
// transient error or a missing table never blocks the UI. Local mode: snapshot
// the affected slice to localStorage.
function persistAdd(kind: CatalogKind, def: { id: string }, snapshot: Partial<CustomCatalog>) {
  if (isSupabaseConfigured) void insertCatalogItem(kind, def).catch(() => {});
  else saveCustomCatalog({ ...loadCustomCatalog(), ...snapshot });
}

function persistRemove(id: string, snapshot: Partial<CustomCatalog>) {
  if (isSupabaseConfigured) void deleteCatalogItem(id).catch(() => {});
  else saveCustomCatalog({ ...loadCustomCatalog(), ...snapshot });
}

export const useCatalog = create<CatalogState>((set, get) => ({
  rack: initial.rack,
  system: initial.system,
  panel: initial.panel,
  inv: initial.inv,

  addRackDef: (def) => {
    if (get().rack.some((d) => d.id === def.id)) return false;
    const rack = [...get().rack, def];
    setCustomRackDefs(rack);
    persistAdd("rack", def, { rack });
    set({ rack });
    return true;
  },

  removeRackDef: (id) => {
    const rack = get().rack.filter((d) => d.id !== id);
    setCustomRackDefs(rack);
    persistRemove(id, { rack });
    set({ rack });
  },

  addSystemDef: (def) => {
    if (get().system.some((d) => d.id === def.id)) return false;
    const system = [...get().system, def];
    setCustomSystemDefs(system);
    persistAdd("system", def, { system });
    set({ system });
    return true;
  },

  removeSystemDef: (id) => {
    const system = get().system.filter((d) => d.id !== id);
    setCustomSystemDefs(system);
    persistRemove(id, { system });
    set({ system });
  },

  addPanelDef: (def) => {
    if (get().panel.some((d) => d.id === def.id)) return false;
    const panel = [...get().panel, def];
    setCustomPanelDefs(panel);
    persistAdd("panel", def, { panel });
    set({ panel });
    return true;
  },

  removePanelDef: (id) => {
    const panel = get().panel.filter((d) => d.id !== id);
    setCustomPanelDefs(panel);
    persistRemove(id, { panel });
    set({ panel });
  },

  addInvModel: (def) => {
    if (get().inv.some((d) => d.id === def.id)) return false;
    const inv = [...get().inv, def];
    setCustomInvModels(inv);
    persistAdd("inv", def, { inv });
    set({ inv });
    return true;
  },

  removeInvModel: (id) => {
    const inv = get().inv.filter((d) => d.id !== id);
    setCustomInvModels(inv);
    persistRemove(id, { inv });
    set({ inv });
  },

  // Accounts mode: load the whole shared library from the server after sign-in
  // and replace the in-memory catalog + live bindings. Best-effort — the caller
  // swallows errors so an unavailable table just leaves the built-ins showing.
  hydrateFromServer: async () => {
    const rows = await fetchCatalogItems();
    const next: CustomCatalog = { rack: [], system: [], panel: [], inv: [] };
    for (const r of rows) {
      if (r.kind === "rack") next.rack.push(r.data as unknown as RackItemDef);
      else if (r.kind === "system") next.system.push(r.data as unknown as SystemDeviceDef);
      else if (r.kind === "panel") next.panel.push(r.data as unknown as Panel);
      else if (r.kind === "inv") next.inv.push(r.data as unknown as InventoryModelDef);
    }
    applyBindings(next);
    set({ rack: next.rack, system: next.system, panel: next.panel, inv: next.inv });
  },
}));
