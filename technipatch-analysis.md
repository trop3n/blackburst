# Technipatch — Detailed Analysis

**URL:** https://technipatch.com/editor
**Source:** closed — analysed from the shipped client bundle (no source maps published)
**Date Analyzed:** October 29, 2026
**Method:** REA (`analyze_javascript_application` `ev_02522f68…`, `capture_browser_scenario` `ev_250bfa89…`)

---

## Overview

Technipatch is a **browser AV system diagram editor**. The user drags devices from a 729-entry
library onto a canvas, pulls cables **socket to socket**, and the app continuously derives a cable
schedule, a per-device patch sheet, an equipment list, a DMX addressing sheet and a validation
alert list. Those derived documents live in a permanent right-hand dock — the canvas is the input
method, the documents are the product.

It is bilingual (fr/en), local-first (no account needed; the project lives in `localStorage`), and
the editor made **zero API calls** during observation. Supabase backs only save, share and accounts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js (App Router, RSC, nonce CSP + `strict-dynamic`) |
| **Diagramming** | React Flow (`.react-flow__node`, built-in minimap/controls) |
| **Auto-layout** | elkjs — 1.45 MB, lazy-loaded as a separate chunk |
| **Styling** | CSS Modules (class names survive minification, e.g. `DisplaySheet_chip___Qzza`) |
| **Backend** | Supabase (save / share / account only) |
| **Hosting** | Cloudflare |
| **Bundle** | 22 chunks / 4.9 MB, 389 modules; **no source maps shipped** (all `.map` → 404) |

---

## Component Inventory

Recovered from CSS-Module class names — 43 components, by class count:

| Component | Classes | Role |
|---|---|---|
| `TirageReel` | 104 | Cable-pull schedule (the largest single surface) |
| `Inspector` | 62 | Right-hand properties panel |
| `AccountDialog` | 58 | Account / plan |
| `DeviceNode` | 54 | Canvas device block with its real connector panel |
| `Dock` | 39 | Generated-documents dock |
| `FieldView` | 35 | Field/plan view |
| `Documents` / `DocumentsSheet` | 32 / 23 | Document tabs and printable sheet |
| `Editor` | 27 | Editor shell |
| `CableEdge` | 26 | Cable rendering |
| `LibraryRail` / `LibrarySheet` / `LibraryDrawer` | 24 / 13 / 4 | Device library |
| `MobileEditor` | 21 | Separate mobile surface |
| `ZoneFrames` / `ZonesPanel` | 18 / 16 | Zone boxes and management |
| `Canvas`, `CommandPalette`, `Toast`, `ConfirmDialog`, … | — | Shell furniture |

---

## The Core Idea

**Ports are first-class; every document is derived.** One device definition:

```js
{ id:"yamaha-ql5", brand:"Yamaha", model:"QL5", category:"console",
  ports:[ micIn(32,"IN"), lineOut(16,"OMNI OUT"), dante(2,64), aes3Out(1) ],
  source:"usa.yamaha.com — QL Series Specs (Analog In 32, Analog Out 16, Digital Out 1 AES/EBU, Dante Primary/Secondary)",
  verified:true }
```

Three decisions do all the work:

1. **Port factories.** 30 helpers generate the port list instead of hand-writing 32 objects.
   Usage counts across the catalogue: `powerIn` ×368, `ethernet` ×228, `hdmiIn` ×135, `hdmiOut` ×132,
   `lineOut` ×128, `sdiOut` ×84, `sdiIn` ×83, `lineIn` ×67, `dmxIn` ×65, `dmxThru` ×59, `micIn` ×54,
   `powerThru` ×43, `dante` ×36, `aes3Out` ×26, `speakerIn` ×25, `speakerThru` ×24, `genlockIn` ×24,
   `rfIn` ×18, `speakerOut` ×17, `rfOut` ×16, `ledLink` ×13, `fibre` ×12, `dmxOut` ×12,
   `genlockThru` ×11, `madi` ×10, `ledLinkIn` ×8, `powerOut` ×7, `ledLinkThru` ×7, `rfAntenna` ×5,
   `artnet` ×1. This is why 715 devices stay maintainable.
2. **Provenance as data.** Every device carries a `source` citation and a `verified` flag —
   715 devices, 549 verified, 377 with a stated source.
3. **A cable joins `(device, port)` → `(device, port)`**, never node to node.

Catalogue spread by category: video 261, lumiere 89, traitement 82, micro 67, hp 44, scene 41,
reseau 37, console 29, ampli 28, custom 27, electricite 18.

---

## Derived Documents

The dock is always present, tabs carry live counts (`Cables 31 · Patch 20 · Equipment 11 · Diagram · Alerts`):

| Tab | Content |
|---|---|
| **Cables** | Label / Signal / Source / Destination / Length. Each endpoint reads `{device} · {port}`, with the zone appended (`Rio3224-D2 · OUT 1 · Stage`). Signal named under the label. |
| **Patch** | Per-device port occupancy: `Rio3224-D2 — 37 free`, then `IN 1 → A18 → SM58 / Out`, `IN 10 → — → free`. **Not producible without a port model.** |
| **Equipment** | BOM with quantity, brand, model. |
| **Diagram** | The printable sheet. |
| **Alerts** | Validation output (below). |

Status bar carries a live rollup: `20 devices · 31 cables · 0 m · No errors`.

**Export matrix:** PDF A4 / A3 (with orientation and a *fits* / *tight* fitting indicator),
SVG, PNG, rack elevation (PDF + SVG), CSV × 4 (cable list, patch, DMX addressing, BOM), and a
`.technipatch` project file.

**Printable title block** (`cartouche`): CLIENT · SALLE · AUTEUR · DATE · APPAREILS · CÂBLES · RÉV. · LÉGENDE · NOTE.

---

## Validation Engine

23 rules, all in chunk `3580` — 15 `error`, 8 `warning`. Every rule ships a **message and a hint**,
and the hints are written by someone who does this work:

| Code | Severity | Message → hint |
|---|---|---|
| `DEUX_ENTREES` / `DEUX_SORTIES` | error | Two inputs/outputs cannot be linked → "Link an output to an input." |
| `DOUBLON` | error | These two ports are already linked. |
| `BOUCLE_SUR_PORT` | error | A port cannot be linked to itself. |
| `PORT_INTROUVABLE` | error | One of the two ports no longer exists. |
| `ENTREE_OCCUPEE` | error | Input «{port}» on {device} is already patched → "Free it, or pick another input." |
| `SORTIE_OCCUPEE` | error | Output «{port}» already used → "A {signal} link is point-to-point: go through a distributor." |
| `REPIQUAGE` | warning | Output already feeds elsewhere → "At line level a passive Y is enough; at mic level prefer a split box." |
| `LIAISON_INTERNE` | warning | Internal link within {device} → "Check that this loop-back is intended." |
| `SIGNAL_INCOMPATIBLE` | error | Incompatible signals → "Go through a converter if this link is intended." |
| `SIGNAL_INTEROP` | warning | {source} to {destination}. |
| `CONNECTEUR_INCOMPATIBLE` | error | A {source} does not plug into a {destination}. |
| `ADAPTATEUR_REQUIS` | warning | Adapter necessary → "To pack in the case: {part}." |
| `CANAUX_INSUFFISANTS` | error | Link carries {n} channels into a socket accepting {m}. |
| `DEBIT_LIMITE` | warning | Rate held down to {rate}, limited by {device} · {port}. |
| `REPERE_DOUBLE` | warning | Label «{ref}» forced on several cables. |
| `DANTE_MEME_COMMUTATEUR` | warning | Primary and secondary Dante both reach {switch} → "Redundancy cancelled: send the secondary to a different switch, or isolate them on two VLANs." |
| `POE_BUDGET_DEPASSE` | — | {switch} receives a PoE demand of {demand} against a {budget} budget. |
| `DEPART_SURCHARGE` | — | Circuit «{feed}» on {device}, rated {amps} A, receives a demand of {demand} A. |
| `DMX_CHEVAUCHEMENT` | error | {device} overlaps {other} in universe {n}: channels {range} addressed twice. |
| `DMX_HORS_UNIVERS` | error | Range {range} runs past the end of the universe. |
| `DMX_UNIVERS_AMBIGU` | error | Reached by two different universes. |
| `DMX_SANS_UNIVERS` | warning | Addressed, but no cable links it to a DMX output declaring its universe. |
| `DMX_SANS_ADRESSE` / `DMX_SANS_ENCOMBREMENT` | — | Footprint without address, or address without footprint, reserves nothing. |

### Connector registry

94 connectors across 8 families (`audio` 26, `video` 17, `electricite` 16, `reseau` 15, `controle` 9,
`donnees` 5, `lumiere` 3, `multipaire` 3), each shaped:

```js
{ id:"xlr3", label:{ fr:"XLR 3 points", en:"XLR 3-pin" }, family:"audio",
  adapters:[ { with:"jack63", part:{ en:'XLR to balanced 1/4" jack adapter' } },
             { with:"xlr5",   part:{ en:"DMX 5-pin to 3-pin adapter" } } ] }
```

Compatibility is **data, not code** — and because the adapter is named, it lands in the BOM.

---

## Inspector

Name · Brand · Model · Category · Location (zone) · **Instances** (quantity multiplier on one node) ·
Height (RU) · Jackfield layout (Automatic / Rows / Comb) · Notes · Photo (with flat-background removal,
captioned *"The photo only changes how the block looks. Ports, cables and documents stay the same"*) ·
Ports (count, with a reveal) · Duplicate · **Keep in my devices** · Delete.

Per-cable routing overrides: line style (curved / right angles / direct), exit edge, entry edge,
and *"Hand back to the automatic router"* — a manual override that can always be surrendered.

**Zones** are first-class: named, drawn on the plan, foldable, counted, with an auto-fitting frame
(*"Calculated frame: it hugs the zone's devices and follows them"*) or a hand-drawn one.

---

## Gap Analysis vs. our System Designer

Our model, `src/types/index.ts`:

```ts
SystemNode { in?: Lane[], out?: Lane[] }            // lanes, not ports
SystemEdge { from, to, lane, srcPort?, destPort? }  // node→node; ports are free text
```

`Lane` is `video | audio | network | power` — a node either *has audio input* or does not. The
strain is already visible in `src/lib/system-data.ts`:

```ts
{ id: "mix-carbonite", … in: ["video", "video"], out: ["video"] }
```

`["video","video"]` encodes "two inputs" in a type that cannot count. Everything below is
unreachable until ports are real:

| Capability | Blocked by |
|---|---|
| Port occupancy / free count | no port inventory |
| `ENTREE_OCCUPEE` / `SORTIE_OCCUPEE` | nothing to mark occupied |
| Connector compatibility, adapter-required | no connector data |
| Channel capacity | no per-port channel count |
| DMX addressing, PoE budget, circuit load | no electrical/control model |

The type comment already names the problem: *"the graph knows signal lanes, not connector types or
real port numbers."* Those optional `srcPort` / `destPort` overrides become the **fallback** once
ports exist, so the migration is additive.

---

## Upgrade Path

1. **Ports + factories** — `Port` type, ~15 factories for our gear, `Lane` derived from the port's
   signal so every existing consumer keeps working. *(started — `src/lib/ports.ts`)*
2. **Port-aware edges** — `SystemEdge` gains `srcPortId` / `destPortId`; the free-text fields stay as
   display overrides, so saved projects keep loading.
3. **Patch sheet as a real derivation** — rewrite `buildPatchRows()` as per-device port occupancy
   with a free count.
4. **Alerts panel** — ship the six rules that need nothing beyond steps 1–2 (two-inputs, two-outputs,
   duplicate, self-loop, input occupied, output occupied), then add the connector registry for
   incompatible / adapter-required. Pure and store-free, like `led-wall/validation.ts`.
5. **`source` + `verified` as fields** — the provenance discipline asserted in the `system-data.ts`
   header comment, promoted from prose to data so the inspector can show it.

Cheap wins independent of the port model: the documents **dock** as a permanent rail rather than a
`view: "graph" | "patch"` toggle; an **`instances`** multiplier on a node; a **hint line on every
diagnostic**; and a **title block** on the printed sheet.

---

## Coverage and Limits

- **Not exercised:** Import, Export, Share, Sign-in (account-gated; observation stayed read-only).
- **Seen only in the component inventory, not running:** the Diagram tab, `MobileEditor`, `BrandDialog`,
  `TirageReel`'s own surface.
- Rule semantics are read from the shipped English i18n strings, not from each rule's implementation —
  confident on what each rule *says*, less so on exact thresholds.
- Device port lists were sampled, not enumerated across all 715 entries.

> The pattern here — port graph in, derived documents out — is the standard CAD/EDA netlist approach,
> not proprietary to Technipatch. Their catalogue, copy and code are theirs; ours is our own gear from
> our own sources. Build the pattern, not a transcription.
