import { insertVenue } from "@/lib/maintenance-remote";
import { loadVenues, saveVenues } from "@/lib/maintenance-storage";
import venuesJson from "@/lib/venues.json";
import type { Venue } from "@/types";

// The canonical venue list, synced from `samc-av-shared` by `sync-venues.sh`
// and shared with av-network-inventory and the knowledge base so the three
// cannot disagree about which rooms exist. Only the identity fields are used
// here; `match` and `locations` exist for the inventory's Location matching and
// have no meaning in this app.
const CANONICAL: { slug: string; name: string }[] = venuesJson.venues;

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Canonical venues not present yet, as records ready to insert.
 *
 * Deliberately **not** a re-id of existing rows. `updateVenueRemote` filters on
 * `data->>id` so it cannot change an id, and `deleteVenueRemote` is gated to the
 * row's contributor — so a client cannot re-point an existing venue at a
 * canonical slug at all. Inserting regardless would give one room two records
 * and leave its service history on the old one, so a name collision is skipped
 * and reported instead: a venue with a non-canonical id is fixable by hand, a
 * split history is not. Same stance `migrate-devices.ts` takes on cross-project
 * duplicates — surface it, never guess.
 */
function pending(existing: Venue[]): Venue[] {
  const ids = new Set(existing.map((v) => v.id));
  const names = new Map(existing.map((v) => [norm(v.name), v.id]));
  const out: Venue[] = [];
  for (const c of CANONICAL) {
    if (ids.has(c.slug)) continue;
    const clash = names.get(norm(c.name));
    if (clash) {
      console.warn(
        `venue "${c.name}" exists as "${clash}" rather than "${c.slug}". ` +
          "Merge it by hand in the Maintenance Log — moving its entries to the " +
          "canonical venue — or the two records will drift.",
      );
      continue;
    }
    out.push({ id: c.slug, name: c.name, address: "", notes: "" });
  }
  return out;
}

// Local mode. Runs from the useVenues module initializer, before the store's
// first read, so the rooms are there on the very first render.
//
// No run-once flag, unlike migrate-devices.ts. That one hoists legacy data, so
// repeating it would be wrong; this is idempotent, and the canonical list can
// gain a room later — a flag would mean the eighth venue never appeared.
export function seedCanonicalVenues() {
  try {
    const existing = loadVenues();
    const add = pending(existing);
    if (add.length > 0) saveVenues([...existing, ...add]);
  } catch {
    // Storage unavailable must never stop the app booting — the store falls
    // back to whatever the key already holds.
  }
}

// Accounts mode. Called from bootstrap() *after* the initial hydrate, so it
// reads the live list without paying for a second fetch. Returns true when it
// inserted anything, which is the caller's cue to re-hydrate.
export async function seedCanonicalVenuesRemote(existing: Venue[]): Promise<boolean> {
  let inserted = 0;
  for (const v of pending(existing)) {
    try {
      await insertVenue(v);
      inserted++;
    } catch {
      // Another session seeded this one first and the unique index on
      // `data->>id` refused it. Expected, and not worth failing a boot over —
      // one venue losing the race must not stop the rest being created.
    }
  }
  return inserted > 0;
}
