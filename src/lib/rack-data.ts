import type { Rack, RackColor, RackItem, RackItemDef } from "@/types";

// Built-in seed catalog. User-added equipment is layered on top at runtime via
// setCustomRackDefs (see @/store/useCatalog); RACK_CATALOG is the merged list
// every consumer reads. Keep existing ids stable — DEFAULT_RACK references them.
// Built-in seed catalog — rack gear St Andrew has, plus the generic panels and
// shelves any rack needs. Each entry's height, weight, power and depth come from
// the stock catalog this was pruned from; the models that were someone else's
// rental stock (LED processors, media servers, ATEM and DiGiCo frames) are gone.
//
// Gear of ours that is NOT here — Q-SYS cores and amplifiers, Extron control
// processors and DTP frames, the Carbonite Black Plus, the Smart Videohub, the
// Christie projectors — is missing on purpose: this app plans rack weight,
// power and depth from these figures, and nobody has measured ours. The venue
// docs list a rack elevation as an open gap; add each model here when it does.
//
// User-added equipment layers on top at runtime via setCustomRackDefs (see
// @/store/useCatalog); RACK_CATALOG is the merged list every consumer reads.
// Keep existing ids stable — DEFAULT_RACK references them.
export const RACK_BUILTIN: RackItemDef[] = [
  { id: "la4x", model: "L-Acoustics LA4X", cat: "Audio", u: 2, w: 11.0, watts: 900, depth: 480, color: "info" },
  { id: "axient", model: "Shure Axient AD4Q · 4ch", cat: "Audio", u: 1, w: 4.5, watts: 70, depth: 360, color: "info" },
  { id: "mics", model: "Shure ULXD4Q · 4ch", cat: "Audio", u: 1, w: 4.2, watts: 60, depth: 360, color: "info" },
  { id: "rio", model: "Yamaha Rio3224-D", cat: "Audio", u: 3, w: 12.0, watts: 150, depth: 380, color: "info" },
  { id: "opengear", model: "Ross openGear OG3-FR-CN", cat: "Signal", u: 2, w: 9.0, watts: 200, depth: 400, color: "magenta" },
  { id: "patch48", model: "Cat6A Patch Panel · 48-port", cat: "Network", u: 1, w: 1.5, watts: 0, depth: 120, color: "info" },
  { id: "pdump", model: "Middle Atlantic PD-2015", cat: "Power", u: 1, w: 2.5, watts: 0, depth: 90, color: "warn" },
  { id: "shelf", model: "Vented Rack Shelf · 2U", cat: "Misc", u: 2, w: 2.0, watts: 0, depth: 400, color: "muted" },
  { id: "drawer", model: "Rack Drawer · 2U", cat: "Misc", u: 2, w: 4.0, watts: 0, depth: 450, color: "muted" },
  { id: "kvm", model: "1U KVM Drawer · 17in", cat: "Misc", u: 1, w: 11.0, watts: 40, depth: 590, color: "muted" },
  { id: "fan", model: "Fan Panel · 1U", cat: "Misc", u: 1, w: 2.0, watts: 60, depth: 100, color: "muted" },
  { id: "blank1", model: "Blank Panel · 1U", cat: "Misc", u: 1, w: 0.5, watts: 0, depth: 0, color: "muted" },
  { id: "blank2", model: "Blank Panel · 2U", cat: "Misc", u: 2, w: 0.8, watts: 0, depth: 0, color: "muted" },
  { id: "vent", model: "Vented Panel · 2U", cat: "Misc", u: 2, w: 0.6, watts: 0, depth: 0, color: "muted" },
];

// Live merged catalog (built-in + user additions). Reassigned by
// setCustomRackDefs; ES module live bindings propagate the new array to every
// importer, so slot math and the catalog pane always see current equipment.
export let RACK_CATALOG: RackItemDef[] = RACK_BUILTIN;

export function setCustomRackDefs(defs: RackItemDef[]) {
  RACK_CATALOG = [...RACK_BUILTIN, ...defs];
}

export const DEFAULT_RACK: RackItem[] = [];

export const DEFAULT_RACKS: Rack[] = [
  { id: "R-001", name: "Rack 1", location: "", size: 42, items: DEFAULT_RACK },
];

export const RACK_COLOR_MAP: Record<RackColor, { bg: string; bd: string; fg: string }> = {
  accent: { bg: "rgba(61, 123, 165, 0.10)", bd: "rgba(107, 157, 194, 0.45)", fg: "var(--accent)" },
  magenta: { bg: "rgba(191, 138, 185, 0.10)", bd: "rgba(191, 138, 185, 0.45)", fg: "var(--color-magenta)" },
  info: { bg: "rgba(112, 181, 189, 0.10)", bd: "rgba(112, 181, 189, 0.45)", fg: "var(--color-info)" },
  warn: { bg: "rgba(207, 165, 105, 0.10)", bd: "rgba(207, 165, 105, 0.45)", fg: "var(--color-warn)" },
  muted: { bg: "var(--color-bg-2)", bd: "var(--color-line-strong)", fg: "var(--color-fg-mute)" },
};
