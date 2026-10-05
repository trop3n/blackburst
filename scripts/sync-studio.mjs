#!/usr/bin/env node
/**
 * Pull AV Studio's server-side records to one dated JSON file. Read-only.
 *
 *   node scripts/sync-studio.mjs [--out DIR] [--venues]
 *
 * Why this exists. Four of the app's layers are deliberately global and
 * project-independent -- the hardware catalog, the device registry, and venues
 * with their maintenance log. That is the right model (a physical box and a
 * room outlive any project), but it means those records live in exactly one
 * place: Postgres. `project-io.ts` can export a *project*; nothing in the app
 * can export the global layers, and a device registry with years of service
 * history is the least replaceable data this estate holds. So this does it
 * from outside.
 *
 * Read-only by construction: every request is a GET, there is no write path
 * here, and nothing is deleted or rewritten. Same instinct as `sme_probe.py`
 * in av-network-inventory.
 *
 * The output is a faithful dump -- whole rows, exactly as the table holds them
 * -- rather than a reshaped one. A backup that reinterprets its source is a
 * backup you cannot restore from, and the reshaping Phase 5c needs (feeding
 * open maintenance entries to the Network app) belongs in that consumer.
 *
 * ## Credentials
 *
 * Needs the **service_role** key, because RLS scopes every one of these tables
 * to `authenticated` and a backup must not depend on one person's account
 * staying valid. That key bypasses RLS entirely: it is the most dangerous
 * string in the project, it is not the publishable anon key, and it must never
 * reach a client bundle or a commit. So it is read from outside every repo:
 *
 *   ~/dev/av-private/studio-supabase.json
 *   { "url": "https://<ref>.supabase.co", "serviceRoleKey": "<key>" }
 *
 * Same convention as `av-inventory-private\cf-access.json`: a sibling of the
 * work, outside every repo. Note `~/dev/samc` IS a git repo whose .gitignore
 * does not match this filename, so a directory under it would be one
 * `git add -A` away from a committed service key -- hence `~/dev`, which is
 * not a repo at all. A .gitignore is the second layer, never the first. The
 * key is never printed, never written to the dump, never passed as an
 * argument.
 *
 * ## The dump holds personal data
 *
 * `profiles` and `project_invites` carry team email addresses, and the
 * maintenance log carries who did what, so the output directory sits outside
 * every repo -- `~/dev/` rather than `~/dev/samc/`, which IS a git repository
 * whose .gitignore would not have matched a dated JSON file. Same reason
 * `history.db` is gitignored in av-network-inventory, and the same reason the
 * credentials live in `~/dev/av-private/`.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const CREDS = join(homedir(), "dev", "av-private", "studio-supabase.json");
const DEFAULT_OUT = join(homedir(), "dev", "studio-backups");
const PAGE = 1000;

// `order` is per-table on purpose: project_members and project_state are keyed
// by project_id and have no `id` column, and ordering is what makes two pulls
// of unchanged data diff cleanly instead of churning on row order.
const TABLES = [
  { name: "venues", order: "id", why: "rooms — joined to the canonical venue list" },
  { name: "maintenance_entries", order: "id", why: "service history — the least replaceable records here" },
  { name: "devices", order: "id", why: "the physical device registry" },
  { name: "catalog_items", order: "id", why: "team-added hardware models" },
  { name: "projects", order: "id", why: "project list" },
  { name: "project_state", order: "project_id", why: "each project's whole bucket" },
  { name: "project_revisions", order: "id", why: "per-project revision history" },
  { name: "project_members", order: "project_id", why: "who can see which project" },
  { name: "project_invites", order: "id", why: "unclaimed invitations" },
  { name: "profiles", order: "id", why: "email per user id" },
];

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function creds() {
  let raw;
  try {
    raw = await readFile(CREDS, "utf8");
  } catch {
    console.error(`No credentials at ${CREDS}`);
    console.error('Create it as: { "url": "https://<ref>.supabase.co", "serviceRoleKey": "<key>" }');
    console.error("The service_role key is in the Supabase dashboard under Project Settings -> API.");
    process.exit(2);
  }
  const { url, serviceRoleKey } = JSON.parse(raw);
  if (!url || !serviceRoleKey) {
    console.error(`${CREDS}: needs both "url" and "serviceRoleKey"`);
    process.exit(2);
  }
  return { url: url.replace(/\/+$/, ""), key: serviceRoleKey };
}

// Pages rather than trusting one request: PostgREST caps a response at its
// configured maximum, and a silently truncated backup is worse than none.
async function pull({ url, key }, table, order) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const q = `${url}/rest/v1/${table}?select=*&order=${order}.asc&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(q, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

const { url, key } = await creds();
const outDir = arg("--out", DEFAULT_OUT);
const ref = new URL(url).hostname.split(".")[0];
const tables = {};
const failed = [];

console.log(`pulling from ${ref}`);
for (const t of TABLES) {
  try {
    tables[t.name] = await pull({ url, key }, t.name, t.order);
    console.log(`  ${t.name.padEnd(20)} ${String(tables[t.name].length).padStart(5)} rows   ${t.why}`);
  } catch (e) {
    // One missing or renamed table must not cost you the other nine.
    failed.push(t.name);
    console.log(`  ${t.name.padEnd(20)} ${"FAILED".padStart(5)}   ${e.message}`);
  }
}

// Stamped to the second, not the day. A date-only name means the second run
// of any day silently overwrites the first -- which is precisely the run you
// want back when you have just discovered something is missing.
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const path = join(outDir, `studio-${stamp}.json`);
await mkdir(outDir, { recursive: true });
await writeFile(
  path,
  JSON.stringify({ pulledAt: new Date().toISOString(), project: ref, tables }, null, 2),
);

const total = Object.values(tables).reduce((n, r) => n + r.length, 0);
console.log(`\n${total} rows -> ${path}`);
if (failed.length) console.log(`incomplete: ${failed.join(", ")} did not pull`);

// `--venues` answers the one question Phase 3 needs: do venues already exist,
// and does anything reference them? A canonical slug as the id means that venue
// is already reconciled; a `ven-...` id means it predates the shared list.
if (process.argv.includes("--venues")) {
  const venues = tables.venues ?? [];
  const entries = tables.maintenance_entries ?? [];
  const devices = tables.devices ?? [];
  const count = (list, id) => list.filter((r) => r.data?.venueId === id).length;
  console.log(`\n${venues.length} venue(s):`);
  for (const v of venues) {
    const id = v.data?.id ?? "(no id)";
    console.log(
      `  ${String(id).padEnd(16)} ${String(v.data?.name ?? "").padEnd(24)}` +
        ` entries=${count(entries, id)} devices=${count(devices, id)}` +
        `${/^ven-/.test(id) ? "   <- predates the canonical list" : ""}`,
    );
  }
}
