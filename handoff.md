# Blackburst — Session Handoff

## Project

Blackburst is an AV/live-production design tool. React 18 + TypeScript + Vite + Zustand. Five modules surfaced through a shell:

- **LED Wall Builder** (`src/modules/led-wall`)
- **System Designer** (`src/modules/system-designer`)
- **Rack Builder** (`src/modules/rack-builder`)
- **Asset & Inventory** (`src/modules/inventory`)
- **Documentation Hub** (`src/modules/docs`)

All five modules are functional. Recent sessions focused on Docs (the last hold-out) and shell polish (tabs/palette shells, ⌘K palette). Working tree is clean on `main`.

## Build / verify

- `npx tsc --noEmit` — typecheck
- `npx vite build` — production build (~1.1s)
- `npm run dev` — local dev server
- After any change, run typecheck + build before reporting done. UI changes should be exercised in the browser too (Playwright MCP works for smoke tests; `window.confirm`/`prompt`/`alert` are easiest to test by overriding them in an `evaluate`).

## Architecture conventions

- **Per-module Zustand store** with `persist` middleware. Persist keys are versioned (`blackburst:docs:v2`, `blackburst:inventory:v2`, etc.). Bump the version when promoting fields into a store.
- **Per-project state buckets** live in `src/lib/project-storage.ts`. Each module's store is registered in `SPECS` with persisted `fields` and `defaults`. `switchProject` snapshots current and loads target; `applyState` merges defaults under incoming slice. **Add new persisted fields here too or they will be wiped on project switch.**
- **Transient state** (e.g. `draggingIid`) is excluded from `SPECS.fields` and from `partialize` so it never persists.
- Cross-module nav goes through `goto(...)` in `src/lib/nav.ts`. Use `useApp.getState().setModule(...)` only for direct module switches without a target id.
- Validation modules (`src/modules/led-wall/validation.ts`, `src/modules/inventory/validation.ts`) are pure functions consumed by both the module surface and the global `StatusBar`. Keep them store-free.
- **Pure-data files** to break circular imports: `docs-comments.ts`, `docs-versions.ts`, `docs-tree.ts` are pure data with no React/store imports — `docs-data.tsx` re-exports them and adds the JSX body components.

## Code style

- Read `index.css` and reuse existing class names. Common: `.tb-btn`, `.tb-btn.primary`, `.tb-btn.danger`, `.icon-btn`, `.fld`, `.section-h`, `.kv`, `.readout-grid`, `.list-row`, `.pane-hd`, `.pane-body`, `.search`, `.chip accent`, `.status-pill`.
- Icons in `src/components/Icon.tsx` exported as `I.*`. Available: `Bolt, Check, Chev, Cross, Docs, Edit, Export, Eye, File, Folder, Grid, Inventory, Layers, Lock, Move, Pin, Plus, Rack, Search, Settings, System, Undo, Wall`. **No Trash icon** — use `Cross` for delete/decommission.
- Use `prompt()`/`confirm()`/`alert()` for quick interactions; no modal system. Override these in Playwright `evaluate` to test.
- Default to **no comments**. Only annotate non-obvious WHY (hidden constraint, subtle invariant, workaround). Don't reference current task/fix/callers — that's PR description territory.
- No backwards-compat shims, no "// removed" comments, no unused `_var` renaming — delete dead code.

## Patterns established

- **Drag-from-palette** (System Designer / Rack Builder): custom MIME `application/x-blackburst-palette` on palette row, canvas handles `onDragOver`/`onDrop`, centers new node at cursor.
- **Port-drag edge draw** (System Designer): `useRef` for hot-path drag data, `useState` for visual ghost. Window-level mousemove/mouseup with shared `cleanup()`. 3px threshold via `Math.hypot(dx, dy)` to distinguish click from drag. Hit-test via `el.dataset.portDir/nodeId/lane`. Lane match required. Escape cancels.
- **Click-vs-drag** anywhere: 3px hypot threshold.
- **Keyboard handlers**: window keydown listener with input guard (`tagName === "INPUT"|"TEXTAREA"` or `contentEditable`). For textarea-scoped shortcuts (e.g. doc editor Save/Cancel), bind to the textarea's own `onKeyDown`.
- **Store reads inside listeners**: use `useStore.getState()` to avoid stale closures.
- **Dirty-state guard** (Docs editor): track initial draft on edit start, compare against current on switch/add; `confirm()` only fires when actually dirty. Pattern: `confirmDiscard()` helper returns bool, called from `guardedSetActive`, `onAdd`, etc.
- **Hover-action icons** (Docs tree): right-aligned `<span class="docs-node-actions">` inside each row, `display:none` → `inline-flex` on `.docs-node:hover`. Buttons `stopPropagation` so they don't fire the row click.
- **MarkdownBody renderer** (`src/modules/docs/MarkdownBody.tsx`): handles h1-h3, paragraphs, `- `/`* ` bullets, fenced code blocks, inline `**bold**`/`*italic*`/`` `code` ``. **Uses `Array.from(s.matchAll(pattern))` for tokenizing — the project security hook flags any RegExp `exec` call, so prefer `matchAll`.**
- **Persist version bumps**: docs went from no persist → v1 (tree+activeId+expanded) → v2 (added recentIds, bodies, comments, versions). When adding a persisted field, also add to `project-storage.ts` `SPECS.docs.fields` and `defaults`.

## Module status

### LED Wall Builder — done
Select/draw/erase/measure tools work. No outstanding stubs.

### System Designer — done
- Drag-from-palette adds nodes (centered, clamped ≥0).
- Inspector IDENTITY/CONNECTIONS sections + danger-styled `Remove node` with confirm.
- Port drag-to-connect; lane match required; Escape cancels; visual ghost.
- Connection-row delete removes single edges.
- `canvasStyle` reads from `useApp((s) => s.tweaks.canvasStyle)` (was hardcoded "schematic").

### Rack Builder — done
- Click-to-select, drag-from-palette to place, drag-to-reposition, Delete/Backspace removes, ArrowUp/Down nudges 1U.
- Selected item has full-width `tb-btn danger` Remove with hint line.
- `Spec PDF` → `window.print()`.
- `canvasStyle` reads from `useApp` like System Designer.

### Inventory — done
- `ASSETS` lives in `useInventory` (`blackburst:inventory:v2`).
- Toolbar: `+ New`, Check In, Check Out (prompts for show + due).
- Live category counts, fleet status counts, FLEET UTILIZATION readout.
- Inspector IDENTITY/ASSIGNMENT/MAINTENANCE/ACTIONS sections with `Decommission asset` button.
- Empty inspector state for missing/decommissioned selection.
- `StatusBar` reads live store (not the static `ASSETS` import).

### Docs — done
Functional end-to-end. Most recent session's work:

- **In-place body editor.** `useDocs.bodies` (`Record<docId, markdown>`), `setBody`/`clearBody`. Edit mode swaps `.docs-page` for a textarea. Render priority: `customBody` (MarkdownBody) → `stockBody` JSX → empty-state fallback.
- **Edit-mode shortcuts.** `⌘↵`/`Ctrl+↵` saves, `Esc` cancels (textarea `onKeyDown`). Hint shown in toolbar.
- **Dirty-state guard.** `confirmDiscard()` checks `editing && bodyDraft !== bodyDraftInitial`. Used by `guardedSetActive` (tree rows + RECENT rows) and `onAdd`. External setActive callers (cmdk, `goto`) **bypass this** — known gap, see below.
- **Revert to stock.** Button visible only when both `customBody !== undefined && stockBody !== undefined`. Calls `clearBody(activeId)` after confirm.
- **Tree rename + delete.** Hover icons (Edit + Cross) on each row. Rename → `prompt` pre-filled with current name. Delete refuses non-empty folders via `alert`; cascades cleanup of bodies/comments/versions/recentIds/expanded; reassigns `activeId` to a still-present recent → first remaining doc.
- **Preview overlay.** Full-screen `.docs-preview-overlay` shows the same body renderer, Escape exits, Export PDF still calls `window.print()`.
- **Earlier work (still standing):** per-doc bodies, derived breadcrumb, tree search with auto-expand, RECENT DOCS with real history (recentIds, MAX 6), add-doc, comment composer (`addComment`), version mutations (`addVersion`, `bumpVersion`).

## Open polish items

Surface these as options on the next session if the user asks "what's next":

1. **Markdown links** — `[text](url)` not parsed by `MarkdownBody.renderInline`. Small (~10 lines).
2. **Print stylesheet** — Export PDF currently includes the rail + topbar + panes. Add `@media print` rules to show only `.docs-page` content.
3. **External setActive bypass** — cmdk palette and `goto()` from linked references skip `guardedSetActive`, so a dirty editor gets silently reset by the `useEffect([activeId])` safety net. Would need either store middleware or wiring the guard through useApp's nav layer.
4. **Version restore** — `addVersion` records `{v, who, when, note}` but doesn't snapshot the body. Versions are write-only; no way to view/restore old content. Bigger lift: requires adding `body` field to `DocVersion` and a "Restore this version" affordance.
5. **Comments edit/delete** — `addComment` works; no way to remove your own comment or edit it.
6. **Drag-reorder tree** — not critical; the existing drag/drop pattern (palette MIME) could be adapted.

## User collaboration style

- Terse responses. No trailing recaps. End-of-turn: one or two sentences.
- Approves with one-word "Go" / "Proceed" / "One pass" — binding.
- Wants a plan + punch list before non-trivial changes, then a single bundled pass (not many small ones).
- Asks proactively for polish suggestions ("any further refining necessary that you can see?") — respond with 2-3 concrete options + tradeoffs, recommend one, let user pick.
- Does not auto-commit; will explicitly ask for commits/PRs.
- Smoke-tests in browser are expected for UI work; `npx tsc --noEmit && npx vite build` for code-only changes.

## Files most relevant to Docs follow-up

- `src/modules/docs/DocsModule.tsx` — surface, editor wiring, hover actions, preview overlay
- `src/modules/docs/MarkdownBody.tsx` — renderer (extend `renderInline` for links)
- `src/modules/docs/store.ts` — `useDocs`: tree CRUD, bodies, comments, versions
- `src/lib/docs-data.tsx` — re-exports pure-data modules + stock JSX bodies map
- `src/lib/docs-tree.ts` / `docs-comments.ts` / `docs-versions.ts` — initial data
- `src/lib/project-storage.ts` — `SPECS.docs.fields`/`defaults` (touch when adding persisted state)
- `src/components/Icon.tsx` — `Edit`, `Check`, `Undo` added recently

## Git status at handoff

- Branch `main`, working tree clean, up to date with `origin/main`.
- Last commit: `5778239 Tree rename + delete wired in`.
- Prior to that: editor shortcuts, dirty-state guard, revert-to-stock, in-place body editor, ⌘K recents/fuzzy/modes, version mutations, comment composer.
