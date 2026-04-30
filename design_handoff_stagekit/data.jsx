// data.jsx — sample data for the AV/Production prototype

const PROJECTS = [
  { id: "PRJ-2451", name: "Atrium Lobby Wall", client: "Northwind HQ", status: "in-design" },
  { id: "PRJ-2447", name: "Auditorium Refresh", client: "Helios Tech", status: "fabrication" },
  { id: "PRJ-2440", name: "Broadcast Studio B", client: "KCR Media", status: "delivered" },
];

// LED Wall
const PANEL_LIBRARY = [
  { id: "ROE-CB5", model: "ROE Carbon CB5", pitch: 5.77, w: 500, h: 500, weight: 8.4, watts: 145 },
  { id: "ROE-RB2.6", model: "ROE Ruby RB2.6", pitch: 2.6, w: 500, h: 500, weight: 8.0, watts: 200 },
  { id: "INF-XR3", model: "INFiLED XR3", pitch: 3.91, w: 500, h: 500, weight: 7.8, watts: 160 },
  { id: "ABS-AT5", model: "Absen AT5 Pro", pitch: 5.2, w: 640, h: 480, weight: 9.1, watts: 175 },
  { id: "UNI-UPAD", model: "Unilumin UpadIV H6", pitch: 6.0, w: 500, h: 500, weight: 7.0, watts: 130 },
];

const WALL_LAYOUTS = [
  { id: "W1", name: "Main Lobby Wall", panel: "ROE-RB2.6", cols: 18, rows: 8, curve: 0, active: true },
  { id: "W2", name: "Reception Stripe", panel: "INF-XR3", cols: 24, rows: 3, curve: 0, active: false },
  { id: "W3", name: "Curved Backdrop (Stage)", panel: "ROE-CB5", cols: 14, rows: 6, curve: 8, active: false },
];

const FAULT_PANELS = [{ c: 7, r: 3 }, { c: 12, r: 5 }];

// System Designer
const SYSTEM_NODES = [
  { id: "n1", type: "SOURCE", name: "Resolume Mac Pro", x: 40,  y: 80,  out: ["video", "network"], details: { res: "3840×2160", fps: "60p" } },
  { id: "n2", type: "SOURCE", name: "PTZ Cam · Stage", x: 40,  y: 200, out: ["video", "network"], details: { res: "1920×1080", fps: "60i" } },
  { id: "n3", type: "MIXER", name: "vMix M4 · A1", x: 240, y: 130, in: ["video", "video"], out: ["video"], details: { inputs: "4×SDI", outputs: "2×SDI" } },
  { id: "n4", type: "PROC", name: "Brompton SX40 · #1", x: 440, y: 80, in: ["video"], out: ["network"], details: { ports: "4×10GbE", load: "62%" } },
  { id: "n5", type: "PROC", name: "Brompton SX40 · #2", x: 440, y: 200, in: ["video"], out: ["network"], details: { ports: "4×10GbE", load: "48%" } },
  { id: "n6", type: "WALL", name: "Main Lobby Wall", x: 660, y: 130, in: ["network"], details: { panels: "144", res: "9000×4000" } },
  { id: "n7", type: "AUDIO", name: "DiGiCo SD12 · FOH", x: 240, y: 320, in: ["audio"], out: ["audio"], details: { channels: "96", aux: "24" } },
  { id: "n8", type: "AMP", name: "L-Acoustics LA12X", x: 440, y: 320, in: ["audio"], out: ["audio"], details: { ch: "4", w: "12.8kW" } },
  { id: "n9", type: "POWER", name: "Distro · 200A 3ϕ", x: 240, y: 440, out: ["power"], details: { capacity: "144kVA", load: "78kVA" } },
];

const SYSTEM_EDGES = [
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

const PATCH_SHEET = [
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

// Inventory
const ASSETS = [
  { id: "BMD-S40-001", model: "Brompton SX40", cat: "Processor", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 82, last: "2026-04-12" },
  { id: "BMD-S40-002", model: "Brompton SX40", cat: "Processor", status: "in",  show: "—", due: "—", utilization: 64, last: "2026-04-22" },
  { id: "BMD-S40-003", model: "Brompton SX40", cat: "Processor", status: "maint", show: "—", due: "Apr 30", utilization: 71, last: "2026-04-09" },
  { id: "ROE-RB2.6-A1", model: "ROE Ruby RB2.6 (24-pack)", cat: "LED Panel", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 88, last: "2026-04-12" },
  { id: "ROE-RB2.6-A2", model: "ROE Ruby RB2.6 (24-pack)", cat: "LED Panel", status: "in",  show: "—", due: "—", utilization: 41, last: "2026-04-19" },
  { id: "ROE-CB5-A1",  model: "ROE Carbon CB5 (24-pack)", cat: "LED Panel", status: "in",  show: "—", due: "—", utilization: 33, last: "2026-04-15" },
  { id: "VMX-M4-001",  model: "vMix M4 Switcher", cat: "Switcher", status: "out", show: "KCR Studio B", due: "May 02", utilization: 94, last: "2026-04-20" },
  { id: "DGC-SD12-001",model: "DiGiCo SD12", cat: "Console", status: "in", show: "—", due: "—", utilization: 58, last: "2026-04-18" },
  { id: "LA-12X-001",  model: "L-Acoustics LA12X", cat: "Amplifier", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 76, last: "2026-04-12" },
  { id: "LA-12X-002",  model: "L-Acoustics LA12X", cat: "Amplifier", status: "maint", show: "—", due: "May 04", utilization: 81, last: "2026-04-08" },
  { id: "PTZ-AW-UE150-1",model:"AW-UE150 PTZ Cam", cat: "Camera", status: "in", show: "—", due: "—", utilization: 52, last: "2026-04-21" },
  { id: "PTZ-AW-UE150-2",model:"AW-UE150 PTZ Cam", cat: "Camera", status: "out", show: "KCR Studio B", due: "May 02", utilization: 67, last: "2026-04-20" },
  { id: "DST-200A-01", model: "Distro 200A 3ϕ", cat: "Power", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 70, last: "2026-04-12" },
];

const SHOWS = [
  { id: "SH-A", name: "Helios Auditorium",  start: 1,  end: 6,  pct: 88 },
  { id: "SH-B", name: "KCR Studio B Refresh", start: 5,  end: 9,  pct: 64 },
  { id: "SH-C", name: "Northwind Atrium",   start: 8,  end: 13, pct: 41 },
  { id: "SH-D", name: "Maintenance · LA12X", start: 3,  end: 5,  pct: 100, kind: "maint" },
  { id: "SH-E", name: "Calibration · SX40", start: 10, end: 12, pct: 100, kind: "warn" },
];

const ASSET_CATEGORIES = [
  { name: "All gear",   count: 348 },
  { name: "LED Panel",  count: 144 },
  { name: "Processor",  count: 12 },
  { name: "Switcher",   count: 8 },
  { name: "Console",    count: 6 },
  { name: "Camera",     count: 22 },
  { name: "Amplifier",  count: 18 },
  { name: "Power",      count: 26 },
  { name: "Cabling",    count: 112 },
];

// Docs
const DOC_TREE = [
  { id: "d-prj", name: "Helios Auditorium", kind: "folder", children: [
    { id: "d-prj-ros", name: "Run-of-Show v3.2", kind: "doc" },
    { id: "d-prj-cue", name: "Cue Sheet — Day 1", kind: "doc" },
    { id: "d-prj-pat", name: "Patch List", kind: "doc" },
    { id: "d-prj-ho", name: "Handoff Notes", kind: "doc" },
  ]},
  { id: "d-spec", name: "Equipment Specs", kind: "folder", children: [
    { id: "d-spec-sx40", name: "Brompton SX40 — Manual", kind: "doc" },
    { id: "d-spec-rb",   name: "ROE Ruby RB2.6 — Spec",  kind: "doc" },
    { id: "d-spec-la",   name: "L-Acoustics LA12X — Spec", kind: "doc" },
  ]},
  { id: "d-sop", name: "SOPs", kind: "folder", children: [
    { id: "d-sop-load",  name: "Load-In Procedure", kind: "doc" },
    { id: "d-sop-cal",   name: "Wall Calibration", kind: "doc" },
    { id: "d-sop-strk",  name: "Strike & Pack-Out", kind: "doc" },
  ]},
];

const DOC_VERSIONS = [
  { v: "v3.2", who: "M. Reyes",   when: "Apr 28, 14:22", note: "Adjusted cue 14 timing" },
  { v: "v3.1", who: "M. Reyes",   when: "Apr 27, 09:08", note: "Inserted IMAG sub-cues" },
  { v: "v3.0", who: "K. Tanaka",  when: "Apr 24, 17:55", note: "Tech rehearsal pass" },
  { v: "v2.4", who: "S. Larsson", note: "Pre-production lock", when: "Apr 19, 11:30" },
  { v: "v2.3", who: "S. Larsson", note: "Speaker order change", when: "Apr 17, 16:02" },
];

window.DATA = {
  PROJECTS, PANEL_LIBRARY, WALL_LAYOUTS, FAULT_PANELS,
  SYSTEM_NODES, SYSTEM_EDGES, PATCH_SHEET,
  ASSETS, SHOWS, ASSET_CATEGORIES,
  DOC_TREE, DOC_VERSIONS,
};
