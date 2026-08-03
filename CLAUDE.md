# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Blackburst is an AV / live-production design tool: a single-page React app where a shell (rail / topbar / optional tabs / status bar / ⌘K command palette) surfaces six self-contained modules — LED Wall Builder (`wall`), System Designer (`system`), Rack Builder (`rack`), Asset & Inventory (`inv`), Documentation Hub (`docs`), Maintenance Log (`maint`). `App.tsx` renders exactly one module based on `useApp((s) => s.module)`.

The first five are **design-time** tools scoped to a project. `maint` is the one **operational** surface: venues, their installed devices, and the service history of each — global data that outlives any project. Adding a module means touching `ModuleId`, the `App.tsx` branch, `Rail.tsx`, `Tabs.tsx`, `MODULE_LABELS` in `Topbar.tsx` (a `Record<ModuleId, string>`, so `tsc` catches a miss), and `MODULE_ROWS` in `CommandPalette.tsx`.

Stack: React 18 + TypeScript (strict) + Vite + Zustand + Tailwind v4, plus **Supabase (optional)** for auth, cloud persistence, and sharing. With no Supabase env set the app runs local-only (all state in the browser via `localStorage`); once configured it gates behind email auth and persists per-user on the server. See the auth note below.

> **Auth & user accounts (implemented; dormant until Supabase is configured).** Email auth (magic link **or** 6-digit OTP code — `useAuth.signInWithMagicLink` sends both; `verifyOtp` handles the code path), per-user cloud persistence, and project sharing exist via Supabase. The master switch is `isSupabaseConfigured` (`src/lib/supabase.ts`, true when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set — copy `.env.example` to `.env.local`; Vite only reads env at startup, so restart `npm run dev` after editing):
> - **unset → local mode:** exactly the `localStorage` model described below; the auth gate is bypassed and `main.tsx` still hydrates synchronously.
> - **set → accounts mode:** `App.tsx` gates behind `AuthScreen` (magic link or OTP code via `useAuth`); after sign-in `useApp.bootstrap()` claims pending invites, loads the user's projects, hydrates the active project from the server, and hydrates the shared hardware catalog. Sign-out calls `resetSession()`. Autosave (`project-storage.ts`) upserts the active bucket to Supabase instead of `localStorage`; `switchProject`, revisions, `addProject`, delete, and import become async server calls. Projects are owned + shared via `project_members` (owner/editor/viewer), invited by email through `SharePanel`/`useShare`; viewers are read-only, enforced by RLS server-side and by `project.role !== "viewer"` gating in `Topbar.tsx` client-side. Realtime refreshes collaborators (last-write-wins, not CRDT). Server access lives in `src/lib/project-remote.ts`; first-login import in `src/lib/migrate-local.ts`; schema + RLS in `supabase/migrations/`; setup in `supabase/README.md`.
> - **Server writes are best-effort and never block the UI.** Catalog writes, `updateCurrentProject`, `insertRevision`, and `claimInvites` all `.catch(() => {})` — a viewer's RLS-denied write or a table that doesn't exist yet must never stall an edit. That means a missing migration fails *silently*; if server-backed data seems not to persist, check the migrations have actually been run. **Autosave is the exception**: still fire-and-forget, but its outcome is reported through `useSaveStatus` (`pending → saving → saved | error`) and rendered in the status bar, so a failed write no longer looks identical to a successful one. Route any new save path through that store rather than swallowing the error.
>
> Both modes share the same bucket shape (`snapshotCurrent()` / `applyState()`), so the `SPECS` + `scaffoldBucket()` rules below still apply unchanged — a new persisted field must be added in all the same places **and** it travels in the server JSONB automatically. `Project` carries `code` (display ref like `PRJ-2451`; `id` is a server UUID in accounts mode), `ownerId`, and `role`.

## Commands

- `npm run dev` — Vite dev server on port 5173 (`host: true`, exposed on the network).
- `npm run build` — `tsc -b && vite build`.
- `npm run typecheck` — `tsc -b --noEmit`.
- `npm run preview` — serve the production build.

There is **no test runner and no separate linter/formatter** (no ESLint/Prettier/Biome). The strict `tsc` compiler is the only static gate — it runs with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`, so unused imports/vars and dead code fail the build. After any change, run `npm run typecheck && npm run build` before reporting done. For UI changes, also smoke-test in the browser (start `npm run dev`, drive via Playwright MCP).

⚠️ **`.env.local` on this machine holds live Supabase credentials**, so a plain `npm run dev` boots into *accounts* mode and stops at the auth gate. To exercise local mode, blank the vars for that run: `env VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" npx vite --port 5174`.

The app uses **in-app dialogs, not native ones** — drive them through the DOM (`.dialog-panel`, `.dialog-input`, the confirm/cancel buttons in `.dialog-actions`); overriding `window.prompt`/`confirm`/`alert` in an `evaluate` no longer intercepts anything.

Deployed on Vercel from `main` (`vercel.json` pins the Vite preset + `dist`); accounts mode needs the two `VITE_SUPABASE_*` vars set in the Vercel project.

Path alias: `@/` → `src/` (set in both `vite.config.ts` and `tsconfig.app.json`).

## State architecture (read before touching any store)

Per-project state spans three layers; how they interact is the one thing you can't infer from a single file. Three further layers are deliberately project-*independent* and must never be added to `SPECS` — the hardware catalog, the device registry, and venues + their maintenance log, each covered below.

1. **Per-module Zustand stores** — `useLedWall`, `useSystem`, `useRack`, `useInventory`, `useDocs` (each `src/modules/<name>/store.ts`), plus `useCmdkRecents`. Those six are exactly the keys in `SPECS` (below). They hold all project data and **have no persistence of their own** — the `persist` middleware was removed; do not re-add it. Everything else is either a global layer (`useCatalog`, `useDevices` — see below) or ephemeral UI state that is deliberately *not* in `SPECS`: `useCmdk` / `useSettings` (panel open flags), `useDialog`, `useSaveStatus`, `useAuth`, `useShare`.

2. **`useApp`** (`src/store/useApp.ts`) — shell/global state: current `module`, `tweaks` (density/accent/shell/canvasStyle), the `projects` list, current project, and per-project `revisions`. It persists itself under key `blackburst:app:v1` (the only module-agnostic store that uses `persist`; `useCatalog` persists too, but by hand — see below). Invariant: **the workspace is never left empty** — `deleteCurrentProject` / `leaveCurrentProject` seed a fresh scaffolded project when the last one goes away.

3. **`src/lib/project-storage.ts` — the single source of truth for per-project module state.** It keeps a `SPECS` registry mapping each module store to `{ fields, defaults, store }` and persists every project's snapshot under `blackburst:projects:v1`.
   - `initProjectState()` runs **synchronously in `main.tsx` before React renders**, hydrating the module stores from the current project's bucket. In accounts mode `main.tsx` skips it and `initProjectStateFromServer()` runs during `bootstrap()` instead.
   - `switchProject(from, to)` (called by `useApp.setCurrentProjectId`) snapshots the live stores into `from`'s bucket, then loads `to`'s bucket (falling back to `defaultBucket()`).
   - **Autosave** (replaced the removed `persist` middleware): `startAutosave` subscribes every store on init, so any change writes the active project's bucket via a 250ms-debounced `saveCurrentBucket`; `pagehide` + `visibilitychange→hidden` flush immediately for reload/close. An `applying` flag held during `applyState` suppresses these writes so loading a bucket never echoes back as a save — **preserve that guard if you add new load paths.**
   - **Two guards, not one.** In accounts mode `applyRemote` (the realtime handler) additionally bails while `saveTimer != null`, so an incoming collaborator write can't clobber local edits that haven't been flushed yet; it resumes once the debounce fires. Keep both `applying` and the pending-save check intact.
   - A brand-new project (`useApp.addProject`) is seeded by `scaffoldBucket()` — a clean canvas (one empty wall, empty system/rack/inventory, a Documents root + Overview doc), *not* `defaultBucket()`'s seed.
   - **`migrateBucket()` is the one place a persisted-shape migration lives.** Every load path funnels through `applyState`, so upgrading an older bucket (e.g. the pre-multi-rack `{ items, rackSize }` shape → `racks[]`) belongs there and nowhere else. `useApp` keeps its own separate `persist` `migrate` at `version: 2` for the shell key.

   ⚠️ **When you add a persisted field to a module store, also add it to that store's `SPECS.<key>.fields` and `defaults` — and to the matching module in `scaffoldBucket()`.** Otherwise it is wiped on every project switch, never hydrated on load, and missing from newly-created projects. Conversely, **transient fields are deliberately omitted from `SPECS.fields`** (e.g. `measureFrom`, `panelSearch`, drag state) so they never persist or travel between projects — keep new ephemeral state out of the registry too.

`src/lib/project-io.ts` exports/imports a whole project as a `blackburst-project` JSON snapshot (writes `version` 3, reads 2–3) via `snapshotCurrent()` / `applyState()` / `writeBucket()`.

## Hardware catalog (global, not per-project)

Each module draws its palette/pickers from a built-in seed catalog that users can extend at runtime. Four libraries, one pattern:

| library | built-in | merged binding | setter | data file |
| --- | --- | --- | --- | --- |
| `rack` | `RACK_BUILTIN` | `RACK_CATALOG` | `setCustomRackDefs` | `lib/rack-data.ts` |
| `system` | `SYSTEM_BUILTIN` | `SYSTEM_DEVICES` | `setCustomSystemDefs` | `lib/system-data.ts` |
| `panel` | `PANEL_BUILTIN` | `PANEL_LIBRARY` | `setCustomPanelDefs` | `lib/data.ts` |
| `inv` | `INV_MODEL_BUILTIN` | `INV_MODELS` | `setCustomInvModels` | `lib/inventory-data.ts` |

- The merged binding is an **`export let` reassigned by the setter** — ES module live bindings propagate the new array to every importer, which is how store-level math (`RACK_CATALOG.find(...)` inside `useRack`) sees user-added gear without importing a store. **Never copy or destructure the binding at module scope** (`const cat = RACK_CATALOG` freezes it); read it inside the function/render that needs it.
- Live bindings don't trigger React re-renders. Module surfaces subscribe to `useCatalog((s) => s.rack | .system | .panel | .inv)` to re-render; the setters exist for the non-React consumers.
- **`useCatalog` (`src/store/useCatalog.ts`) is global and project-independent** — user-added gear is deliberately *not* in a project bucket, so it must never be added to `SPECS`. Local mode persists it by hand to `blackburst:catalog:v1` (`lib/catalog-storage.ts`); accounts mode writes one row per item to `public.catalog_items` (`lib/catalog-remote.ts`), an org-wide shared library any signed-in user can read and extend, deletable only by its contributor.
- **To tell a user item from a built-in, test membership in the `useCatalog` slice** — every module surface does `customList.some((d) => d.id === def.id)` and only renders the delete affordance when true (built-ins aren't deletable). There is deliberately no `isCustom*` helper in the data files — the three that once existed had no call sites and were deleted.
- Adding a fifth library means touching all of it: a `CustomCatalog` key, a built-in + live binding + setter in the data file, store slice + add/remove/hydrate in `useCatalog`, and the `hydrateFromServer` branch.
- Keep built-in ids stable — `WALL_LAYOUTS`, `DEFAULT_RACKS`, and `scaffoldBucket()` reference them.

## Device registry (global, not per-project)

Distinct from the catalog: a catalog entry is a *model* ("ATEM 4 M/E"), a `Device` is *one physical unit* ("the ATEM in rack 2, serial 12345"). Rack items, graph nodes, and inventory assets each carry an optional `deviceId` pointing into the registry, so the same box appears in three modules as one record instead of three unrelated ones.

- **`useDevices` is global and project-independent**, for the same reason `useCatalog` is: a physical box outlives the project that specified it, and its service history has to survive a project switch. It was a `SPECS` key until the registry was promoted out — **never put it back**, or every project switch wipes it. Local mode persists to `blackburst:devices:v1` (`lib/device-storage.ts`); accounts mode writes one row per device to `public.devices` (`lib/device-remote.ts`, `supabase/migrations/0003_devices.sql`), hydrated in `bootstrap()`.
- **Legacy per-project devices are hoisted once** by `lib/migrate-devices.ts` (local: from the `useDevices` module initializer; accounts: from `bootstrap()`, one fetch per project, flag-guarded). It dedupes **by id only, never by serial** — an id is referenced by rack items, nodes and assets inside its own project, so collapsing two records for the same physical box would orphan whichever reference lost. Cross-project duplicates are left for the user to merge.
- **The registry never reaches back into the modules.** Ownership is one-directional: modules reference devices by id; `useDevices` knows nothing about racks, nodes or assets. Keep it that way — it's why the store has no module imports.
- `Device.venueId` is the optional home venue for installed gear; unset means fleet / touring stock. It's set from the Maintenance Log, not from the design modules.
- `DeviceLink` (`src/components/DeviceLink.tsx`) is the single UI for link / create / unlink, dropped into each module's inspector. It discovers a device's other appearances by scanning the three stores for matching `deviceId`, and renders them as `RefChip`s; pass `omit` so the panel doesn't link back to itself. Note that scan only covers the **loaded** project — a device used in another project shows no "also appears in" rows, because that project's stores aren't in memory.
- `RefChip` + `goto()` are the cross-module jump: `RefKind` is `"asset" | "wall" | "node" | "doc" | "rack-item"`, and a rack-item ref is `"<rackId>:<iid>"` because item ids are only unique within a rack.

## Venues & maintenance log (global, not per-project)

The `maint` module's data is the third project-independent layer, for the same reason as the other two: a venue is a physical place whose service history spans years and many projects, so it cannot live in a project bucket.

- `useVenues` (venues) and `useMaintenance` (entries) both persist by hand — `blackburst:venues:v1` / `blackburst:maintenance:v1` locally, `public.venues` / `public.maintenance_entries` in accounts mode (`lib/maintenance-remote.ts`, `supabase/migrations/0004_venues_maintenance.sql`), hydrated in `bootstrap()`. Neither is a `SPECS` key.
- **`useMaintenance` also holds the module's ephemeral view state** (`selectedVenueId`, `selectedEntryId`, `selectedDeviceId`, `kindFilter`, `openOnly`). It has no project bucket to travel in, and only `entries` is ever written to storage — so unlike the design modules, the split between persisted and transient here is enforced by what the store's actions save, not by `SPECS.fields`.
- A `MaintenanceEntry` is keyed to `venueId` + `deviceId`; the device comes from the global registry, which is why step one had to land first. Deleting a venue leaves its entries in storage but unreachable — the confirm dialog says so rather than silently cascading.
- Every readout in the module (`ENTRIES`, `OPEN`, `DEVICES`, `LAST SERVICE`) derives from the venue's real entries, and reports venue totals rather than the filtered view. There is no MTBF or uptime figure — see the no-fabricated-readouts rule below.

## Conventions

**No fabricated readouts.** Three audit sweeps (`2a4876d`, `882a92e`, `9516fff`) stripped every invented number, dead button, and contradictory total out of the UI, and it must stay that way. Every figure on screen has to trace to project state or a sourced constant: wall resolution multiplies `Panel.pxW/pxH` by the panel count (dividing wall-mm by pitch compounds a rounding error), processor headroom uses the selected processor's `pixelCapacity` from `led-processor-data.ts`, patch rows derive from the graph. If a value can't be derived, don't render it — and don't ship a control that does nothing.

**Cross-module navigation** — use `goto(target)` from `src/lib/nav.ts` to switch module *and* select a target id (`asset`/`wall`/`node`/`doc`/`rack-item`) in one call; this is how linked references work. Use `useApp.getState().setModule(...)` only for a plain module switch with no target.

**Pure compute/validation modules are store-free** — `led-wall/validation.ts` and `inventory/validation.ts` are pure functions consumed by both the module surface and the global `StatusBar`; `led-wall/calculations.ts` (panel / power / resolution / processor math) imports only `@/types` plus the `led-processor-data` table. Don't import stores into any of them.

**Derived values with optional overrides** — the System Designer patch sheet is the reference implementation. Rows are recomputed from `nodes`/`edges` on every render (`buildPatchRows`), while `SystemEdge.srcPort` / `destPort` / `cable` are *optional* overrides: unset means "use the derivation", and clearing the field drops the override instead of storing `""`. `data-custom` on `.tbl-input` renders derived values muted, so a designer can see at a glance which figures are the app's assumption. An edge is identified by its `from | to | lane` triple — `addEdge` dedupes on it, and it's the key `updateEdge` / `removeEdge` take.

**Exports — CSV and print.** Tabular exports go through `lib/export-csv.ts`: `downloadCsv` does RFC 4180 quoting and prepends a UTF-8 BOM (model names carry commas and `×`, which Excel otherwise mangles); `stamp()` supplies the `YYYY-MM-DD` filename suffix. Printable documents wrap content in `<PrintSheet title subtitle>` — hidden on screen, revealed by the `@media print` block in `index.css` on a white page with a project / client / revision header — triggered by a plain `window.print()` button. Only the active module is mounted, so exactly one `PrintSheet` exists at a time.

**Pure-data vs. JSX-data (docs)** — `docs-tree.ts`, `docs-comments.ts`, `docs-versions.ts` are pure data with no React/store imports (so stores can import them without cycles); `docs-data.tsx` re-exports them and adds the JSX stock-body components. Import the pure-data files from stores, never `docs-data.tsx`.

**Store reads inside listeners/handlers** — use `useStore.getState()` (not a hook subscription) to avoid stale closures, especially in window-level `keydown`/`mousemove` handlers.

**Styling** — reuse existing class names from `src/index.css` (~2200 lines) rather than inventing classes or adding inline styles. Common: `.tb-btn` (+ `.primary` / `.danger`), `.icon-btn`, `.fld`, `.section-h`, `.kv`, `.readout-grid`, `.list-row`, `.tbl-input`, `.insp-textarea`, `.pane-hd` / `.pane-body`, `.search`, `.status-pill`, `.chip`. Note `.dialog-input` belongs to `DialogHost` — don't borrow it for inspector fields, or selectors matching the live dialog break. Accent color is driven by `--accent*` CSS vars set from `useApp` tweaks; density/shell via `data-density` / `data-shell` on `<html>`.

**Icons** — `src/components/Icon.tsx` exports an `I` map: Bolt, Check, Chev, Cross, Docs, Edit, Export, Eye, File, Folder, Grid, Inventory, Layers, Lock, Move, Pin, Plus, Rack, Search, Settings, System, Undo, Wall, Wrench. There is **no Trash icon — use `Cross` for delete/remove**.

**Interactions** — use the in-app dialogs, never native `window.prompt` / `confirm` / `alert`. Import `promptDialog` / `confirmDialog` / `alertDialog` from `@/store/useDialog` (promise-based, styled like the shell; a single always-mounted `<DialogHost/>` in `App.tsx` renders them). They mirror native semantics — `promptDialog` resolves the string or `null`, `confirmDialog` resolves a boolean — but are **async**, so the calling handler must be `async`/`await` (chained prompts become sequential `await`s). Pass `{ danger: true, confirmLabel: "Delete" }` for destructive confirmations. The docs unsaved-edits `leaveGuard` may return `boolean | Promise<boolean>`; `useDocs.setActive` awaits it.

**Regex** — tokenize with `String.matchAll(...)`, not `RegExp.prototype.exec` (the codebase avoids `exec`; a security hook has flagged it). See `MarkdownBody.tsx`.

**Comments & dead code** — default to no comments; only annotate a non-obvious *why* (hidden constraint, invariant, workaround). Delete dead code instead of leaving `// removed` markers, back-compat shims, or `_`-prefixed unused vars (strict `noUnused*` fails the build regardless).

**Established UI patterns** (match, don't reinvent) — drag-from-palette uses the custom MIME `application/x-blackburst-palette`; click-vs-drag is distinguished by a 3px `Math.hypot(dx, dy)` threshold; window-level keyboard handlers guard against typing via an input check (`tagName === "INPUT"|"TEXTAREA"` or `contentEditable`).

## Reference material (not build inputs)

- `handoff.md` is an older session log. Its claim that module stores use `persist` middleware is **outdated** — superseded by the model above. Treat its per-module status notes as historical.
- `design_handoff_stagekit/` is the original HTML/JSX design-reference prototype (StageKit) that `src/` was ported from. It is **not** wired into the build — never import from it; consult it only for intended look and behavior.
