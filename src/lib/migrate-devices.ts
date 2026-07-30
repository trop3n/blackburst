import { fetchDevices, insertDevice } from "@/lib/device-remote";
import { loadDevices, saveDevices } from "@/lib/device-storage";
import { fetchBucket } from "@/lib/project-remote";
import { BUCKETS_KEY, type ProjectStateBuckets } from "@/lib/project-storage";
import { useAuth } from "@/store/useAuth";
import type { Device } from "@/types";

const LOCAL_FLAG = "blackburst:devices-hoisted:v1";

// Devices used to be per-project (a `devices` key in SPECS), so each bucket
// carries its own list. They're global now; every bucket's list folds into the
// single registry.
//
// Deduped by id ONLY — never by serial. A device id is referenced by rack items,
// graph nodes and inventory assets inside its own project, so collapsing two
// records that describe the same physical box would orphan whichever reference
// lost. Cross-project duplicates are left for the user to merge by hand; a
// dangling reference would be silent data loss. Matching ids only collide when a
// bucket was cloned by project export/import, where keeping one is correct.
function collectLegacy(buckets: Record<string, ProjectStateBuckets>, have: Set<string>): Device[] {
  const out: Device[] = [];
  for (const bucket of Object.values(buckets)) {
    const slice = bucket?.devices as { devices?: unknown } | undefined;
    if (!Array.isArray(slice?.devices)) continue;
    for (const d of slice.devices as Device[]) {
      if (!d || typeof d.id !== "string" || have.has(d.id)) continue;
      have.add(d.id);
      out.push(d);
    }
  }
  return out;
}

// Local mode. Runs from the useDevices module initializer, before the store's
// first read, so the hoisted records are present on the very first render.
export function hoistLegacyDevices() {
  if (localStorage.getItem(LOCAL_FLAG)) return;
  try {
    const raw = localStorage.getItem(BUCKETS_KEY);
    const buckets = raw ? (JSON.parse(raw) as Record<string, ProjectStateBuckets>) : {};
    const existing = loadDevices();
    const legacy = collectLegacy(buckets, new Set(existing.map((d) => d.id)));
    if (legacy.length > 0) saveDevices([...existing, ...legacy]);
    localStorage.setItem(LOCAL_FLAG, new Date().toISOString());
  } catch {
    // A malformed bucket store must never stop the app booting — the registry
    // just starts from whatever the global key already holds.
  }
}

// Accounts mode. Buckets live in server JSONB, so this costs one fetch per
// project — run once per user per browser from bootstrap(), never on a hot path.
// Existing server devices are read first so a second browser can't re-import.
export async function hoistLegacyDevicesRemote(projectIds: string[]): Promise<void> {
  const userId = useAuth.getState().user?.id;
  if (!userId) return;
  const flagKey = `blackburst:devices-hoisted:${userId}`;
  if (localStorage.getItem(flagKey)) return;
  if (projectIds.length === 0) {
    localStorage.setItem(flagKey, new Date().toISOString());
    return;
  }

  const have = new Set((await fetchDevices()).map((d) => d.id));
  const buckets: Record<string, ProjectStateBuckets> = {};
  for (const id of projectIds) {
    const bucket = await fetchBucket(id);
    if (bucket) buckets[id] = bucket;
  }
  for (const device of collectLegacy(buckets, have)) await insertDevice(device);
  localStorage.setItem(flagKey, new Date().toISOString());
}
