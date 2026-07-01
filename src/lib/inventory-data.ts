import type { Asset, AssetCategory, InventoryModelDef, ShowSchedule } from "@/types";

export const ASSETS: Asset[] = [
  { id: "BMD-S40-001", model: "Brompton SX40", cat: "Processor", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 82, last: "2026-04-12" },
  { id: "BMD-S40-002", model: "Brompton SX40", cat: "Processor", status: "in", show: "—", due: "—", utilization: 64, last: "2026-04-22" },
  { id: "BMD-S40-003", model: "Brompton SX40", cat: "Processor", status: "maint", show: "—", due: "Apr 30", utilization: 71, last: "2026-04-09" },
  { id: "ROE-RB2.6-A1", model: "ROE Ruby RB2.6 (24-pack)", cat: "LED Panel", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 88, last: "2026-04-12" },
  { id: "ROE-RB2.6-A2", model: "ROE Ruby RB2.6 (24-pack)", cat: "LED Panel", status: "in", show: "—", due: "—", utilization: 41, last: "2026-04-19" },
  { id: "ROE-CB5-A1", model: "ROE Carbon CB5 (24-pack)", cat: "LED Panel", status: "in", show: "—", due: "—", utilization: 33, last: "2026-04-15" },
  { id: "VMX-M4-001", model: "vMix M4 Switcher", cat: "Switcher", status: "out", show: "KCR Studio B", due: "May 02", utilization: 94, last: "2026-04-20" },
  { id: "DGC-SD12-001", model: "DiGiCo SD12", cat: "Console", status: "in", show: "—", due: "—", utilization: 58, last: "2026-04-18" },
  { id: "LA-12X-001", model: "L-Acoustics LA12X", cat: "Amplifier", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 76, last: "2026-04-12" },
  { id: "LA-12X-002", model: "L-Acoustics LA12X", cat: "Amplifier", status: "maint", show: "—", due: "May 04", utilization: 81, last: "2026-04-08" },
  { id: "PTZ-AW-UE150-1", model: "AW-UE150 PTZ Cam", cat: "Camera", status: "in", show: "—", due: "—", utilization: 52, last: "2026-04-21" },
  { id: "PTZ-AW-UE150-2", model: "AW-UE150 PTZ Cam", cat: "Camera", status: "out", show: "KCR Studio B", due: "May 02", utilization: 67, last: "2026-04-20" },
  { id: "DST-200A-01", model: "Distro 200A 3ϕ", cat: "Power", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 70, last: "2026-04-12" },
];

export const ASSET_CATEGORIES: AssetCategory[] = [
  { name: "All gear", count: 348 },
  { name: "LED Panel", count: 144 },
  { name: "Processor", count: 12 },
  { name: "Switcher", count: 8 },
  { name: "Console", count: 6 },
  { name: "Camera", count: 22 },
  { name: "Amplifier", count: 18 },
  { name: "Power", count: 26 },
  { name: "Cabling", count: 112 },
];

export const SHOWS: ShowSchedule[] = [
  { id: "SH-A", name: "Helios Auditorium", start: 1, end: 6, pct: 88 },
  { id: "SH-B", name: "KCR Studio B Refresh", start: 5, end: 9, pct: 64 },
  { id: "SH-C", name: "Northwind Atrium", start: 8, end: 13, pct: 41 },
  { id: "SH-D", name: "Maintenance · LA12X", start: 3, end: 5, pct: 100, kind: "maint" },
  { id: "SH-E", name: "Calibration · SX40", start: 10, end: 12, pct: 100, kind: "warn" },
];

export const ASSET_HISTORY: { d: string; e: string; t: string }[] = [
  { d: "Apr 22", e: "Returned · QC pass", t: "S. Larsson" },
  { d: "Apr 12", e: "Deployed → Helios", t: "M. Reyes" },
  { d: "Apr 09", e: "PM service · firmware 3.4.12", t: "K. Tanaka" },
  { d: "Mar 28", e: "Returned · ok", t: "S. Larsson" },
];

// Built-in model catalog. Assets are individual tracked units; this is the
// catalog of *models* they're instances of — it feeds the "New asset" flow
// (a known model auto-fills its category) and the "add a unit" shortcut. User
// additions layer on top via setCustomInvModels (see @/store/useCatalog);
// INV_MODELS is the merged list the inventory module reads.
export const INV_MODEL_BUILTIN: InventoryModelDef[] = [
  { id: "im-sx40", model: "Brompton SX40", cat: "Processor" },
  { id: "im-tessera", model: "Brompton Tessera S8", cat: "Processor" },
  { id: "im-mx40", model: "Novastar MX40 Pro", cat: "Processor" },
  { id: "im-helios", model: "Megapixel Helios", cat: "Processor" },
  { id: "im-vmix", model: "vMix M4 Switcher", cat: "Switcher" },
  { id: "im-atem", model: "Blackmagic ATEM 4 M/E", cat: "Switcher" },
  { id: "im-v160", model: "Roland V-160HD", cat: "Switcher" },
  { id: "im-sd12", model: "DiGiCo SD12", cat: "Console" },
  { id: "im-cl5", model: "Yamaha CL5", cat: "Console" },
  { id: "im-dlive", model: "Allen & Heath dLive S7000", cat: "Console" },
  { id: "im-ue150", model: "AW-UE150 PTZ Cam", cat: "Camera" },
  { id: "im-fr7", model: "Sony FR7 PTZ", cat: "Camera" },
  { id: "im-ursa", model: "Blackmagic URSA Broadcast G2", cat: "Camera" },
  { id: "im-la12x", model: "L-Acoustics LA12X", cat: "Amplifier" },
  { id: "im-plm", model: "Lab.gruppen PLM 20K44", cat: "Amplifier" },
  { id: "im-rb26", model: "ROE Ruby RB2.6 (24-pack)", cat: "LED Panel" },
  { id: "im-cb5", model: "ROE Carbon CB5 (24-pack)", cat: "LED Panel" },
  { id: "im-xr3", model: "INFiLED XR3 (24-pack)", cat: "LED Panel" },
  { id: "im-at5", model: "Absen AT5 Pro (24-pack)", cat: "LED Panel" },
  { id: "im-upad", model: "Unilumin UpadIV H6 (24-pack)", cat: "LED Panel" },
  { id: "im-distro", model: "Distro 200A 3ϕ", cat: "Power" },
  { id: "im-ups", model: "Eaton 9PX 3000VA UPS", cat: "Power" },
  { id: "im-pdu", model: "APC AP8865 PDU", cat: "Power" },
  { id: "im-cisco", model: "Cisco Catalyst 9300", cat: "Network" },
  { id: "im-gigacore", model: "Luminex GigaCore 30i", cat: "Network" },
  { id: "im-gx2c", model: "Disguise gx 2c", cat: "Server" },
  { id: "im-r660", model: "Dell R660 Server", cat: "Server" },
  { id: "im-sdi12g", model: "12G-SDI Cable · 25ft", cat: "Cabling" },
  { id: "im-cat6a", model: "Cat6A Cable · 100ft", cat: "Cabling" },
  { id: "im-fiber", model: "SMPTE Fiber · 300ft", cat: "Cabling" },
];

let customInvModels: InventoryModelDef[] = [];

// Live merged model catalog (built-in + user additions). Reassigned by
// setCustomInvModels; ES module live bindings propagate the new array to the
// inventory module.
export let INV_MODELS: InventoryModelDef[] = INV_MODEL_BUILTIN;

export function setCustomInvModels(defs: InventoryModelDef[]) {
  customInvModels = defs;
  INV_MODELS = [...INV_MODEL_BUILTIN, ...customInvModels];
}

export function isCustomInvModel(id: string): boolean {
  return customInvModels.some((d) => d.id === id);
}
