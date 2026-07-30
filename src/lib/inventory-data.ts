import type { Asset, AssetCategory, InventoryModelDef, ShowSchedule } from "@/types";

export const ASSETS: Asset[] = [];

// Category taxonomy used by the add-asset flow and the sidebar. Live per-category
// counts are computed from actual assets; the `count` here is unused fallback.
export const ASSET_CATEGORIES: AssetCategory[] = [
  { name: "All gear", count: 0 },
  { name: "LED Panel", count: 0 },
  { name: "Processor", count: 0 },
  { name: "Switcher", count: 0 },
  { name: "Console", count: 0 },
  { name: "Camera", count: 0 },
  { name: "Amplifier", count: 0 },
  { name: "Power", count: 0 },
  { name: "Network", count: 0 },
  { name: "Server", count: 0 },
  { name: "Cabling", count: 0 },
];

export const SHOWS: ShowSchedule[] = [];

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

// Live merged model catalog (built-in + user additions). Reassigned by
// setCustomInvModels; ES module live bindings propagate the new array to the
// inventory module.
export let INV_MODELS: InventoryModelDef[] = INV_MODEL_BUILTIN;

export function setCustomInvModels(defs: InventoryModelDef[]) {
  INV_MODELS = [...INV_MODEL_BUILTIN, ...defs];
}
