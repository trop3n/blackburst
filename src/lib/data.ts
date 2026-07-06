import type {
  FaultPanel,
  Panel,
  PatchEntry,
  SystemEdge,
  SystemNode,
  WallLayout,
} from "@/types";

// Built-in LED panel catalog. User-added panels layer on top at runtime via
// setCustomPanelDefs (see @/store/useCatalog); PANEL_LIBRARY is the merged list
// the wall builder and status bar read. Keep existing ids stable — WALL_LAYOUTS
// and scaffoldBucket reference them.
export const PANEL_BUILTIN: Panel[] = [
  { id: "ROE-RB2.6", model: "ROE Ruby RB2.6", pitch: 2.6, w: 500, h: 500, weight: 8.0, watts: 200 },
  { id: "ROE-CB5", model: "ROE Carbon CB5", pitch: 5.77, w: 500, h: 500, weight: 8.4, watts: 145 },
  { id: "ROE-CB3", model: "ROE Carbon CB3", pitch: 3.47, w: 500, h: 500, weight: 8.4, watts: 160 },
  { id: "ROE-BP2", model: "ROE Black Pearl BP2", pitch: 2.84, w: 500, h: 500, weight: 8.5, watts: 190 },
  { id: "ROE-BM4", model: "ROE Black Marble BM4", pitch: 4.62, w: 500, h: 500, weight: 12.0, watts: 150 },
  { id: "ROE-V8H", model: "ROE Vanish V8H", pitch: 8.33, w: 500, h: 500, weight: 6.5, watts: 110 },
  { id: "INF-XR3", model: "INFiLED XR3", pitch: 3.91, w: 500, h: 500, weight: 7.8, watts: 160 },
  { id: "INF-DB4", model: "INFiLED DB4", pitch: 4.0, w: 500, h: 500, weight: 7.5, watts: 150 },
  { id: "INF-MG2.6", model: "INFiLED Magnite 2.6", pitch: 2.6, w: 500, h: 500, weight: 8.0, watts: 175 },
  { id: "ABS-AT5", model: "Absen AT5 Pro", pitch: 5.2, w: 640, h: 480, weight: 9.1, watts: 175 },
  { id: "ABS-PL2.5", model: "Absen PL2.5 Pro", pitch: 2.5, w: 500, h: 500, weight: 7.5, watts: 150 },
  { id: "ABS-AX2.9", model: "Absen AX2.9", pitch: 2.9, w: 500, h: 1000, weight: 12.0, watts: 240 },
  { id: "UNI-UPAD", model: "Unilumin UpadIV H6", pitch: 6.0, w: 500, h: 500, weight: 7.0, watts: 130 },
  { id: "UNI-UMINI", model: "Unilumin Umini II 1.9", pitch: 1.9, w: 480, h: 540, weight: 8.0, watts: 200 },
  { id: "UNI-UST3.9", model: "Unilumin Ustorm 3.9", pitch: 3.9, w: 500, h: 500, weight: 7.2, watts: 145 },
  { id: "LEY-TWA2.6", model: "Leyard TWA2.6", pitch: 2.6, w: 600, h: 337, weight: 6.0, watts: 130 },
  { id: "PLA-CLI2.6", model: "Planar CarbonLight CLI2.6", pitch: 2.6, w: 600, h: 337, weight: 6.5, watts: 140 },
  { id: "SAM-IF6", model: "Samsung IF060", pitch: 6.0, w: 480, h: 480, weight: 9.0, watts: 120 },
  { id: "SAC-VP2.3", model: "SACO V:Pix 2.3", pitch: 2.3, w: 500, h: 500, weight: 8.2, watts: 185 },
  { id: "CHR-C1.9", model: "Christie Core II 1.9", pitch: 1.9, w: 600, h: 337, weight: 6.4, watts: 175 },
];

let customPanelDefs: Panel[] = [];

// Live merged catalog (built-in + user additions). Reassigned by
// setCustomPanelDefs; ES module live bindings propagate the new array to every
// importer, so the wall builder and status bar always see current panels.
export let PANEL_LIBRARY: Panel[] = PANEL_BUILTIN;

export function setCustomPanelDefs(defs: Panel[]) {
  customPanelDefs = defs;
  PANEL_LIBRARY = [...PANEL_BUILTIN, ...customPanelDefs];
}

export function isCustomPanelDef(id: string): boolean {
  return customPanelDefs.some((d) => d.id === id);
}

// One empty wall so the LED builder always has an active layout to draw on
// (matches scaffoldBucket). All other demo content starts empty.
export const WALL_LAYOUTS: WallLayout[] = [
  { id: "W1", name: "Wall 1", panel: "ROE-RB2.6", cols: 4, rows: 3, curve: 0, active: true },
];

export const FAULT_PANELS: FaultPanel[] = [];

export const SYSTEM_NODES: SystemNode[] = [];

export const SYSTEM_EDGES: SystemEdge[] = [];

export const PATCH_SHEET: PatchEntry[] = [];
