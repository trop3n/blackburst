import type {
  FaultPanel,
  Panel,
  PatchEntry,
  Project,
  SystemEdge,
  SystemNode,
  WallLayout,
} from "@/types";

export const PROJECTS: Project[] = [
  { id: "PRJ-2451", code: "PRJ-2451", name: "Atrium Lobby Wall", client: "Northwind HQ", status: "in-design" },
  { id: "PRJ-2447", code: "PRJ-2447", name: "Auditorium Refresh", client: "Helios Tech", status: "fabrication" },
  { id: "PRJ-2440", code: "PRJ-2440", name: "Broadcast Studio B", client: "KCR Media", status: "delivered" },
];

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

export const WALL_LAYOUTS: WallLayout[] = [
  { id: "W1", name: "Main Lobby Wall", panel: "ROE-RB2.6", cols: 18, rows: 8, curve: 0, active: true },
  { id: "W2", name: "Reception Stripe", panel: "INF-XR3", cols: 24, rows: 3, curve: 0, active: false },
  { id: "W3", name: "Curved Backdrop (Stage)", panel: "ROE-CB5", cols: 14, rows: 6, curve: 8, active: false },
];

export const FAULT_PANELS: FaultPanel[] = [
  { c: 6, r: 2 },
  { c: 11, r: 4 },
];

export const SYSTEM_NODES: SystemNode[] = [
  { id: "n1", type: "SOURCE", name: "Resolume Mac Pro", x: 40, y: 80, out: ["video", "network"], details: { res: "3840×2160", fps: "60p" } },
  { id: "n2", type: "SOURCE", name: "PTZ Cam · Stage", x: 40, y: 200, out: ["video", "network"], details: { res: "1920×1080", fps: "60i" } },
  { id: "n3", type: "MIXER", name: "vMix M4 · A1", x: 240, y: 130, in: ["video", "video"], out: ["video"], details: { inputs: "4×SDI", outputs: "2×SDI" } },
  { id: "n4", type: "PROC", name: "Brompton SX40 · #1", x: 440, y: 80, in: ["video"], out: ["network"], details: { ports: "4×10GbE", load: "62%" } },
  { id: "n5", type: "PROC", name: "Brompton SX40 · #2", x: 440, y: 200, in: ["video"], out: ["network"], details: { ports: "4×10GbE", load: "48%" } },
  { id: "n6", type: "WALL", name: "Main Lobby Wall", x: 660, y: 130, in: ["network"], details: { panels: "144", res: "9000×4000" } },
  { id: "n7", type: "AUDIO", name: "DiGiCo SD12 · FOH", x: 240, y: 320, in: ["audio"], out: ["audio"], details: { channels: "96", aux: "24" } },
  { id: "n8", type: "AMP", name: "L-Acoustics LA12X", x: 440, y: 320, in: ["audio"], out: ["audio"], details: { ch: "4", w: "12.8kW" } },
  { id: "n9", type: "POWER", name: "Distro · 200A 3ϕ", x: 240, y: 440, out: ["power"], details: { capacity: "144kVA", load: "78kVA" } },
];

export const SYSTEM_EDGES: SystemEdge[] = [
  { from: "n1", to: "n3", lane: "video", label: "12G-SDI" },
  { from: "n2", to: "n3", lane: "video", label: "3G-SDI" },
  { from: "n3", to: "n4", lane: "video", label: "12G-SDI" },
  { from: "n3", to: "n5", lane: "video", label: "12G-SDI" },
  { from: "n4", to: "n6", lane: "network", label: "10GbE A" },
  { from: "n5", to: "n6", lane: "network", label: "10GbE B" },
  { from: "n7", to: "n8", lane: "audio", label: "AES50" },
  { from: "n9", to: "n4", lane: "power", label: "L6-30 · 30A" },
  { from: "n9", to: "n5", lane: "power", label: "L6-30 · 30A" },
  { from: "n9", to: "n8", lane: "power", label: "L21-30 · 30A" },
];

export const PATCH_SHEET: PatchEntry[] = [
  { src: "Resolume MAC", srcPort: "SDI 1", dest: "vMix M4", destPort: "IN 1", lane: "video", cable: "12G-SDI · 25ft", id: "V-001" },
  { src: "Resolume MAC", srcPort: "SDI 2", dest: "vMix M4", destPort: "IN 2", lane: "video", cable: "12G-SDI · 25ft", id: "V-002" },
  { src: "PTZ Stage L", srcPort: "SDI", dest: "vMix M4", destPort: "IN 3", lane: "video", cable: "3G-SDI · 75ft", id: "V-003" },
  { src: "PTZ Stage R", srcPort: "SDI", dest: "vMix M4", destPort: "IN 4", lane: "video", cable: "3G-SDI · 75ft", id: "V-004" },
  { src: "vMix M4", srcPort: "OUT A", dest: "SX40 #1", destPort: "12G IN", lane: "video", cable: "12G-SDI · 6ft", id: "V-101" },
  { src: "vMix M4", srcPort: "OUT B", dest: "SX40 #2", destPort: "12G IN", lane: "video", cable: "12G-SDI · 6ft", id: "V-102" },
  { src: "SX40 #1", srcPort: "ETH 1", dest: "Wall A1", destPort: "DATA 1", lane: "net", cable: "Cat6A · 100ft", id: "N-001" },
  { src: "SX40 #2", srcPort: "ETH 1", dest: "Wall A2", destPort: "DATA 1", lane: "net", cable: "Cat6A · 100ft", id: "N-002" },
  { src: "DiGiCo SD12", srcPort: "AES A", dest: "LA12X", destPort: "IN 1", lane: "audio", cable: "AES50 · 50ft", id: "A-001" },
  { src: "DiGiCo SD12", srcPort: "AES B", dest: "LA12X", destPort: "IN 2", lane: "audio", cable: "AES50 · 50ft", id: "A-002" },
  { src: "Distro A", srcPort: "L6-30", dest: "SX40 #1", destPort: "PWR", lane: "pwr", cable: "L6-30 · 25ft", id: "P-001" },
  { src: "Distro A", srcPort: "L6-30", dest: "SX40 #2", destPort: "PWR", lane: "pwr", cable: "L6-30 · 25ft", id: "P-002" },
];
