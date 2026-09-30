import type { Panel, SystemEdge, SystemNode, WallLayout } from "@/types";

// Built-in LED panel catalog — the cabinets St Andrew owns. The 2017 CLAIR bid
// installed 336 Absen A3 Pro for the 40ft × 22ft experiential wall and 168 more
// across the two IMAG screens; the twenty other vendors' panels this list used
// to carry were never ours. Figures are the A3 Pro datasheet: 3.9 mm pitch,
// 500 × 500 mm cabinet, 128 × 128 px, 9.2 kg. Power is the datasheet's maximum
// of 1.23 A per tile at 120 V, which is 148 W.
//
// User-added panels layer on top at runtime via setCustomPanelDefs (see
// @/store/useCatalog); PANEL_LIBRARY is the merged list the wall builder and
// status bar read. Keep existing ids stable — WALL_LAYOUTS and scaffoldBucket
// reference them.
export const PANEL_BUILTIN: Panel[] = [
  { id: "ABS-A3PRO", model: "Absen A3 Pro", pitch: 3.9, w: 500, h: 500, pxW: 128, pxH: 128, weight: 9.2, watts: 148 },
];

// Live merged catalog (built-in + user additions). Reassigned by
// setCustomPanelDefs; ES module live bindings propagate the new array to every
// importer, so the wall builder and status bar always see current panels.
export let PANEL_LIBRARY: Panel[] = PANEL_BUILTIN;

// Custom panels stored before pxW/pxH existed have no pixel count; fall back to
// the pitch division so an old catalog still resolves rather than yielding NaN.
function withPixelCount(p: Panel): Panel {
  if (p.pxW > 0 && p.pxH > 0) return p;
  return { ...p, pxW: Math.round(p.w / p.pitch), pxH: Math.round(p.h / p.pitch) };
}

export function setCustomPanelDefs(defs: Panel[]) {
  PANEL_LIBRARY = [...PANEL_BUILTIN, ...defs.map(withPixelCount)];
}

// One empty wall so the LED builder always has an active layout to draw on
// (matches scaffoldBucket). All other demo content starts empty.
export const WALL_LAYOUTS: WallLayout[] = [
  // The BAS — the flown Sanctuary wall. 24 × 14 cabinets is the 336 Absen A3 Pro
  // the 2017 CLAIR bid installed, and at 500 mm each that is 12.0 × 7.0 m, the
  // "40ft x 22ft" the bid describes.
  { id: "W1", name: "BAS", panel: "ABS-A3PRO", processor: "vx2000pro", cols: 24, rows: 14, active: true },
  // The two IMAG side screens: the bid's 168 panels split across them, 12 × 7
  // each, which at 500 mm is 6.0 × 3.5 m — its "20ft x 11.25ft". One Absen
  // Pro-HD drives each (172.16.9.50 left, .52 right).
  { id: "W2", name: "Side Screen Left", panel: "ABS-A3PRO", processor: "absen-prohd", cols: 12, rows: 7, active: false },
  { id: "W3", name: "Side Screen Right", panel: "ABS-A3PRO", processor: "absen-prohd", cols: 12, rows: 7, active: false },
];

export const SYSTEM_NODES: SystemNode[] = [];

export const SYSTEM_EDGES: SystemEdge[] = [];
