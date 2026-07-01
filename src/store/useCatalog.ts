import { create } from "zustand";
import { loadCustomCatalog, saveCustomCatalog } from "@/lib/catalog-storage";
import { setCustomRackDefs } from "@/lib/rack-data";
import type { RackItemDef } from "@/types";

interface CatalogState {
  rack: RackItemDef[];
  addRackDef: (def: RackItemDef) => boolean;
  removeRackDef: (id: string) => void;
}

// Hydrate the merged rack catalog once at module load so slot math and the
// catalog pane see user additions immediately (both local and accounts mode
// read the same localStorage-backed library for now).
const initial = loadCustomCatalog();
setCustomRackDefs(initial.rack);

export const useCatalog = create<CatalogState>((set, get) => ({
  rack: initial.rack,

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
}));
