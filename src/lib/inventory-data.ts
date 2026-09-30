import type { Asset, AssetCategory, InventoryModelDef, ShowSchedule } from "@/types";

export const ASSETS: Asset[] = [];

// Category taxonomy used by the add-asset flow and the sidebar. Live per-category
// counts are computed from actual assets; the `count` here is unused fallback.
export const ASSET_CATEGORIES: AssetCategory[] = [
  { name: "All gear", count: 0 },
  { name: "Camera", count: 0 },
  { name: "Switcher", count: 0 },
  { name: "Routing", count: 0 },
  { name: "Converter", count: 0 },
  { name: "Record", count: 0 },
  { name: "Display", count: 0 },
  { name: "LED Panel", count: 0 },
  { name: "Processor", count: 0 },
  { name: "Console", count: 0 },
  { name: "Audio I/O", count: 0 },
  { name: "Wireless", count: 0 },
  { name: "Amplifier", count: 0 },
  { name: "Control", count: 0 },
  { name: "Network", count: 0 },
  { name: "Power", count: 0 },
  { name: "Cabling", count: 0 },
];

export const SHOWS: ShowSchedule[] = [];

// Built-in model catalog. Assets are individual tracked units; this is the
// catalog of *models* they're instances of — it feeds the "New asset" flow
// (a known model auto-fills its category) and the "add a unit" shortcut. User
// additions layer on top via setCustomInvModels (see @/store/useCatalog);
// INV_MODELS is the merged list the inventory module reads.
export const INV_MODEL_BUILTIN: InventoryModelDef[] = [
  // Cameras
  { id: "im-ue100", model: "Panasonic AW-UE100", cat: "Camera" },
  { id: "im-ue4", model: "Panasonic AW-UE4", cat: "Camera" },
  { id: "im-he130", model: "Panasonic AW-HE130", cat: "Camera" },
  { id: "im-he120", model: "Panasonic AW-HE120", cat: "Camera" },
  { id: "im-he42", model: "Panasonic AW-HE42", cat: "Camera" },
  { id: "im-zhd5500", model: "Hitachi Z-HD5500", cat: "Camera" },

  // Switching, routing and distribution
  { id: "im-carbonite", model: "Ross Carbonite Black Plus", cat: "Switcher" },
  { id: "im-nd3g64", model: "Ross ND3G64", cat: "Routing" },
  { id: "im-nk3g64", model: "Ross NK-3G64", cat: "Routing" },
  { id: "im-videohub", model: "BMD Smart Videohub 20×20", cat: "Routing" },
  { id: "im-lightware", model: "Lightware MX12×12 DVI", cat: "Routing" },
  { id: "im-dtpcp84", model: "Extron DTP CrossPoint 84 4K", cat: "Routing" },
  { id: "im-ogframe", model: "Ross openGear OG3-FR-CN", cat: "Converter" },
  { id: "im-qra8808", model: "Ross QRA-8808", cat: "Converter" },
  { id: "im-uda8705", model: "Ross UDA-8705A", cat: "Converter" },
  { id: "im-mux8258", model: "Ross MUX-8258-8C", cat: "Converter" },
  { id: "im-oghi5", model: "AJA OG-HI5-4K-PLUS", cat: "Converter" },
  { id: "im-foxbox-tx", model: "Extron FOXBOX Tx DVI Plus", cat: "Converter" },
  { id: "im-foxbox-rx", model: "Extron FOXBOX Rx DVI Plus", cat: "Converter" },
  { id: "im-cobalt-bbg", model: "Cobalt BBG-S-TO-A", cat: "Converter" },
  { id: "im-dmon6s", model: "Decimator DMON-6S", cat: "Converter" },
  { id: "im-spg8260", model: "Ross SPG-8260", cat: "Converter" },

  // Record, stream and playback
  { id: "im-hyperdeck", model: "BMD HyperDeck Studio HD Plus", cat: "Record" },
  { id: "im-ultrastudio", model: "BMD UltraStudio 4K", cat: "Record" },
  { id: "im-decklink", model: "BMD DeckLink", cat: "Record" },
  { id: "im-sme211", model: "Extron SME 211", cat: "Record" },
  { id: "im-brightsign", model: "BrightSign player", cat: "Record" },

  // Display
  { id: "im-boxer", model: "Christie Boxer 2K20", cat: "Display" },
  { id: "im-vpl131", model: "Sony VPL-FHZ131L", cat: "Display" },
  { id: "im-vpl75", model: "Sony VPL-FHZ75", cat: "Display" },
  { id: "im-be65t", model: "Samsung BE65T-H", cat: "Display" },
  { id: "im-lg43", model: "LG 43LV340C", cat: "Display" },
  { id: "im-tcl55", model: "TCL 55in Roku TV", cat: "Display" },
  { id: "im-a3pro", model: "Absen A3 Pro", cat: "LED Panel" },
  { id: "im-vx2000pro", model: "Novastar VX2000 Pro", cat: "Processor" },
  { id: "im-absen-prohd", model: "Absen LED Video Pro-HD", cat: "Processor" },

  // Audio
  { id: "im-cl5", model: "Yamaha CL5", cat: "Console" },
  { id: "im-ql5", model: "Yamaha QL5", cat: "Console" },
  { id: "im-ql1", model: "Yamaha QL1", cat: "Console" },
  { id: "im-rio3224", model: "Yamaha Rio3224-D", cat: "Audio I/O" },
  { id: "im-rio1608", model: "Yamaha Rio1608-D", cat: "Audio I/O" },
  { id: "im-ri8", model: "Yamaha Ri8-D", cat: "Audio I/O" },
  { id: "im-ro8", model: "Yamaha Ro8-D", cat: "Audio I/O" },
  { id: "im-core510i", model: "QSC Q-SYS Core 510i", cat: "Audio I/O" },
  { id: "im-core110f", model: "QSC Q-SYS Core 110f", cat: "Audio I/O" },
  { id: "im-core500i", model: "QSC Q-SYS Core 500i", cat: "Audio I/O" },
  { id: "im-nv32h", model: "QSC NV-32-H", cat: "Audio I/O" },
  { id: "im-cdn64", model: "QSC CDN64 Dante card", cat: "Audio I/O" },
  { id: "im-livemix", model: "Livemix LM-DIGITAL-SK1", cat: "Audio I/O" },
  { id: "im-waves", model: "Waves SoundGrid Server One", cat: "Audio I/O" },
  { id: "im-listen", model: "Listen LW-160-02-D", cat: "Audio I/O" },
  { id: "im-clearcom", model: "Clear-Com intercom", cat: "Audio I/O" },
  { id: "im-ulxd4q", model: "Shure ULXD4Q", cat: "Wireless" },
  { id: "im-ad4q", model: "Shure Axient AD4Q", cat: "Wireless" },
  { id: "im-ad611", model: "Shure AD611", cat: "Wireless" },
  { id: "im-psm", model: "Shure PSM in-ear system", cat: "Wireless" },
  { id: "im-la4x", model: "L-Acoustics LA4X", cat: "Amplifier" },
  { id: "im-la716i", model: "L-Acoustics LA7.16i", cat: "Amplifier" },
  { id: "im-cxq", model: "QSC CX-Q network amplifier", cat: "Amplifier" },
  { id: "im-cxd45q", model: "QSC CXD4.5Q", cat: "Amplifier" },
  { id: "im-netpau", model: "Extron NetPA U 1004-70V", cat: "Amplifier" },
  { id: "im-e104", model: "Lab.gruppen E 10:4", cat: "Amplifier" },

  // Control
  { id: "im-ipcp255", model: "Extron IPCP Pro 255", cat: "Control" },
  { id: "im-tlp725m", model: "Extron TLP Pro 725M", cat: "Control" },
  { id: "im-tlp725t", model: "Extron TLP Pro 725T", cat: "Control" },
  { id: "im-tlp1022t", model: "Extron TLP Pro 1022T", cat: "Control" },
  { id: "im-nbp106", model: "Extron NBP 106", cat: "Control" },
  { id: "im-nbp110", model: "Extron NBP 110D", cat: "Control" },
  { id: "im-nbp200", model: "Extron NBP 200", cat: "Control" },
  { id: "im-sharelink", model: "Extron ShareLink Pro 500", cat: "Control" },
  { id: "im-tsc", model: "QSC TSC-series touchscreen", cat: "Control" },
  { id: "im-rp60", model: "Panasonic AW-RP60", cat: "Control" },
  { id: "im-cbpanel", model: "Ross Carbonite panel", cat: "Control" },
  { id: "im-rcpme", model: "Ross RCP-ME router panel", cat: "Control" },
  { id: "im-cueserver", model: "Interactive CueServer 2", cat: "Control" },
  { id: "im-itach", model: "Global Caché iTach IP2CC", cat: "Control" },
  { id: "im-ionxe", model: "ETC Ion XE", cat: "Control" },
  { id: "im-puck", model: "ETC PUCK", cat: "Control" },
  { id: "im-nlight", model: "Acuity nLight controller", cat: "Control" },

  // Network and power
  { id: "im-sonicwall", model: "SonicWall NSa 2700", cat: "Network" },
  { id: "im-sg300", model: "Cisco SG300", cat: "Network" },
  { id: "im-araknis", model: "Araknis switch", cat: "Network" },
  { id: "im-pakedge", model: "Pakedge SE-8-EP", cat: "Network" },
  { id: "im-masterclock", model: "Masterclock time system", cat: "Network" },
  { id: "im-ups2200", model: "Middle Atlantic UPS-2200R", cat: "Power" },
  { id: "im-smt1500", model: "APC Smart-UPS SMT1500", cat: "Power" },

  // Cabling
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
