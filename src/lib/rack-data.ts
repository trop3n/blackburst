import type { Rack, RackColor, RackItem, RackItemDef } from "@/types";

// Built-in seed catalog. User-added equipment is layered on top at runtime via
// setCustomRackDefs (see @/store/useCatalog); RACK_CATALOG is the merged list
// every consumer reads. Keep existing ids stable — DEFAULT_RACK references them.
export const RACK_BUILTIN: RackItemDef[] = [
  { id: "sx40", model: "Brompton SX40", cat: "Processor", u: 1, w: 8.6, watts: 350, depth: 432, color: "accent" },
  { id: "tess", model: "Brompton Tessera S8", cat: "Processor", u: 1, w: 7.2, watts: 280, depth: 432, color: "accent" },
  { id: "t1", model: "Brompton Tessera T1", cat: "Processor", u: 1, w: 5.0, watts: 180, depth: 400, color: "accent" },
  { id: "mx40", model: "Novastar MX40 Pro", cat: "Processor", u: 2, w: 12.4, watts: 420, depth: 480, color: "accent" },
  { id: "mx6000", model: "Novastar MX6000 Pro", cat: "Processor", u: 4, w: 22.0, watts: 620, depth: 520, color: "accent" },
  { id: "vx1000", model: "Novastar VX1000 Pro", cat: "Processor", u: 1, w: 6.5, watts: 240, depth: 400, color: "accent" },
  { id: "helios", model: "Megapixel Helios", cat: "Processor", u: 2, w: 14.0, watts: 480, depth: 530, color: "accent" },
  { id: "helioslt", model: "Megapixel Helios LT", cat: "Processor", u: 1, w: 9.0, watts: 300, depth: 480, color: "accent" },
  { id: "colorlight", model: "Colorlight Z6", cat: "Processor", u: 1, w: 5.5, watts: 150, depth: 360, color: "accent" },

  { id: "vmix", model: "vMix M4 Switcher", cat: "Switcher", u: 1, w: 6.4, watts: 220, depth: 380, color: "magenta" },
  { id: "atem", model: "BMD ATEM 4 M/E", cat: "Switcher", u: 4, w: 14.0, watts: 250, depth: 410, color: "magenta" },
  { id: "atemhd", model: "BMD ATEM Constellation HD", cat: "Switcher", u: 1, w: 5.0, watts: 120, depth: 300, color: "magenta" },
  { id: "e2", model: "Barco E2 Gen2", cat: "Switcher", u: 8, w: 60.0, watts: 2400, depth: 640, color: "magenta" },
  { id: "aquilon", model: "Analog Way Aquilon RS6", cat: "Switcher", u: 8, w: 55.0, watts: 2200, depth: 640, color: "magenta" },
  { id: "carbonite", model: "Ross Carbonite Ultra", cat: "Switcher", u: 3, w: 16.0, watts: 400, depth: 480, color: "magenta" },
  { id: "tricaster", model: "NewTek TriCaster 2 Elite", cat: "Switcher", u: 4, w: 20.0, watts: 500, depth: 560, color: "magenta" },

  { id: "smtl", model: "AJA Kumo 3232 SDI Router", cat: "Signal", u: 2, w: 8.5, watts: 180, depth: 410, color: "magenta" },
  { id: "kumo64", model: "AJA Kumo 6464", cat: "Signal", u: 4, w: 16.0, watts: 320, depth: 460, color: "magenta" },
  { id: "vhub", model: "BMD Videohub 40×40", cat: "Signal", u: 6, w: 22.0, watts: 300, depth: 480, color: "magenta" },
  { id: "opengear", model: "Ross openGear OG3-FR", cat: "Signal", u: 2, w: 9.0, watts: 200, depth: 400, color: "magenta" },
  { id: "conv6", model: "BMD Mini Converter · 6×", cat: "Signal", u: 1, w: 3.0, watts: 60, depth: 200, color: "magenta" },
  { id: "lwmx", model: "Lightware MX2-16×16", cat: "Signal", u: 4, w: 14.0, watts: 260, depth: 440, color: "magenta" },

  { id: "net48", model: "Cisco Cat 9300 · 48-port", cat: "Network", u: 1, w: 6.8, watts: 160, depth: 460, color: "info" },
  { id: "net24", model: "Cisco Cat 9200 · 24-port", cat: "Network", u: 1, w: 5.2, watts: 110, depth: 420, color: "info" },
  { id: "net10g", model: "Arista 7050X · 32×100GbE", cat: "Network", u: 1, w: 9.4, watts: 240, depth: 510, color: "info" },
  { id: "netm4300", model: "Netgear M4300 · 24×10G", cat: "Network", u: 1, w: 6.0, watts: 140, depth: 400, color: "info" },
  { id: "fw", model: "Palo Alto PA-440", cat: "Network", u: 1, w: 4.5, watts: 80, depth: 360, color: "info" },
  { id: "gigacore", model: "Luminex GigaCore 30i", cat: "Network", u: 1, w: 4.0, watts: 90, depth: 380, color: "info" },
  { id: "patch48", model: "Cat6A Patch Panel · 48-port", cat: "Network", u: 1, w: 1.5, watts: 0, depth: 120, color: "info" },

  { id: "srv1u", model: "Dell R660 1U Server", cat: "Compute", u: 1, w: 16.5, watts: 600, depth: 720, color: "accent" },
  { id: "srv2u", model: "HPE DL380 Gen11 2U", cat: "Compute", u: 2, w: 24.0, watts: 800, depth: 750, color: "accent" },
  { id: "media", model: "Disguise gx 2c · 4U", cat: "Compute", u: 4, w: 36.0, watts: 1200, depth: 720, color: "accent" },
  { id: "gx3", model: "Disguise gx 3 · 4U", cat: "Compute", u: 4, w: 40.0, watts: 1600, depth: 750, color: "accent" },
  { id: "vx4", model: "Disguise vx 4", cat: "Compute", u: 4, w: 38.0, watts: 1400, depth: 720, color: "accent" },
  { id: "watchout", model: "Dataton Watchout Server", cat: "Compute", u: 2, w: 22.0, watts: 700, depth: 680, color: "accent" },
  { id: "macstudio", model: "Mac Studio · Rack Shelf", cat: "Compute", u: 2, w: 8.0, watts: 370, depth: 400, color: "accent" },

  { id: "sd12", model: "DiGiCo SD-Rack", cat: "Audio", u: 6, w: 22.0, watts: 240, depth: 440, color: "info" },
  { id: "sdmini", model: "DiGiCo SD-MiniRack", cat: "Audio", u: 3, w: 12.0, watts: 160, depth: 420, color: "info" },
  { id: "la12x", model: "L-Acoustics LA12X", cat: "Audio", u: 2, w: 14.5, watts: 1500, depth: 480, color: "info" },
  { id: "la4x", model: "L-Acoustics LA4X", cat: "Audio", u: 2, w: 11.0, watts: 900, depth: 480, color: "info" },
  { id: "plm20k", model: "Lab.gruppen PLM 20K44", cat: "Audio", u: 2, w: 15.0, watts: 2000, depth: 500, color: "info" },
  { id: "rio", model: "Yamaha Rio3224-D2", cat: "Audio", u: 3, w: 12.0, watts: 150, depth: 380, color: "info" },
  { id: "mics", model: "Shure ULXD4Q · 4ch", cat: "Audio", u: 1, w: 4.2, watts: 60, depth: 360, color: "info" },
  { id: "axient", model: "Shure Axient AD4Q · 4ch", cat: "Audio", u: 1, w: 4.5, watts: 70, depth: 360, color: "info" },
  { id: "di", model: "Radial JD7 · DI", cat: "Audio", u: 1, w: 3.0, watts: 20, depth: 200, color: "info" },

  { id: "pdu", model: "APC AP8865 PDU · 30A", cat: "Power", u: 1, w: 5.0, watts: 0, depth: 110, color: "warn" },
  { id: "pdump", model: "Middle Atlantic PD-2015", cat: "Power", u: 1, w: 2.5, watts: 0, depth: 90, color: "warn" },
  { id: "ups", model: "Eaton 9PX 3000VA", cat: "Power", u: 2, w: 24.0, watts: 60, depth: 540, color: "warn" },
  { id: "ups5k", model: "Eaton 9PX 5000VA", cat: "Power", u: 3, w: 34.0, watts: 80, depth: 600, color: "warn" },
  { id: "iso", model: "Furman P-2400 IT Iso", cat: "Power", u: 2, w: 18.0, watts: 30, depth: 280, color: "warn" },
  { id: "seq", model: "Furman CN-3600S Sequencer", cat: "Power", u: 2, w: 9.0, watts: 20, depth: 300, color: "warn" },
  { id: "distro", model: "Lex PowerHouse · 100A", cat: "Power", u: 4, w: 28.0, watts: 0, depth: 300, color: "warn" },

  { id: "kvm", model: "1U KVM Drawer · 17in", cat: "Misc", u: 1, w: 11.0, watts: 40, depth: 590, color: "muted" },
  { id: "mon", model: "Marshall 2×7in Rack Monitor", cat: "Misc", u: 3, w: 5.0, watts: 30, depth: 120, color: "muted" },
  { id: "shelf", model: "Vented Rack Shelf · 2U", cat: "Misc", u: 2, w: 2.0, watts: 0, depth: 400, color: "muted" },
  { id: "drawer", model: "Rack Drawer · 2U", cat: "Misc", u: 2, w: 4.0, watts: 0, depth: 450, color: "muted" },
  { id: "fan", model: "Fan Panel · 1U", cat: "Misc", u: 1, w: 2.0, watts: 60, depth: 100, color: "muted" },
  { id: "blank1", model: "Blank Panel · 1U", cat: "Misc", u: 1, w: 0.5, watts: 0, depth: 0, color: "muted" },
  { id: "blank2", model: "Blank Panel · 2U", cat: "Misc", u: 2, w: 0.8, watts: 0, depth: 0, color: "muted" },
  { id: "vent", model: "Vented Panel · 2U", cat: "Misc", u: 2, w: 0.6, watts: 0, depth: 0, color: "muted" },
];

let customRackDefs: RackItemDef[] = [];

// Live merged catalog (built-in + user additions). Reassigned by
// setCustomRackDefs; ES module live bindings propagate the new array to every
// importer, so slot math and the catalog pane always see current equipment.
export let RACK_CATALOG: RackItemDef[] = RACK_BUILTIN;

export function setCustomRackDefs(defs: RackItemDef[]) {
  customRackDefs = defs;
  RACK_CATALOG = [...RACK_BUILTIN, ...customRackDefs];
}

export function isCustomRackDef(id: string): boolean {
  return customRackDefs.some((d) => d.id === id);
}

export const DEFAULT_RACK: RackItem[] = [];

export const DEFAULT_RACKS: Rack[] = [
  { id: "R-001", name: "Rack 1", location: "", size: 42, items: DEFAULT_RACK },
];

export const RACK_COLOR_MAP: Record<RackColor, { bg: string; bd: string; fg: string }> = {
  accent: { bg: "oklch(0.86 0.19 145 / 0.10)", bd: "oklch(0.86 0.19 145 / 0.45)", fg: "var(--accent)" },
  magenta: { bg: "oklch(0.78 0.22 330 / 0.10)", bd: "oklch(0.78 0.22 330 / 0.45)", fg: "var(--color-magenta)" },
  info: { bg: "oklch(0.78 0.13 230 / 0.10)", bd: "oklch(0.78 0.13 230 / 0.45)", fg: "var(--color-info)" },
  warn: { bg: "oklch(0.78 0.16 75 / 0.10)", bd: "oklch(0.78 0.16 75 / 0.45)", fg: "var(--color-warn)" },
  muted: { bg: "var(--color-bg-2)", bd: "var(--color-line-strong)", fg: "var(--color-fg-mute)" },
};
