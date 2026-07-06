# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Blackburst is an AV / live-production design tool: a single-page React app where a shell (rail / topbar / optional tabs / status bar / ⌘K command palette) surfaces five self-contained modules — LED Wall Builder (`wall`), System Designer (`system`), Rack Builder (`rack`), Asset & Inventory (`inv`), Documentation Hub (`docs`). `App.tsx` renders exactly one module based on `useApp((s) => s.module)`.

Stack: React 18 + TypeScript (strict) + Vite + Zustand + Tailwind v4, plus **Supabase (optional)** for auth, cloud persistence, and sharing. With no Supabase env set the app runs local-only (all state in the browser via `localStorage`); once configured it gates behind email auth and persists per-user on the server. See the auth note below.

> **Auth & user accounts (implemented; dormant until Supabase is configured).** Email auth (magic link **or** 6-digit OTP code — `useAuth.signInWithMagicLink` sends both; `verifyOtp` handles the code path), per-user cloud persistence, and project sharing now exist via Supabase. The master switch is `isSupabaseConfigured` (`src/lib/supabase.ts`, true when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set):
> - **unset → local mode:** exactly the `localStorage` model described below; the auth gate is bypassed and `main.tsx` still hydrates synchronously.
> - **set → accounts mode:** `App.tsx` gates behind `AuthScreen` (magic link or OTP code via `useAuth`); after sign-in `useApp.bootstrap()` claims pending invites, loads the user's projects, and hydrates the active project from the server. Autosave (`project-storage.ts`) upserts the active bucket to Supabase instead of `localStorage`; `switchProject`, revisions, `addProject`, and import become async server calls. Projects are owned + shared via `project_members` (owner/editor/viewer), invited by email through `SharePanel`/`useShare`; viewers are read-only (RLS + disabled UI). Realtime refreshes collaborators (last-write-wins, not CRDT). Server access lives in `src/lib/project-remote.ts`; first-login import in `src/lib/migrate-local.ts`; schema + RLS in `supabase/migrations/0001_auth_sharing.sql`; setup in `supabase/README.md`.
>
> Both modes share the same bucket shape (`snapshotCurrent()` / `applyState()`), so the `SPECS` + `scaffoldBucket()` rules below still apply unchanged — a new persisted field must be added in all the same places **and** it travels in the server JSONB automatically. `Project` now carries `code` (display ref like `PRJ-2451`; `id` is a server UUID in accounts mode), `ownerId`, and `role`.

## Commands

- `npm run dev` — Vite dev server on port 5173 (`host: true`, exposed on the network).
- `npm run build` — `tsc -b && vite build`.
- `npm run typecheck` — `tsc -b --noEmit`.
- `npm run preview` — serve the production build.

There is **no test runner and no separate linter/formatter** (no ESLint/Prettier/Biome). The strict `tsc` compiler is the only static gate — it runs with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`, so unused imports/vars and dead code fail the build. After any change, run `npm run typecheck && npm run build` before reporting done. For UI changes, also smoke-test in the browser (start `npm run dev`, drive via Playwright MCP; `prompt`/`confirm`/`alert` are easiest to exercise by overriding them in an `evaluate`).

Path alias: `@/` → `src/` (set in both `vite.config.ts` and `tsconfig.app.json`).

## State architecture (read before touching any store)

State spans three layers; how they interact is the one thing you can't infer from a single file.

1. **Per-module Zustand stores** — `useLedWall`, `useSystem`, `useRack`, `useInventory`, `useDocs` (each `src/modules/<name>/store.ts`), plus `useCmdkRecents`. They hold all module data and **have no persistence of their own** — the `persist` middleware was removed; do not re-add it.

2. **`useApp`** (`src/store/useApp.ts`) — shell/global state: current `module`, `tweaks` (density/accent/shell/canvasStyle), the `projects` list, current project, and per-project `revisions`. This is the *only* store that persists itself, under key `blackburst:app:v1`.

3. **`src/lib/project-storage.ts` — the single source of truth for per-project module state.** It keeps a `SPECS` registry mapping each module store to `{ fields, defaults, store }` and persists every project's snapshot under `blackburst:projects:v1`.
   - `initProjectState()` runs **synchronously in `main.tsx` before React renders**, hydrating the module stores from the current project's bucket.
   - `switchProject(from, to)` (called by `useApp.setCurrentProjectId`) snapshots the live stores into `from`'s bucket, then loads `to`'s bucket (falling back to `defaultBucket()`).
   - **Autosave** (replaced the removed `persist` middleware): `startAutosave` subscribes every store on init, so any change writes the active project's bucket via a 250ms-debounced `saveCurrentBucket`; `pagehide` + `visibilitychange→hidden` flush immediately for reload/close. An `applying` flag held during `applyState` suppresses these writes so loading a bucket never echoes back as a save — **preserve that guard if you add new load paths.**
   - A brand-new project (`useApp.addProject`) is seeded by `scaffoldBucket()` — a clean canvas (one empty wall, empty system/rack/inventory, a Documents root + Overview doc), *not* `defaultBucket()`'s demo seed.

   ⚠️ **When you add a persisted field to a module store, also add it to that store's `SPECS.<key>.fields` and `defaults` — and to the matching module in `scaffoldBucket()`.** Otherwise it is wiped on every project switch, never hydrated on load, and missing from newly-created projects. Conversely, **transient fields are deliberately omitted from `SPECS.fields`** (e.g. `measureFrom`, `panelSearch`, drag state) so they never persist or travel between projects — keep new ephemeral state out of the registry too.

`src/lib/project-io.ts` exports/imports a whole project as a `blackburst-project` JSON snapshot (writes `version` 3, reads 2–3) via `snapshotCurrent()` / `applyState()` / `writeBucket()`.

> `handoff.md` is an older session log. Its claim that module stores use `persist` middleware is **outdated** — superseded by the model above. Treat its per-module status notes as historical.

> `design_handoff_stagekit/` is the original HTML/JSX design-reference prototype (StageKit) that `src/` was ported from. It is **not** wired into the build — never import from it; consult it only for intended look and behavior.

## Conventions

**Cross-module navigation** — use `goto(target)` from `src/lib/nav.ts` to switch module *and* select a target id (`asset`/`wall`/`node`/`doc`/`rack-item`) in one call; this is how linked references work. Use `useApp.getState().setModule(...)` only for a plain module switch with no target.

**Pure compute/validation modules are store-free** — `led-wall/validation.ts` and `inventory/validation.ts` are pure functions consumed by both the module surface and the global `StatusBar`; `led-wall/calculations.ts` (panel / power / resolution / processor math) imports only `@/types`. Don't import stores into any of them.

**Pure-data vs. JSX-data (docs)** — `docs-tree.ts`, `docs-comments.ts`, `docs-versions.ts` are pure data with no React/store imports (so stores can import them without cycles); `docs-data.tsx` re-exports them and adds the JSX stock-body components. Import the pure-data files from stores, never `docs-data.tsx`.

**Store reads inside listeners/handlers** — use `useStore.getState()` (not a hook subscription) to avoid stale closures, especially in window-level `keydown`/`mousemove` handlers.

**Styling** — reuse existing class names from `src/index.css` (~1770 lines) rather than inventing classes or adding inline styles. Common: `.tb-btn` (+ `.primary` / `.danger`), `.icon-btn`, `.fld`, `.section-h`, `.kv`, `.readout-grid`, `.list-row`, `.pane-hd` / `.pane-body`, `.search`, `.status-pill`, `.chip`. Accent color is driven by `--accent*` CSS vars set from `useApp` tweaks; density/shell via `data-density` / `data-shell` on `<html>`.

**Icons** — `src/components/Icon.tsx` exports an `I` map: Bolt, Check, Chev, Cross, Docs, Edit, Export, Eye, File, Folder, Grid, Inventory, Layers, Lock, Move, Pin, Plus, Rack, Search, Settings, System, Undo, Wall. There is **no Trash icon — use `Cross` for delete/remove**.

**Interactions** — use the in-app dialogs, never native `window.prompt` / `confirm` / `alert`. Import `promptDialog` / `confirmDialog` / `alertDialog` from `@/store/useDialog` (promise-based, styled like the shell; a single always-mounted `<DialogHost/>` in `App.tsx` renders them). They mirror native semantics — `promptDialog` resolves the string or `null`, `confirmDialog` resolves a boolean — but are **async**, so the calling handler must be `async`/`await` (chained prompts become sequential `await`s). Pass `{ danger: true, confirmLabel: "Delete" }` for destructive confirmations. The docs unsaved-edits `leaveGuard` may return `boolean | Promise<boolean>`; `useDocs.setActive` awaits it.

**Regex** — tokenize with `String.matchAll(...)`, not `RegExp.prototype.exec` (the codebase avoids `exec`; a security hook has flagged it). See `MarkdownBody.tsx`.

**Comments & dead code** — default to no comments; only annotate a non-obvious *why* (hidden constraint, invariant, workaround). Delete dead code instead of leaving `// removed` markers, back-compat shims, or `_`-prefixed unused vars (strict `noUnused*` fails the build regardless).

**Established UI patterns** (match, don't reinvent) — drag-from-palette uses the custom MIME `application/x-blackburst-palette`; click-vs-drag is distinguished by a 3px `Math.hypot(dx, dy)` threshold; window-level keyboard handlers guard against typing via an input check (`tagName === "INPUT"|"TEXTAREA"` or `contentEditable`).
