# Blackburst

**AV / live-production design tooling.** Six dense, technical modules behind one keyboard-driven shell (rail · ⌘K command palette · status bar). Runs locally out of the box — every project lives in `localStorage` and exports to a portable JSON snapshot — and wires up to Supabase for accounts, per-user cloud storage, and project sharing.

🔗 **Deployed at https://blackburst.vercel.app** — running in accounts mode, so it requires credentials; there is no open demo. Accounts are created in the Supabase dashboard.

---

## Modules

Five are **design-time** tools scoped to a project. The Maintenance Log is the one **operational** surface — global data that outlives any single project.

### LED Wall Builder
Lay out LED panel walls and get live resolution, pixel count, weight, power draw, processor allocation, circuit count, and thermal load (BTU/hr) — all recalculated as you size the wall. Eight processors from Brompton, Novastar and Colorlight, each with its own real pixel capacity, so headroom reflects the unit you actually picked.

### System Designer
A node graph for video / audio / network / power signal flow, with per-lane visibility toggles and a tabular patch sheet. Patch rows are derived from the graph on every render; source port, destination port and cable type are optional per-connection overrides, and derived values render muted so you can see at a glance which figures are the app's assumption.

### Rack Builder
Drag-to-build 19" racks (24U / 42U / 48U) from a catalog, with running U-usage, weight, power, and circuit totals.

### Asset & Inventory
Fleet table with in / out / maintenance status and utilization, plus a 14-day show-assignment schedule.

### Documentation Hub
File tree with run-of-show / SOP authoring, version history, and comments. Doc bodies link into the app with ordinary markdown syntax plus a kind scheme — `[Booth 2 PSU swap](maint-entry:mnt-abc123)` renders as a clickable chip that jumps to the entry — and the linked-references pane is derived from the body, so it can't drift from what the document says.

### Maintenance Log
Venues, the devices installed at each, and their service history. Entries are typed (repair / replace / firmware / config / inspect / calibrate) and carry an open-vs-resolved state, filterable by kind and by open-only. Venue readouts — entries, open, devices, last service — all derive from the venue's real entries.

### Cross-cutting

**Shared hardware catalog.** Each module draws its palette from a built-in seed library that users can extend at runtime — rack gear, system devices, LED panels, inventory models. In accounts mode the additions are org-wide and shared across the team; locally they're per-browser.

**Device registry.** A catalog entry is a *model* ("ATEM 4 M/E"); a device is *one physical unit* ("the ATEM in rack 2, serial 12345"). Rack slots, graph nodes and inventory assets can each point at the same device, so one box appears in three modules as one record — and its service history survives a project switch, because the registry is global.

**No fabricated readouts.** Every figure on screen traces to project state or a sourced constant. If a value can't be derived, it isn't rendered.

---

## Stack

React 18 · TypeScript (strict) · Vite · Zustand · Tailwind v4 · Supabase (optional).

**Local mode (default).** Each project's module state is persisted to `localStorage` and can be exported or imported as a `blackburst-project` JSON file. Switching projects snapshots the live stores and restores the target project's state.

**Accounts mode.** Set the Supabase env vars and the app gates behind sign-in, stores each project as a JSONB row server-side, and shares projects between users by email with owner / editor / viewer roles — enforced by Postgres row-level security. Sign-in is **email + password**; accounts are created in the Supabase dashboard rather than by self-signup. A magic-link / one-time-code path is built and available in the UI, but needs custom SMTP to be practical — the built-in email service is rate limited to a few messages an hour. Realtime keeps collaborators in sync (last-write-wins, not a CRDT). On first sign-in, projects from this browser can be imported into the account. Setup: [`supabase/README.md`](./supabase/README.md).

## Develop

```bash
npm install
npm run dev        # Vite dev server on :5173 (exposed on the LAN)
npm run build      # tsc -b && vite build
npm run typecheck  # tsc -b --noEmit
npm run preview    # serve the production build
```

The strict TypeScript compiler is the only static gate (no separate linter): `npm run build` fails on unused vars, dead code, and type errors.

With `.env.local` populated, `npm run dev` boots into accounts mode and stops at the sign-in screen. To exercise local mode, blank the vars for that run:

```bash
env VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" npx vite --port 5174
```

## Deployment

Deployed on [Vercel](https://vercel.com): importing the GitHub repo auto-detects the Vite preset and, on every push to `main`, runs `npm run build` and serves `dist` from Vercel's CDN — with preview deployments for each pull request. Build settings are pinned in [`vercel.json`](./vercel.json).

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set on **Production only**. Preview deployments deliberately have no vars, so branch builds run in local mode and can't write to the live Supabase project.
