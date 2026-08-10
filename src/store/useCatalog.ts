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
import { useAuth } from "@/store/useAuth";
import type { InventoryModelDef, Panel, RackItemDef, SystemDeviceDef } from "@/types";

interface CatalogState {
  rack: RackItemDef[];
  system: SystemDeviceDef[];
  panel: Panel[];
  inv: InventoryModelDef[];
  // def id → contributor (null = orphaned). One map across the four kinds,
  // matching deleteCatalogItem's id-only filter. Empty in local mode, where
  // everything is deletable.
  owners: Record<string, string | null>;
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
  if (isSupabaseConfigured)
    void deleteCatalogItem(id).catch(() => {
      // Denied (stale affordance or a race): the optimistic removal was wrong.
      // Re-hydrate now so the row resurrects immediately, not next session.
      void useCatalog.getState().hydrateFromServer().catch(() => {});
    });
  else saveCustomCatalog({ ...loadCustomCatalog(), ...snapshot });
}

// Optimistic ownership bookkeeping so a just-added item is deletable without a
// round-trip; hydrateFromServer rebuilds the map wholesale.
function ownersWith(owners: Record<string, string | null>, id: string) {
  if (!isSupabaseConfigured) return owners;
  return { ...owners, [id]: useAuth.getState().user?.id ?? null };
}

function ownersWithout(owners: Record<string, string | null>, id: string) {
  if (!isSupabaseConfigured) return owners;
  const next = { ...owners };
  delete next[id];
  return next;
}

export const useCatalog = create<CatalogState>((set, get) => ({
  rack: initial.rack,
  system: initial.system,
  panel: initial.panel,
  inv: initial.inv,
  owners: {},

  addRackDef: (def) => {
    if (get().rack.some((d) => d.id === def.id)) return false;
    const rack = [...get().rack, def];
    setCustomRackDefs(rack);
    persistAdd("rack", def, { rack });
    set({ rack, owners: ownersWith(get().owners, def.id) });
    return true;
  },

  removeRackDef: (id) => {
    const rack = get().rack.filter((d) => d.id !== id);
    setCustomRackDefs(rack);
    persistRemove(id, { rack });
    set({ rack, owners: ownersWithout(get().owners, id) });
  },

  addSystemDef: (def) => {
    if (get().system.some((d) => d.id === def.id)) return false;
    const system = [...get().system, def];
    setCustomSystemDefs(system);
    persistAdd("system", def, { system });
    set({ system, owners: ownersWith(get().owners, def.id) });
    return true;
  },

  removeSystemDef: (id) => {
    const system = get().system.filter((d) => d.id !== id);
    setCustomSystemDefs(system);
    persistRemove(id, { system });
    set({ system, owners: ownersWithout(get().owners, id) });
  },

  addPanelDef: (def) => {
    if (get().panel.some((d) => d.id === def.id)) return false;
    const panel = [...get().panel, def];
    setCustomPanelDefs(panel);
    persistAdd("panel", def, { panel });
    set({ panel, owners: ownersWith(get().owners, def.id) });
    return true;
  },

  removePanelDef: (id) => {
    const panel = get().panel.filter((d) => d.id !== id);
    setCustomPanelDefs(panel);
    persistRemove(id, { panel });
    set({ panel, owners: ownersWithout(get().owners, id) });
  },

  addInvModel: (def) => {
    if (get().inv.some((d) => d.id === def.id)) return false;
    const inv = [...get().inv, def];
    setCustomInvModels(inv);
    persistAdd("inv", def, { inv });
    set({ inv, owners: ownersWith(get().owners, def.id) });
    return true;
  },

  removeInvModel: (id) => {
    const inv = get().inv.filter((d) => d.id !== id);
    setCustomInvModels(inv);
    persistRemove(id, { inv });
    set({ inv, owners: ownersWithout(get().owners, id) });
  },

  // Accounts mode: load the whole shared library from the server after sign-in
  // and replace the in-memory catalog + live bindings. Best-effort — the caller
  // swallows errors so an unavailable table just leaves the built-ins showing.
  hydrateFromServer: async () => {
    const rows = await fetchCatalogItems();
    const next: CustomCatalog = { rack: [], system: [], panel: [], inv: [] };
    const owners: Record<string, string | null> = {};
    for (const r of rows) {
      const id = (r.data as { id?: unknown }).id;
      if (typeof id === "string") owners[id] = r.created_by;
      if (r.kind === "rack") next.rack.push(r.data as unknown as RackItemDef);
      else if (r.kind === "system") next.system.push(r.data as unknown as SystemDeviceDef);
      else if (r.kind === "panel") next.panel.push(r.data as unknown as Panel);
      else if (r.kind === "inv") next.inv.push(r.data as unknown as InventoryModelDef);
    }
    applyBindings(next);
    set({ rack: next.rack, system: next.system, panel: next.panel, inv: next.inv, owners });
  },
}));
