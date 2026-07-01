import type { SystemDeviceDef } from "@/types";

// Built-in device palette. Each entry carries its own type / lanes / details
// (previously these were shared per-group templates). User-added devices layer
// on top at runtime via setCustomSystemDefs (see @/store/useCatalog);
// SYSTEM_DEVICES is the merged list the palette and drop handler read.
export const SYSTEM_BUILTIN: SystemDeviceDef[] = [
  { id: "src-resolume", cat: "VIDEO SOURCES", type: "SOURCE", name: "Resolume Mac Pro", out: ["video", "network"], details: { res: "3840×2160", fps: "60p" } },
  { id: "src-gx2c", cat: "VIDEO SOURCES", type: "SOURCE", name: "Disguise gx 2c", out: ["video", "network"], details: { res: "4K", fps: "60p" } },
  { id: "src-hyperdeck", cat: "VIDEO SOURCES", type: "SOURCE", name: "BMD HyperDeck", out: ["video"], details: { res: "1920×1080", codec: "ProRes" } },
  { id: "src-watchout", cat: "VIDEO SOURCES", type: "SOURCE", name: "Watchout Server", out: ["video", "network"], details: { res: "4K", outputs: "4" } },
  { id: "src-playback", cat: "VIDEO SOURCES", type: "SOURCE", name: "PlaybackPro Plus", out: ["video"], details: { res: "1920×1080", fps: "60p" } },

  { id: "cam-ue150", cat: "CAMERAS", type: "SOURCE", name: "Panasonic AW-UE150", out: ["video", "network"], details: { res: "1920×1080", fps: "60i" } },
  { id: "cam-fr7", cat: "CAMERAS", type: "SOURCE", name: "Sony FR7 PTZ", out: ["video"], details: { res: "3840×2160", fps: "60p" } },
  { id: "cam-ursa", cat: "CAMERAS", type: "SOURCE", name: "BMD URSA Broadcast", out: ["video"], details: { res: "1920×1080", fps: "60p" } },
  { id: "cam-cv503", cat: "CAMERAS", type: "SOURCE", name: "Marshall CV503", out: ["video"], details: { res: "1920×1080", fps: "60p" } },

  { id: "proc-sx40", cat: "PROCESSORS", type: "PROC", name: "Brompton SX40", in: ["video"], out: ["network"], details: { ports: "4×10GbE", load: "0%" } },
  { id: "proc-tessera", cat: "PROCESSORS", type: "PROC", name: "Brompton Tessera S8", in: ["video"], out: ["network"], details: { ports: "8×1GbE", load: "0%" } },
  { id: "proc-mx40", cat: "PROCESSORS", type: "PROC", name: "Novastar MX40 Pro", in: ["video"], out: ["network"], details: { ports: "20×RJ45", load: "0%" } },
  { id: "proc-helios", cat: "PROCESSORS", type: "PROC", name: "Megapixel Helios", in: ["video"], out: ["network"], details: { ports: "8×10GbE", load: "0%" } },
  { id: "proc-z6", cat: "PROCESSORS", type: "PROC", name: "Colorlight Z6", in: ["video"], out: ["network"], details: { ports: "20×RJ45", load: "0%" } },

  { id: "mix-vmix", cat: "MIXERS", type: "MIXER", name: "vMix M4", in: ["video", "video"], out: ["video"], details: { inputs: "4×SDI", outputs: "2×SDI" } },
  { id: "mix-atem", cat: "MIXERS", type: "MIXER", name: "Blackmagic ATEM 4 M/E", in: ["video", "video"], out: ["video"], details: { inputs: "20×SDI", outputs: "8×SDI" } },
  { id: "mix-v160", cat: "MIXERS", type: "MIXER", name: "Roland V-160HD", in: ["video", "video"], out: ["video"], details: { inputs: "16×", outputs: "4×" } },
  { id: "mix-carbonite", cat: "MIXERS", type: "MIXER", name: "Ross Carbonite Ultra", in: ["video", "video"], out: ["video"], details: { inputs: "24×", outputs: "8×" } },
  { id: "mix-e2", cat: "MIXERS", type: "MIXER", name: "Barco E2 Gen2", in: ["video", "video"], out: ["video"], details: { inputs: "28×", outputs: "14×" } },

  { id: "rte-kumo", cat: "ROUTING", type: "ROUTER", name: "AJA Kumo 3232", in: ["video"], out: ["video"], details: { size: "32×32", signal: "3G-SDI" } },
  { id: "rte-vhub", cat: "ROUTING", type: "ROUTER", name: "BMD Videohub 40×40", in: ["video"], out: ["video"], details: { size: "40×40", signal: "12G-SDI" } },
  { id: "rte-lightware", cat: "ROUTING", type: "ROUTER", name: "Lightware MX2-16×16", in: ["video"], out: ["video"], details: { size: "16×16", signal: "HDMI 2.0" } },

  { id: "wall-led", cat: "DISPLAYS", type: "WALL", name: "LED Wall", in: ["network"], details: { panels: "—", res: "—" } },
  { id: "wall-proj", cat: "DISPLAYS", type: "WALL", name: "Projector", in: ["video"], details: { lumens: "20000", res: "4K" } },
  { id: "wall-lcd", cat: "DISPLAYS", type: "WALL", name: "LCD Display", in: ["video"], details: { size: "55in", res: "4K" } },

  { id: "aud-sd12", cat: "AUDIO", type: "AUDIO", name: "DiGiCo SD12", in: ["audio"], out: ["audio"], details: { channels: "96", aux: "24" } },
  { id: "aud-cl5", cat: "AUDIO", type: "AUDIO", name: "Yamaha CL5", in: ["audio"], out: ["audio"], details: { channels: "72", aux: "24" } },
  { id: "aud-dlive", cat: "AUDIO", type: "AUDIO", name: "Allen & Heath dLive", in: ["audio"], out: ["audio"], details: { channels: "128", aux: "64" } },
  { id: "aud-ulxd", cat: "AUDIO", type: "AUDIO", name: "Shure ULXD4Q", in: ["audio"], out: ["audio"], details: { channels: "4", band: "G50" } },

  { id: "amp-la12x", cat: "AMPLIFIERS", type: "AMP", name: "L-Acoustics LA12X", in: ["audio"], out: ["audio"], details: { ch: "4", w: "12.8kW" } },
  { id: "amp-plm", cat: "AMPLIFIERS", type: "AMP", name: "Lab.gruppen PLM 20K44", in: ["audio"], out: ["audio"], details: { ch: "4", w: "20kW" } },

  { id: "net-cisco", cat: "NETWORK", type: "NETWORK", name: "Cisco Cat 9300", in: ["network"], out: ["network"], details: { ports: "48×1GbE", uplink: "4×10G" } },
  { id: "net-gigacore", cat: "NETWORK", type: "NETWORK", name: "Luminex GigaCore 30i", in: ["network"], out: ["network"], details: { ports: "30×", uplink: "SFP+" } },
  { id: "net-arista", cat: "NETWORK", type: "NETWORK", name: "Arista 7050X", in: ["network"], out: ["network"], details: { ports: "32×100GbE", uplink: "—" } },

  { id: "pwr-distro", cat: "POWER", type: "POWER", name: "Distro 200A 3ϕ", out: ["power"], details: { capacity: "144kVA", load: "0kVA" } },
  { id: "pwr-lex", cat: "POWER", type: "POWER", name: "Lex SQ-12IL", out: ["power"], details: { capacity: "12×20A", load: "0A" } },
  { id: "pwr-ups", cat: "POWER", type: "POWER", name: "Eaton 9PX UPS", out: ["power"], details: { capacity: "5kVA", runtime: "12min" } },
];

let customSystemDefs: SystemDeviceDef[] = [];

// Live merged palette (built-in + user additions). Reassigned by
// setCustomSystemDefs; ES module live bindings propagate the new array to every
// importer, so the palette and drop handler always see current devices.
export let SYSTEM_DEVICES: SystemDeviceDef[] = SYSTEM_BUILTIN;

export function setCustomSystemDefs(defs: SystemDeviceDef[]) {
  customSystemDefs = defs;
  SYSTEM_DEVICES = [...SYSTEM_BUILTIN, ...customSystemDefs];
}
