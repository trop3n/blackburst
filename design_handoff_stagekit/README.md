# Handoff: STAGEKIT — AV/Live Production Suite

## Overview

STAGEKIT is a multi-module application for AV systems integrators and live production teams. It bundles five tools into a single workspace:

1. **LED Wall Builder** — design LED video walls with live calculation of resolution, weight, power draw, processor allocation, and rigging load.
2. **System Designer** — visual node graph for video / audio / network / power signal flow plus a tabular patch sheet.
3. **Rack Builder** — drag-to-build 19" server rack spec (24U / 42U / 48U) with U-usage, weight, power, thermal, and circuit math.
4. **Asset & Inventory** — fleet table with status (in / out / maintenance), utilization analytics, and a 14-day Gantt schedule for show / job assignment.
5. **Documentation Hub** — file tree, run-of-show / SOP authoring with cross-links to assets and walls, version history, comments.

The intended user is an AV systems integrator or production operator. The design is high-density, technical, and utilitarian — modeled after professional CAD/DAW tools.

## About the Design Files

The files in this bundle are **design references created in HTML/JSX** — prototypes that show the intended look and behavior. They are **not** production code to copy directly. The HTML uses inline Babel/JSX in the browser, global window-scoped components, and sample data hard-coded in `data.jsx` — none of which is appropriate for a real codebase.

Your task is to **recreate these designs in the target codebase's existing environment** (React + TypeScript + a styling system of your choice such as Tailwind, CSS Modules, vanilla-extract, etc.), using its established patterns, state management, data fetching, and component libraries. If no environment exists yet, choose the most appropriate stack — a recommended baseline is **React + TypeScript + Vite + Tailwind CSS + Zustand (or React Query) + react-flow** (for the System Designer node graph).

## Fidelity

**High-fidelity.** Colors, typography, spacing, and interactions are final. Recreate the UI pixel-perfectly. The exception: sample data (catalog items, asset IDs, run-of-show copy) is illustrative — replace with real data flows.

## Design Tokens

All tokens are defined as CSS custom properties in `styles.css`. Port them to your design-token system.

### Colors (dark theme)

| Token | Value | Use |
| --- | --- | --- |
| `--bg-0` | `#0a0b0c` | App background, deepest |
| `--bg-1` | `#101113` | Side panels, topbar, statusbar |
| `--bg-2` | `#16181b` | Center canvas, inset surfaces |
| `--bg-3` | `#1c1f23` | Hover state |
| `--bg-4` | `#24282d` | Active / pressed |
| `--line` | `#1f2226` | Primary borders |
| `--line-strong` | `#2a2e34` | Emphasized borders, control outlines |
| `--line-faint` | `#15171a` | Subtle row dividers |
| `--fg` | `#e6e8ea` | Primary text |
| `--fg-mute` | `#9aa0a6` | Secondary text |
| `--fg-faint` | `#5b6066` | Tertiary text, labels |
| `--fg-ghost` | `#3a3e44` | Disabled, hint text |

### Accent colors (oklch)

The accent is theme-driven; default is "acid green":

| Theme | oklch |
| --- | --- |
| Acid green (default) | `oklch(0.86 0.19 145)` |
| Amber (broadcast) | `oklch(0.82 0.17 70)` |
| Cyan (signal) | `oklch(0.82 0.13 220)` |
| Magenta (video) | `oklch(0.78 0.22 330)` |
| Mono | `oklch(0.96 0 0)` |

Each accent is used at three opacities: full, 0.18 (`--accent-dim`), 0.08 (`--accent-faint`).

### Status colors

| Token | Value | Use |
| --- | --- | --- |
| `--warn` | `oklch(0.78 0.16 75)` | Amber — warnings, "out" status |
| `--err` | `oklch(0.68 0.21 25)` | Red — fault, maintenance |
| `--info` | `oklch(0.78 0.13 230)` | Blue — audio / network lane |
| `--magenta` | `oklch(0.72 0.22 330)` | Video lane |

### Typography

- **Sans (UI body)**: Inter, weights 400/500/600 — `font-feature-settings: "ss01", "cv11"`
- **Mono (numerics, labels, IDs)**: JetBrains Mono, weights 400/500/600/700 — `font-variant-numeric: tabular-nums`

Sizes: `--fs-xs: 10.5px`, `--fs-sm: 11.5px`, `--fs-md: 12.5px`, `--fs-lg: 14px`, `--fs-xl: 18px`. Use mono for any number, ID, coordinate, or technical label; sans for prose and item names.

### Density

Driven by `[data-density]` on `<html>`:
- `compact`: `--u: 3px`, `--row-h: 24px`
- `normal` (default): `--u: 4px`, `--row-h: 28px`
- `cozy`: `--u: 5px`, `--row-h: 32px`

### Spacing & rhythm

8px grid for layout regions; 4px for inner control padding. List rows are `--row-h` tall. Section headers use `font-size: var(--fs-xs)`, `text-transform: uppercase`, `letter-spacing: 0.08em`.

### Borders & radius

Almost all surfaces use 1px hairline borders (no shadows except on the accent glow and selection ring). Border radius is small: `2px` (chips, inputs, buttons), `3-4px` (panels, larger cards). Avoid heavy radii.

### Glow / focus

The accent gets a subtle `box-shadow: 0 0 8px var(--accent-dim)` only on the rail logo dot, status-bar live dot, and selected LED-wall frame. Selected node/asset/panel uses `box-shadow: 0 0 0 2px var(--accent-faint)` ring.

## App Shell

```
┌──┬───────────────────────────────────────────────────────┐
│  │ TOPBAR (project pill, breadcrumb, ⌘K, export, save)  │
│  ├───────────┬─────────────────────────┬─────────────────┤
│ R│  LEFT     │   CENTER                │  RIGHT          │
│ A│  PANE     │   (canvas + meters)     │  (inspector)    │
│ I│  220px    │   flexible              │  280px          │
│ L│           │                         │                 │
│  ├───────────┴─────────────────────────┴─────────────────┤
│  │ STATUS BAR                                            │
└──┴───────────────────────────────────────────────────────┘
```

- Rail: 56px wide, vertical icon+label buttons (5 modules + settings)
- Topbar: 36px, project pill + breadcrumb + ⌘K search + Export / Save Rev / avatar
- Status bar: 22px, segmented monospace readouts (READY, REV, SYNC, warnings, time)
- Three shell variants via Tweaks: `rail` (default), `tabs` (top tabs), `palette` (chrome-minimal, ⌘K-first)

## Modules

### 1. LED Wall Builder

**Layout**: 3-pane (Walls list + Panel library | Canvas + bottom meters | Inspector tabs)

**Center canvas**:
- Three background styles: `grid` (20px line grid), `blueprint` (cyan-tinted with major/minor grid), `schematic` (dot grid). Toggleable via Tweaks.
- A green-bordered wall frame fitted to fit a 520×320 area. Each LED panel rendered as a sub-cell with `(c+1, r+1)` label when zoom permits.
- Faulted panels blink between two opacities of `--err` (1.4s cycle).
- Vertical line at 50% with `SX40 #1` / `SX40 #2` labels showing processor split.
- Dimension arrows (`mm · ft`) along top and left edge when "Dimensions" toggle is on.
- Crosshair readout in bottom-left showing X/Y mm and grid pitch.

**Toolbar above canvas**: Select / Draw / Erase / Measure tool toggle, snap, curve angle, dimensions/fault checkboxes, zoom slider 40–160%.

**Bottom meter row** (96px tall, 4 cells): PROC #1 utilization %, PROC #2 utilization %, POWER kW with stacked-bar capacity, DATA RATE Gbps. Each cell shows a label + large mono number + fill bar + footnote.

**Inspector** (right pane, 3 tabs):
- **Wall**: Resolution + aspect readout grid; Geometry inputs (cols, rows, curve, pitch select, dimensions); Physical (panels count, weight kg, power kW, BTU/h, circuits); Signal Chain (procs, cabling, refresh, bit depth).
- **Panel**: Selected-panel detail (position, serial, cabinet, proc port, status, brightness, temp, hours).
- **Calc**: Total pixels MP, viewing distance, bandwidth Gbps, peak current A, rigging load breakdown.

**Calculations** (all derived live from cols × rows × pitch):
- `resW = cols × panel.w / panel.pitch`, `resH = rows × panel.h / panel.pitch`
- `totalPanels = cols × rows`; `weight = panels × panel.weight`; `watts = panels × panel.watts`
- `procsNeeded = ceil(totalPixels / 8.8e6)` (one Brompton SX40 = 8.8 megapixels)
- `circuits = ceil(watts / 2400)` (20A circuit at 120V with derate)
- `BTU/h = watts × 3.412`

### 2. System Designer

**Layout**: 3-pane (Device palette | Graph or Patch table | Node inspector)

**Center**: two views — `graph` and `patch` — toggled by a top toolbar pill.

**Graph view**:
- SVG layer renders curved Bezier edges between nodes. Each edge color-coded by lane: video (magenta), audio (info-blue), network (accent), power (warn-amber).
- Edges can be filtered with lane toggles in the toolbar (`lane-tg` chips with colored swatches).
- Each edge has a centered label rect with cable type ("12G-SDI", "AES50", "L6-30 · 30A").
- Nodes are 150px wide cards with header (type tag + node id) and body (name + key/value detail rows). Selected node gets accent border + outer faint ring.
- Ports drawn as 8px circles on the node edges, color-matched to lane.
- Background is dot-grid `schematic` style.

**Patch view**: a dense monospace table — ID / LANE chip / Source · Src Port / Dest · Dest Port / Cable / status dot.

**Inspector**: when a node is selected, shows specification key-values, list of inbound/outbound connections (each row chips the direction arrow + peer name + cable label), and a HEALTH block (status, last sync, firmware, errors). When in Patch view, shows lane-distribution bar chart.

### 3. Rack Builder

**Layout**: 3-pane (Equipment catalog | Rack canvas | Inspector + power budget)

**Catalog (left)**: Search box, category chips ("All", "Processor", "Switcher", "Network", "Compute", "Audio", "Power", "Misc"). Each item card shows U-size badge, model name, category/weight/watts/depth row. Cards are draggable (HTML5 drag) and double-clickable to auto-place.

**Rack canvas (center)**:
- Front view + side profile rendered side-by-side.
- Front view: 19" rack with 14px-tall U-slots. U numbers descend from top on both sides. Mounting-hole strips (6px, `bg-3`) on inner left/right with little 4×2 hole markers per U.
- Items render as colored bars at `top = (rackSize − (pos + u − 1)) × 14`. Color comes from category (accent / magenta / info / warn / muted). Selected item gets accent border and `box-shadow: 0 0 0 1px accent`.
- Drag-from-catalog: shows a dashed preview rectangle at the drop position (green if fits, red if collision).
- Side profile: 80px wide rack with each device drawn at its real depth-as-percent of 1070mm — purely visual.

**Toolbar**: 24U / 42U / 48U size toggle, rack ID pill, drop hint, Spec PDF / Add Rack buttons.

**Bottom meter row**: RACK USAGE U/total + free count, WEIGHT kg vs SWL 250kg, POWER DRAW kW with stacked bar against 8kW headroom, THERMAL BTU/h with AC tonnage estimate.

**Inspector**:
- Selected device readouts (U size, depth mm); spec key-values; U slot scrubber with ↑↓ nudge buttons; Remove / Edit Spec actions.
- Power budget: bar chart of watts grouped by category (each row: 70px label, fill bar, watts).
- Circuit map: L6-30 #1 / #2 utilization (2400W each), UPS runtime estimate `180000/totalWatts` minutes.

**Calculations**:
- `usedPct = totalU / rackSize`
- `circuits120 = ceil(totalWatts / 1800)` (15A @ 120V derated)
- `amps208 = totalWatts / 208`
- `BTU/h = totalWatts × 3.412`; `tons = BTU/h / 12000`

### 4. Asset & Inventory

**Layout**: 3-pane (Categories list + Fleet status | List or Schedule view | Asset detail)

**List view**: Dense table — Asset ID / Model / Category / Status pill (in/out/maint) / Show / Due / Utilization mini-bar / Last Service. Row click selects.

**Schedule view**: Custom Gantt — left column is show name + ID chip; right is a 14-column track grid (28/04 → 11/05) with bars positioned by start/end. Bar color by kind: default accent, `maint` red, `warn` amber. Bar shows "name · pct%".

**Inspector**: Asset detail readouts, assignment block (show / due / crew / crate), maintenance block (last svc / next due / total hrs / PM cycle), history feed (date / event / who, monospace).

**Fleet status mini-charts**: in/out/maint readout grid; 30-day utilization sparkline (SVG polyline).

### 5. Documentation Hub

**Layout**: 3-pane (Tree + recents | Doc page | Versions + linked refs + comments)

**Tree**: collapsible folder tree, monospace, file/folder icons. Active leaf gets accent background.

**Doc page**: prose at 28px/40px padding, max-width none. H1 = JetBrains Mono 22px. H2 = uppercase mono 14px with bottom border. Inline `.ref` links: pill-styled chip with `↗` prefix in accent color. `.callout` block: 2px accent left border, `--accent-faint` background, mono "NOTE" label.

**Versions** (right rail): list of version rows, current marked with accent dot prefix. Each row: `v3.2 · note`, then `who` + `when`.

**Linked references**: list-row entries with category chip ("ASSET" / "WALL" / "NODE" / "DOC") + name. Click would jump to that record (not wired in prototype).

**Comments**: monospace author + time, sans-serif body. "3 OPEN" badge in pane header.

## Interactions & Behavior

- **Module switching**: clicking rail icon swaps the main pane; topbar breadcrumb updates.
- **LED Wall**: clicking a panel selects it and reveals Panel-tab inspector content. Sliders (zoom) update the canvas scale immediately. Tool toggle is purely visual in this prototype.
- **System Designer**: clicking a node selects it. Lane chips toggle visibility of edges (filter `SYSTEM_EDGES` by `lane`). Graph ↔ Patch view toggles entire canvas.
- **Rack Builder**: drag from catalog → drop on rack column → place at hover U if no collision. Double-click catalog row auto-places at lowest empty slot. Double-click rack item removes. Inspector ↑↓ buttons nudge position by 1U with collision check.
- **Inventory**: List ↔ Schedule view toggle. Row click selects.
- **Docs**: tree folder click toggles expansion; file click swaps the active doc (only one doc body authored in prototype).
- **Tweaks panel**: floating bottom-right, draggable. Persists state to host. Controls density / shell / accent / canvas style.

### Animations

- Status bar live dot, rail logo dot — static glow only.
- Faulted LED panels: 1.4s alternating opacity (`@keyframes blink`).
- Section headers can use a 3s left-to-right scanline (`@keyframes scan`) — opt-in via `.scanline` class.
- All hover transitions: `80ms` color/background only. No transform animations on hover.
- Tweak segmented control thumb: `150ms cubic-bezier(.3,.7,.4,1)`.

## State Management

For a real app, use Zustand or React Context. State surfaces per module:

- **App-level**: `module` (active tab), `tweaks` (density, shell, accent, canvasStyle), `project` (current project meta).
- **LED Wall**: `layoutId`, `selectedPanel { c, r }`, `tool`, `zoom`, `showDims`, `showFaults`, `tab`.
- **System Designer**: `lanes { video, audio, network, power: bool }`, `selectedNodeId`, `view: 'graph' | 'patch'`.
- **Rack Builder**: `items: { iid, id, pos }[]`, `selectedIid`, `rackSize: 24 | 42 | 48`, `filter`, `search`, `hoverPos`, `draggingId`.
- **Inventory**: `category`, `selectedId`, `view: 'list' | 'schedule'`.
- **Docs**: `activeDocId`, `expandedFolders: Set<string>`.

## Data Fetching

Replace hard-coded arrays in `data.jsx`:

- `PROJECTS`, `WALL_LAYOUTS`, `PANEL_LIBRARY` → `/api/projects`, `/api/walls`, `/api/panels`
- `SYSTEM_NODES`, `SYSTEM_EDGES`, `PATCH_SHEET` → `/api/systems/:id`
- `ASSETS`, `SHOWS`, `ASSET_CATEGORIES` → `/api/assets`, `/api/shows`
- `DOC_TREE`, `DOC_VERSIONS` → `/api/docs`, `/api/docs/:id/versions`
- Rack catalog (`RACK_CATALOG`) → `/api/equipment/catalog`

Recommended: React Query for caching, optimistic updates on rack item placement / panel selection.

## Recommended Libraries

- **react-flow** for System Designer node graph (handles drag, zoom, edge routing far better than the SVG hack here).
- **@dnd-kit/core** for Rack Builder drag-from-catalog.
- **react-virtual** for the inventory table if asset count grows.
- **date-fns** for Gantt date math.

## Files in This Bundle

| File | Role |
| --- | --- |
| `STAGEKIT.html` | Entry HTML — loads React + Babel + all script tags |
| `styles.css` | Single source of truth for tokens & component classes |
| `app.jsx` | Root `App` component, Tweaks panel wiring |
| `shell.jsx` | Rail, Tabs, Topbar, StatusBar |
| `icons.jsx` | All inline SVG icons (`I.Wall`, `I.Rack`, `I.System`, …) |
| `data.jsx` | Sample data — replace with API calls |
| `led-wall.jsx` | LED Wall Builder module |
| `system-designer.jsx` | System Designer module |
| `rack-builder.jsx` | Rack Builder module |
| `inventory.jsx` | Inventory module |
| `docs.jsx` | Docs Hub module |
| `tweaks-panel.jsx` | Tweak control kit (skip in production — for prototype only) |

## Notes

- **No external icon library.** All icons are inline SVG in `icons.jsx`. Port them as React components or swap for `lucide-react` (closest visual match: `Cpu`, `Network`, `Server`, `Package`, `FileText`, `Search`, etc.).
- **No emoji.** Status uses `●` U+25CF only.
- **Fonts**: load via `@fontsource/inter` and `@fontsource/jetbrains-mono` rather than Google Fonts CDN in production.
- **Accessibility gaps to address in implementation**: keyboard navigation across rail/tabs, ARIA labels on icon-only buttons, focus-visible rings on inputs, semantic table elements (already used) with `<caption>` and `scope` attributes.
- **No light theme yet** — design is dark-only. If a light variant is needed, invert `--bg-*` and `--fg-*` and bump `--line-strong` for contrast.
