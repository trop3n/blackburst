import { createTableSync } from "@/lib/realtime-sync";
import { useCatalog } from "@/store/useCatalog";
import { useDevices } from "@/store/useDevices";
import { useMaintenance } from "@/store/useMaintenance";
import { useVenues } from "@/store/useVenues";

// The four project-independent layers. project_state is deliberately not here —
// it is per-project, its subscription swaps on switchProject, and it carries the
// extra pending-save guard, so it stays in project-remote.ts / project-storage.ts.
const SYNCS = [
  createTableSync("catalog_items", () => useCatalog.getState().hydrateFromServer()),
  createTableSync("devices", () => useDevices.getState().hydrateFromServer()),
  createTableSync("venues", () => useVenues.getState().hydrateFromServer()),
  createTableSync("maintenance_entries", () => useMaintenance.getState().hydrateFromServer()),
];

export function subscribeGlobalTables(): void {
  for (const s of SYNCS) s.subscribe();
}

export function unsubscribeGlobalTables(): void {
  for (const s of SYNCS) s.unsubscribe();
}
