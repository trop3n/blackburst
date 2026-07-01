import type { InventoryModelDef, Panel, RackItemDef, SystemDeviceDef } from "@/types";

// User-added hardware, layered on top of the built-in seed catalogs. This is a
// GLOBAL library (shared across all projects), so it lives under its own key and
// is deliberately NOT part of a project's bucket in project-storage.ts. Each
// library keeps its own shape; only the ones wired so far appear here.
export interface CustomCatalog {
  rack: RackItemDef[];
  system: SystemDeviceDef[];
  panel: Panel[];
  inv: InventoryModelDef[];
}

const KEY = "blackburst:catalog:v1";

function emptyCatalog(): CustomCatalog {
  return { rack: [], system: [], panel: [], inv: [] };
}

export function loadCustomCatalog(): CustomCatalog {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyCatalog();
    const parsed = JSON.parse(raw) as Partial<CustomCatalog>;
    return {
      rack: Array.isArray(parsed.rack) ? parsed.rack : [],
      system: Array.isArray(parsed.system) ? parsed.system : [],
      panel: Array.isArray(parsed.panel) ? parsed.panel : [],
      inv: Array.isArray(parsed.inv) ? parsed.inv : [],
    };
  } catch {
    return emptyCatalog();
  }
}

export function saveCustomCatalog(catalog: CustomCatalog) {
  try {
    localStorage.setItem(KEY, JSON.stringify(catalog));
  } catch {
    // Storage full / unavailable — additions stay in memory for the session.
  }
}
