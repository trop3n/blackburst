# Blackburst — Session Handoff

## Project

Blackburst is an AV/live-production design tool. React 18 + TypeScript + Vite + Zustand. Five modules surfaced through a shell:

- **LED Wall Builder** (`src/modules/led-wall`)
- **System Designer** (`src/modules/system-designer`)
- **Rack Builder** (`src/modules/rack-builder`)
- **Asset & Inventory** (`src/modules/inventory`)
- **Documentation Hub** (`src/modules/docs`)

The work in progress is moving each module from prototype/decorative surface to functional behavior. Most modules are now wired; Docs is the next target.

## Build / verify

- `npx tsc --noEmit` — typecheck
- `npx vite build` — production build (~1.5s)
- `npm run dev` — local dev server
- After any change, run typecheck + build before reporting done. UI changes should be exercised in the browser too.

## Architecture conventions

- **Per-module Zustand store** with `persist` middleware. Persist keys are versioned (e.g. `blackburst:inventory:v2`). Bump the version when promoting fields into a store.
- **Per-project state buckets** live in `src/lib/project-storage.ts`. Each module's store is registered in `SPECS` with its persisted `fields` and `defaults`. `switchProject` snapshots current state and loads the target bucket; `applyState` merges defaults under incoming slice. Add new persisted fields here too or they will be wiped on project switch.
- **Transient state** (e.g. `draggingIid`) is excluded from `SPECS.fields` and from `partialize` so it never persists.
- Cross-module nav goes through `goto(...)` in `src/lib/nav.ts`. Use `useApp.getState().setModule(...)` only for direct module switches without a target id.
- Validation modules (e.g. `src/modules/led-wall/validation.ts`, `src/modules/inventory/validation.ts`) are pure functions consumed by both the module surface and the global `StatusBar`. Keep them store-free.

## Code style

- Read `index.css` and reuse existing class names. Common: `.tb-btn`, `.tb-btn.primary`, `.tb-btn.danger`, `.icon-btn`, `.fld` (label+input grid with `.fld .unit-input[data-unit="%"]`), `.section-h`, `.kv`, `.readout-grid`, `.list-row`, `.pane-hd`, `.pane-body`, `.search`, `.chip accent`, `.status-pill`.
- Icons come from `src/components/Icon.tsx` exported as `I.*`. Available: `Bolt, Chev, Cross, Docs, Export, Eye, File, Folder, Grid, Inventory, Layers, Lock, Move, Pin, Plus, Rack, Search, Settings, System, Wall`. **No Trash icon** — use `Cross` for delete/decommission.
- Use `prompt()` / `confirm()` for quick interactions; we have no modal system yet.
- Default to **no comments**. Only annotate non-obvious WHY (hidden constraint, subtle invariant, workaround).
- No backwards-compat shims, no "// removed" comments, no unused `_var` renaming — delete dead code.

## Patterns established in the recent work

- **Drag-from-palette** (System Designer): custom MIME `application/x-blackburst-palette` on the palette row, canvas handles `onDragOver`/`onDrop`, centers new node at cursor.
- **Port-drag edge draw** (System Designer): `useRef` for hot-path drag data, `useState` for visual ghost. Window-level mousemove/mouseup with shared `cleanup()`. 3px threshold via `Math.hypot(dx, dy)` to distinguish click from drag. Hit-test via `el.dataset.portDir/nodeId/lane`. Lane match required. Escape cancels.
- **Click-vs-drag** anywhere: same 3px hypot threshold.
- **Rack reposition** (Rack Builder): items are `draggable`; the slot column's `onDrop` branches between `placeItem` (palette drag) and `movePos` (in-rack drag). `hoverDef`/`hoverValid` excludes self from the fits check.
- **Keyboard handlers** (Rack Builder): window keydown listener with a guard against inputs (`tagName === "INPUT"|"TEXTAREA"` or `contentEditable`).
- **Store reads inside listeners**: use `useStore.getState()` to avoid stale closures from React renders.

## Module status

### LED Wall Builder — done
Select/draw/erase/measure tools all work. Already migrated. No outstanding stubs surfaced.

### System Designer — done (recent)
- Drag from palette adds nodes (centered at drop point, clamped ≥0).
- Inspector has IDENTITY/CONNECTIONS sections and a danger-styled `Remove node` button with confirm. Cascades to edges.
- Port drag-to-connect creates edges; lane match required; Escape cancels; visual ghost line.
- Connection row delete buttons remove single edges.

### Rack Builder — done (polished one pass)
- Click-to-select, drag-from-palette to place, **drag-to-reposition** within the rack, Delete/Backspace removes, ArrowUp/Down nudges by 1U.
- Selected item has a full-width `tb-btn danger` Remove button with a hint line below: "↑ / ↓ nudge · DEL removes · drag to reslot".
- `Spec PDF` → `window.print()`. `Add Rack` / `Edit Spec` removed (dead).
- `draggingIid` is in the store but excluded from persistence.

### Inventory — done (just finished)
- `ASSETS` migrated into `useInventory` (`blackburst:inventory:v2`). Registered in `project-storage.ts` `inv` bucket.
- Toolbar: `+ New` (prompt-driven add), Check In, Check Out (prompts for show + due).
- Left pane: live category counts, live fleet status counts, live "FLEET UTILIZATION" readout (avg + bar + asset count). Decorative SVG sparkline is gone.
- Inspector when an asset is selected:
  - IDENTITY: editable Model / Category select / Status select / Utilization (number, clamped 0–100, `%` unit).
  - ASSIGNMENT: editable Show / Due back.
  - MAINTENANCE: editable Last svc.
  - ACTIONS: full-width `tb-btn danger` **Decommission asset** button → removes from fleet, selects neighbor.
- Empty inspector state ("NO ASSET SELECTED") for when `selected` doesn't match an asset (e.g. after decommissioning the last one).
- `StatusBar` reads `useInventory.assets` (live, not the static `ASSETS` import) so the global ALL CHECKS OK / WARN / ERROR pill reflects mutations.

### Docs — **next target, not started**
Survey complete. Currently mostly decorative.

**Stubs identified:**
1. Doc content is hardcoded as the Helios Run-of-Show. `activeId` changes when you click a different doc in the tree, but the page body never updates. Biggest gap.
2. Breadcrumb (`Helios Auditorium / Run-of-Show v3.2`) and `v3.2 · CURRENT` chip are static.
3. Tree search input has no `value`/`onChange`.
4. `+` button in DOCS TREE header has no handler.
5. Preview / Export PDF buttons have no handlers.
6. RECENT DOCS rows aren't clickable.
7. Version history, Linked references, and Comments are fully static from `docs-data.ts`. Comments shows hardcoded "3 OPEN".

**Proposed one-pass punch list (user has not yet approved):**
- Move per-doc bodies into `src/lib/docs-data.ts` keyed by id; render the body for `activeId`, friendly fallback for docs without a body.
- Derive breadcrumb (parent folder name + doc name) from the tree.
- Wire tree search to filter visible nodes; auto-expand matches.
- RECENT DOCS → `setActive` on click (RECENT_DOCS row id → real doc id mapping).
- Export PDF → `window.print()`. Preview → same (or toggle a `.docs-print` class).
- `+` in tree → prompt for name; extend `useDocs` with `addDoc` to insert under the active folder (or under "Helios Auditorium" if a leaf is active).

**Hold off** on Comments add-a-comment and Version history mutations — bigger scope, not core to the read experience.

The last user message before this handoff request was approving the inventory inspector cleanup. The user has not yet greenlit the Docs punch list. **Present the punch list to the user and wait for "Go" / "Proceed" / "One pass, go" before touching code.** They have been consistent about that pattern.

## Files most relevant to the next task

- `src/modules/docs/DocsModule.tsx` — the surface to wire
- `src/modules/docs/store.ts` — currently has `activeId`, `expanded`, `setActive`, `toggle`. Add `addDoc` here.
- `src/lib/docs-data.ts` — DOC_TREE, DOC_VERSIONS, RECENT_DOCS, LINKED_REFS, DOC_COMMENTS. Per-doc bodies will likely go here too.
- `src/lib/project-storage.ts` — if you add a persisted `tree` field to `useDocs`, register it in the `docs` spec.
- `src/components/RefChip.tsx` and `src/lib/nav.ts` — for cross-references inside doc bodies.

## Git status at handoff

- Branch `main`, no checkout-blocking changes.
- Modified (uncommitted): `src/index.css`, `src/modules/system-designer/SystemDesignerModule.tsx` from this session's earlier work. Inventory + StatusBar + project-storage changes are also in the working tree.
- Recent commits show System Designer migrations, drag-to-reposition for nodes, remove-node action, LED Wall finished. The user does not auto-commit; they ask explicitly when they want a commit.

## User collaboration style

- Wants short, terse responses. No trailing recaps. End-of-turn summary is one or two sentences.
- Approves work with one-word "Go" / "Proceed" / "One pass" — implicit approval of the prior plan. Treat as binding.
- Prefers a plan + punch list before non-trivial changes, then a single bundled pass over many small ones.
- Will not micromanage; pick reasonable defaults and ship. Surface a question only if blocking.
