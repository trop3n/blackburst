import { create } from "zustand";
import { loadCustomCatalog, saveCustomCatalog } from "@/lib/catalog-storage";
import { setCustomPanelDefs } from "@/lib/data";
import { setCustomInvModels } from "@/lib/inventory-data";
import { setCustomRackDefs } from "@/lib/rack-data";
import { setCustomSystemDefs } from "@/lib/system-data";
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
}

// Hydrate the merged catalogs once at module load so slot math, the rack pane,
// the device palette, the panel library, and the inventory model catalog see
// user additions immediately (both local and accounts mode read the same
// localStorage-backed library).
const initial = loadCustomCatalog();
setCustomRackDefs(initial.rack);
setCustomSystemDefs(initial.system);
setCustomPanelDefs(initial.panel);
setCustomInvModels(initial.inv);

export const useCatalog = create<CatalogState>((set, get) => ({
  rack: initial.rack,
  system: initial.system,
  panel: initial.panel,
  inv: initial.inv,

  addRackDef: (def) => {
    if (get().rack.some((d) => d.id === def.id)) return false;
    const rack = [...get().rack, def];
    setCustomRackDefs(rack);
    saveCustomCatalog({ ...loadCustomCatalog(), rack });
    set({ rack });
    return true;
  },

  removeRackDef: (id) => {
    const rack = get().rack.filter((d) => d.id !== id);
    setCustomRackDefs(rack);
    saveCustomCatalog({ ...loadCustomCatalog(), rack });
    set({ rack });
  },

  addSystemDef: (def) => {
    if (get().system.some((d) => d.id === def.id)) return false;
    const system = [...get().system, def];
    setCustomSystemDefs(system);
    saveCustomCatalog({ ...loadCustomCatalog(), system });
    set({ system });
    return true;
  },

  removeSystemDef: (id) => {
    const system = get().system.filter((d) => d.id !== id);
    setCustomSystemDefs(system);
    saveCustomCatalog({ ...loadCustomCatalog(), system });
    set({ system });
  },

  addPanelDef: (def) => {
    if (get().panel.some((d) => d.id === def.id)) return false;
    const panel = [...get().panel, def];
    setCustomPanelDefs(panel);
    saveCustomCatalog({ ...loadCustomCatalog(), panel });
    set({ panel });
    return true;
  },

  removePanelDef: (id) => {
    const panel = get().panel.filter((d) => d.id !== id);
    setCustomPanelDefs(panel);
    saveCustomCatalog({ ...loadCustomCatalog(), panel });
    set({ panel });
  },

  addInvModel: (def) => {
    if (get().inv.some((d) => d.id === def.id)) return false;
    const inv = [...get().inv, def];
    setCustomInvModels(inv);
    saveCustomCatalog({ ...loadCustomCatalog(), inv });
    set({ inv });
    return true;
  },

  removeInvModel: (id) => {
    const inv = get().inv.filter((d) => d.id !== id);
    setCustomInvModels(inv);
    saveCustomCatalog({ ...loadCustomCatalog(), inv });
    set({ inv });
  },
}));
