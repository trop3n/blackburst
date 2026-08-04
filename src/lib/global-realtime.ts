import { createTableSync } from "@/lib/realtime-sync";
import { useCatalog } from "@/store/useCatalog";
import { hasPendingDeviceWrites, useDevices } from "@/store/useDevices";
import { hasPendingEntryWrites, useMaintenance } from "@/store/useMaintenance";
import { hasPendingVenueWrites, useVenues } from "@/store/useVenues";

// The four project-independent layers. project_state is deliberately not here —
// it is per-project, its subscription swaps on switchProject, and it carries the
// extra pending-save guard, so it stays in project-remote.ts / project-storage.ts.
// catalog_items passes no pending-write guard because it has none to pass: the
// catalog is added to and deleted from, never edited in a text field, so its
// writes are immediate and local state is never ahead of the server.
const SYNCS = [
  createTableSync("catalog_items", () => useCatalog.getState().hydrateFromServer()),
  createTableSync(
    "devices",
    () => useDevices.getState().hydrateFromServer(),
    hasPendingDeviceWrites,
  ),
  createTableSync("venues", () => useVenues.getState().hydrateFromServer(), hasPendingVenueWrites),
  createTableSync(
    "maintenance_entries",
    () => useMaintenance.getState().hydrateFromServer(),
    hasPendingEntryWrites,
  ),
];

export function subscribeGlobalTables(): void {
  for (const s of SYNCS) s.subscribe();
}

export function unsubscribeGlobalTables(): void {
  for (const s of SYNCS) s.unsubscribe();
}
