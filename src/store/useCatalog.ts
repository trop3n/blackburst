import { create } from "zustand";
import { loadCustomCatalog, saveCustomCatalog } from "@/lib/catalog-storage";
import { setCustomRackDefs } from "@/lib/rack-data";
import { setCustomSystemDefs } from "@/lib/system-data";
import type { RackItemDef, SystemDeviceDef } from "@/types";

interface CatalogState {
  rack: RackItemDef[];
  system: SystemDeviceDef[];
  addRackDef: (def: RackItemDef) => boolean;
  removeRackDef: (id: string) => void;
  addSystemDef: (def: SystemDeviceDef) => boolean;
  removeSystemDef: (id: string) => void;
}

// Hydrate the merged catalogs once at module load so slot math, the rack pane,
// and the device palette see user additions immediately (both local and
// accounts mode read the same localStorage-backed library for now).
const initial = loadCustomCatalog();
setCustomRackDefs(initial.rack);
setCustomSystemDefs(initial.system);

export const useCatalog = create<CatalogState>((set, get) => ({
  rack: initial.rack,
  system: initial.system,

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
}));
