import type { RackItemDef, SystemDeviceDef } from "@/types";

// User-added hardware, layered on top of the built-in seed catalogs. This is a
// GLOBAL library (shared across all projects), so it lives under its own key and
// is deliberately NOT part of a project's bucket in project-storage.ts. Each
// library keeps its own shape; only the ones wired so far appear here.
export interface CustomCatalog {
  rack: RackItemDef[];
  system: SystemDeviceDef[];
}

const KEY = "blackburst:catalog:v1";

function emptyCatalog(): CustomCatalog {
  return { rack: [], system: [] };
}

export function loadCustomCatalog(): CustomCatalog {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyCatalog();
    const parsed = JSON.parse(raw) as Partial<CustomCatalog>;
    return {
      rack: Array.isArray(parsed.rack) ? parsed.rack : [],
      system: Array.isArray(parsed.system) ? parsed.system : [],
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
