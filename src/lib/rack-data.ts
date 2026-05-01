import type { RackColor, RackItem, RackItemDef } from "@/types";

export const RACK_CATALOG: RackItemDef[] = [
  { id: "sx40", model: "Brompton SX40", cat: "Processor", u: 1, w: 8.6, watts: 350, depth: 432, color: "accent" },
  { id: "tess", model: "Brompton Tessera S8", cat: "Processor", u: 1, w: 7.2, watts: 280, depth: 432, color: "accent" },
  { id: "mx40", model: "Novastar MX40 Pro", cat: "Processor", u: 2, w: 12.4, watts: 420, depth: 480, color: "accent" },
  { id: "helios", model: "Megapixel Helios", cat: "Processor", u: 2, w: 14.0, watts: 480, depth: 530, color: "accent" },
  { id: "vmix", model: "vMix M4 Switcher", cat: "Switcher", u: 1, w: 6.4, watts: 220, depth: 380, color: "magenta" },
  { id: "atem", model: "BMD ATEM 4 M/E", cat: "Switcher", u: 4, w: 14.0, watts: 250, depth: 410, color: "magenta" },
  { id: "smtl", model: "AJA Kumo 3232 SDI Router", cat: "Switcher", u: 2, w: 8.5, watts: 180, depth: 410, color: "magenta" },
  { id: "net48", model: "Cisco Cat 9300 · 48-port", cat: "Network", u: 1, w: 6.8, watts: 160, depth: 460, color: "info" },
  { id: "net10g", model: "Arista 7050X · 32×100GbE", cat: "Network", u: 1, w: 9.4, watts: 240, depth: 510, color: "info" },
  { id: "fw", model: "Palo Alto PA-440", cat: "Network", u: 1, w: 4.5, watts: 80, depth: 360, color: "info" },
  { id: "srv1u", model: "Dell R660 1U Server", cat: "Compute", u: 1, w: 16.5, watts: 600, depth: 720, color: "accent" },
  { id: "srv2u", model: "HPE DL380 Gen11 2U", cat: "Compute", u: 2, w: 24.0, watts: 800, depth: 750, color: "accent" },
  { id: "media", model: "Disguise gx 2c · 4U", cat: "Compute", u: 4, w: 36.0, watts: 1200, depth: 720, color: "accent" },
  { id: "sd12", model: "DiGiCo SD-Rack", cat: "Audio", u: 6, w: 22.0, watts: 240, depth: 440, color: "info" },
  { id: "la12x", model: "L-Acoustics LA12X", cat: "Audio", u: 2, w: 14.5, watts: 1500, depth: 480, color: "info" },
  { id: "mics", model: "Shure ULXD4Q · 4ch", cat: "Audio", u: 1, w: 4.2, watts: 60, depth: 360, color: "info" },
  { id: "pdu", model: "APC AP8865 PDU · 30A", cat: "Power", u: 1, w: 5.0, watts: 0, depth: 110, color: "warn" },
  { id: "ups", model: "Eaton 9PX 3000VA", cat: "Power", u: 2, w: 24.0, watts: 60, depth: 540, color: "warn" },
  { id: "iso", model: "Furman P-2400 IT Iso", cat: "Power", u: 2, w: 18.0, watts: 30, depth: 280, color: "warn" },
  { id: "kvm", model: "1U KVM Drawer · 17in", cat: "Misc", u: 1, w: 11.0, watts: 40, depth: 590, color: "muted" },
  { id: "blank1", model: "Blank Panel · 1U", cat: "Misc", u: 1, w: 0.5, watts: 0, depth: 0, color: "muted" },
  { id: "vent", model: "Vented Panel · 2U", cat: "Misc", u: 2, w: 0.6, watts: 0, depth: 0, color: "muted" },
];

export const DEFAULT_RACK: RackItem[] = [
  { iid: 1, id: "blank1", pos: 41 },
  { iid: 2, id: "kvm", pos: 39 },
  { iid: 3, id: "vmix", pos: 37 },
  { iid: 4, id: "atem", pos: 33 },
  { iid: 5, id: "sx40", pos: 31 },
  { iid: 6, id: "sx40", pos: 30 },
  { iid: 7, id: "tess", pos: 28 },
  { iid: 8, id: "smtl", pos: 26 },
  { iid: 9, id: "net10g", pos: 24 },
  { iid: 10, id: "net48", pos: 22 },
  { iid: 11, id: "fw", pos: 21 },
  { iid: 12, id: "srv2u", pos: 18 },
  { iid: 13, id: "media", pos: 13 },
  { iid: 14, id: "sd12", pos: 7 },
  { iid: 15, id: "ups", pos: 4 },
  { iid: 16, id: "pdu", pos: 1 },
];

export const RACK_COLOR_MAP: Record<RackColor, { bg: string; bd: string; fg: string }> = {
  accent: { bg: "oklch(0.86 0.19 145 / 0.10)", bd: "oklch(0.86 0.19 145 / 0.45)", fg: "var(--accent)" },
  magenta: { bg: "oklch(0.78 0.22 330 / 0.10)", bd: "oklch(0.78 0.22 330 / 0.45)", fg: "var(--color-magenta)" },
  info: { bg: "oklch(0.78 0.13 230 / 0.10)", bd: "oklch(0.78 0.13 230 / 0.45)", fg: "var(--color-info)" },
  warn: { bg: "oklch(0.78 0.16 75 / 0.10)", bd: "oklch(0.78 0.16 75 / 0.45)", fg: "var(--color-warn)" },
  muted: { bg: "var(--color-bg-2)", bd: "var(--color-line-strong)", fg: "var(--color-fg-mute)" },
};
