import type { SystemDeviceDef } from "@/types";

// Built-in device palette — the gear St Andrew actually has. Every entry traces
// to the AV network inventory (`RECONCILED.csv`), the 2017 CLAIR bid equipment
// list, the Q-SYS design export, the openGear frame export, the Dante preset or
// a live probe; the stock rental-house palette this replaced (214 Blackmagic and
// Novastar models, of which about ten were ours) is gone. `details` carries only
// figures those sources state — nothing here is estimated.
//
// User-added devices layer on top at runtime via setCustomSystemDefs (see
// @/store/useCatalog); SYSTEM_DEVICES is the merged list the palette and drop
// handler read.
export const SYSTEM_BUILTIN: SystemDeviceDef[] = [
  // ── Sources ───────────────────────────────────────────────────────────
  { id: "src-resolume", cat: "VIDEO SOURCES", type: "SOURCE", name: "Resolume Arena workstation", out: ["video", "network"], details: {} },
  { id: "src-brightsign", cat: "VIDEO SOURCES", type: "SOURCE", name: "BrightSign player", out: ["video", "network"], details: {} },
  { id: "src-macmini", cat: "VIDEO SOURCES", type: "SOURCE", name: "Mac Mini — ProPresenter", out: ["video", "network"], details: { role: "Playback to the side screens over SDI" } },
  { id: "src-sharelink", cat: "VIDEO SOURCES", type: "SOURCE", name: "Extron ShareLink Pro 500", in: ["network"], out: ["video"], details: {} },

  // ── Cameras ───────────────────────────────────────────────────────────
  { id: "cam-ue100", cat: "CAMERAS", type: "SOURCE", name: "Panasonic AW-UE100", out: ["video", "network"], details: { res: "3840×2160" } },
  { id: "cam-ue4", cat: "CAMERAS", type: "SOURCE", name: "Panasonic AW-UE4", out: ["video", "network"], details: { res: "3840×2160" } },
  { id: "cam-he130", cat: "CAMERAS", type: "SOURCE", name: "Panasonic AW-HE130", out: ["video", "network"], details: { res: "1920×1080" } },
  { id: "cam-he120", cat: "CAMERAS", type: "SOURCE", name: "Panasonic AW-HE120", out: ["video", "network"], details: { res: "1920×1080" } },
  { id: "cam-he42", cat: "CAMERAS", type: "SOURCE", name: "Panasonic AW-HE42", out: ["video", "network"], details: { res: "1920×1080" } },
  { id: "cam-zhd5500", cat: "CAMERAS", type: "SOURCE", name: "Hitachi Z-HD5500", out: ["video"], details: { res: "1280×720", ccu: "CU-HD1300" } },

  // ── Switching and routing ─────────────────────────────────────────────
  { id: "mix-carbonite", cat: "MIXERS", type: "MIXER", name: "Ross Carbonite Black Plus", in: ["video", "video"], out: ["video"], details: { mes: "2 M/E" } },
  { id: "rte-nd3g64", cat: "ROUTING", type: "ROUTER", name: "Ross ND3G64", in: ["video"], out: ["video"], details: { size: "64×64", signal: "3G/HD/SD SDI" } },
  { id: "rte-nk3g64", cat: "ROUTING", type: "ROUTER", name: "Ross NK-3G64", in: ["video"], out: ["video"], details: { size: "64×64" } },
  { id: "bmd-videohub-20x20", cat: "ROUTING", type: "ROUTER", name: "BMD Smart Videohub 20×20", in: ["video"], out: ["video"], details: { size: "20×20" } },
  { id: "rte-lightware", cat: "ROUTING", type: "ROUTER", name: "Lightware MX12×12 DVI", in: ["video"], out: ["video"], details: { size: "12×12", signal: "DVI" } },
  { id: "rte-dtpcp84", cat: "ROUTING", type: "ROUTER", name: "Extron DTP CrossPoint 84 4K", in: ["video"], out: ["video"], details: { size: "8×4" } },

  // ── LED ───────────────────────────────────────────────────────────────
  { id: "proc-vx2000pro", cat: "PROCESSORS", type: "PROC", name: "Novastar VX2000 Pro", in: ["video"], out: ["network"], details: { role: "Drives the BAS wall" } },
  { id: "proc-absen-prohd", cat: "PROCESSORS", type: "PROC", name: "Absen LED Video Pro-HD", in: ["video"], out: ["network"], details: { outputs: "4×RJ45 + 4×OPT", role: "Drives one side screen" } },

  // ── Displays ──────────────────────────────────────────────────────────
  { id: "wall-led", cat: "DISPLAYS", type: "WALL", name: "LED Wall", in: ["network"], details: { panels: "—", res: "—" } },
  { id: "wall-proj", cat: "DISPLAYS", type: "WALL", name: "Projector", in: ["video"], details: {} },
  { id: "wall-lcd", cat: "DISPLAYS", type: "WALL", name: "LCD Display", in: ["video"], details: {} },
  { id: "disp-boxer", cat: "DISPLAYS", type: "WALL", name: "Christie Boxer 2K20", in: ["video", "network"], details: { lumens: "20,000 ANSI" } },
  { id: "disp-vpl131", cat: "DISPLAYS", type: "WALL", name: "Sony VPL-FHZ131L", in: ["video", "network"], details: {} },
  { id: "disp-vpl75", cat: "DISPLAYS", type: "WALL", name: "Sony VPL-FHZ75", in: ["video", "network"], details: {} },
  { id: "disp-be65t", cat: "DISPLAYS", type: "WALL", name: "Samsung BE65T-H", in: ["video", "network"], details: { size: "65in" } },
  { id: "disp-lg43", cat: "DISPLAYS", type: "WALL", name: "LG 43LV340C", in: ["video"], details: { size: "43in" } },
  { id: "disp-tcl55", cat: "DISPLAYS", type: "WALL", name: "TCL 55in Roku TV", in: ["video", "network"], details: { size: "55in" } },

  // ── Converters and distribution ───────────────────────────────────────
  { id: "conv-qra8808", cat: "CONVERTERS", type: "CONV", name: "Ross QRA-8808", in: ["video"], out: ["video"], details: { slot: "openGear", role: "HD distribution amplifier" } },
  { id: "conv-uda8705", cat: "CONVERTERS", type: "CONV", name: "Ross UDA-8705A", in: ["video"], out: ["video"], details: { slot: "openGear", role: "Analog distribution amplifier" } },
  { id: "conv-mux8258", cat: "CONVERTERS", type: "CONV", name: "Ross MUX-8258-8C", in: ["video", "audio"], out: ["video"], details: { slot: "openGear" } },
  { id: "conv-oghi5", cat: "CONVERTERS", type: "CONV", name: "AJA OG-HI5-4K-PLUS", in: ["video"], out: ["video"], details: { slot: "openGear" } },
  { id: "conv-ogframe", cat: "CONVERTERS", type: "CONV", name: "Ross openGear OG3-FR-CN", in: ["network"], details: { role: "Card frame", control: "MFC-OG3-N" } },
  { id: "conv-foxbox-tx", cat: "CONVERTERS", type: "CONV", name: "Extron FOXBOX Tx DVI Plus", in: ["video"], out: ["video"], details: { signal: "DVI over fiber" } },
  { id: "conv-foxbox-rx", cat: "CONVERTERS", type: "CONV", name: "Extron FOXBOX Rx DVI Plus", in: ["video"], out: ["video"], details: { signal: "DVI over fiber" } },
  { id: "conv-cobalt-bbg", cat: "CONVERTERS", type: "CONV", name: "Cobalt BBG-S-TO-A", in: ["video"], out: ["video"], details: { signal: "SDI" } },
  { id: "conv-advc-g1", cat: "CONVERTERS", type: "CONV", name: "Grass Valley ADVC G1", in: ["video"], out: ["video"], details: {} },
  { id: "conv-ultrastudio", cat: "CONVERTERS", type: "CAPTURE", name: "BMD UltraStudio 4K", in: ["video"], out: ["video"], details: {} },
  { id: "conv-decklink", cat: "CONVERTERS", type: "CAPTURE", name: "BMD DeckLink", out: ["video"], details: { role: "Playback card in the ProPresenter Mac" } },

  // ── Record and playback ───────────────────────────────────────────────
  { id: "bmd-hyperdeck-hd-plus", cat: "RECORD & PLAYBACK", type: "REC", name: "BMD HyperDeck Studio HD Plus", in: ["video"], out: ["video"], details: {} },

  // ── Monitoring and reference ──────────────────────────────────────────
  { id: "mon-dmon6s", cat: "MONITORING", type: "MON", name: "Decimator DMON-6S", in: ["video"], out: ["video"], details: { role: "Multiviewer" } },
  { id: "mon-be56", cat: "MONITORING", type: "MON", name: "Ensemble Brighteye 56", out: ["video"], details: { role: "Signal generator" } },
  { id: "mon-spg8260", cat: "MONITORING", type: "MON", name: "Ross SPG-8260", out: ["video"], details: { role: "Sync and test generator" } },

  // ── Control ───────────────────────────────────────────────────────────
  { id: "ctl-ipcp255", cat: "CONTROL PANELS", type: "CTRL", name: "Extron IPCP Pro 255", in: ["network"], out: ["network"], details: {} },
  { id: "ctl-tlp725m", cat: "CONTROL PANELS", type: "CTRL", name: "Extron TLP Pro 725M", in: ["network"], details: {} },
  { id: "ctl-tlp725t", cat: "CONTROL PANELS", type: "CTRL", name: "Extron TLP Pro 725T", in: ["network"], details: {} },
  { id: "ctl-tlp1022t", cat: "CONTROL PANELS", type: "CTRL", name: "Extron TLP Pro 1022T", in: ["network"], details: {} },
  { id: "ctl-nbp106", cat: "CONTROL PANELS", type: "CTRL", name: "Extron NBP 106", in: ["network"], details: { buttons: "6" } },
  { id: "ctl-nbp110", cat: "CONTROL PANELS", type: "CTRL", name: "Extron NBP 110D", in: ["network"], details: { buttons: "10" } },
  { id: "ctl-nbp200", cat: "CONTROL PANELS", type: "CTRL", name: "Extron NBP 200", in: ["network"], details: {} },
  { id: "ctl-tsc", cat: "CONTROL PANELS", type: "CTRL", name: "QSC TSC-series touchscreen", in: ["network"], details: {} },
  { id: "ctl-rp60", cat: "CONTROL PANELS", type: "CTRL", name: "Panasonic AW-RP60", out: ["network"], details: { role: "Camera controller" } },
  { id: "ctl-cbpanel", cat: "CONTROL PANELS", type: "CTRL", name: "Ross Carbonite panel", out: ["network"], details: { mes: "2 M/E" } },
  { id: "ctl-rcpme", cat: "CONTROL PANELS", type: "CTRL", name: "Ross RCP-ME router panel", out: ["network"], details: {} },
  { id: "ctl-cueserver", cat: "CONTROL PANELS", type: "CTRL", name: "Interactive CueServer 2", in: ["network"], out: ["network"], details: {} },
  { id: "ctl-cs3900", cat: "CONTROL PANELS", type: "CTRL", name: "Interactive CS-3900", in: ["network"], details: {} },
  { id: "ctl-itach", cat: "CONTROL PANELS", type: "CTRL", name: "Global Caché iTach IP2CC", in: ["network"], details: {} },
  { id: "ctl-nlight", cat: "CONTROL PANELS", type: "CTRL", name: "Acuity nLight controller", in: ["network"], details: {} },
  { id: "ctl-ionxe", cat: "CONTROL PANELS", type: "CTRL", name: "ETC Ion XE", in: ["network"], out: ["network"], details: { role: "Lighting console" } },
  { id: "ctl-puck", cat: "CONTROL PANELS", type: "CTRL", name: "ETC PUCK", in: ["network"], details: {} },

  // ── Audio ─────────────────────────────────────────────────────────────
  { id: "aud-cl5", cat: "AUDIO", type: "AUDIO", name: "Yamaha CL5", in: ["audio", "network"], out: ["audio", "network"], details: {} },
  { id: "aud-ql5", cat: "AUDIO", type: "AUDIO", name: "Yamaha QL5", in: ["audio", "network"], out: ["audio", "network"], details: {} },
  { id: "aud-ql1", cat: "AUDIO", type: "AUDIO", name: "Yamaha QL1", in: ["audio", "network"], out: ["audio", "network"], details: {} },
  { id: "aud-rio3224", cat: "AUDIO", type: "AUDIO", name: "Yamaha Rio3224-D", in: ["audio", "network"], out: ["audio", "network"], details: { io: "32×24" } },
  { id: "aud-rio1608", cat: "AUDIO", type: "AUDIO", name: "Yamaha Rio1608-D", in: ["audio", "network"], out: ["audio", "network"], details: { io: "16×8" } },
  { id: "aud-ri8", cat: "AUDIO", type: "AUDIO", name: "Yamaha Ri8-D", in: ["audio"], out: ["network"], details: { io: "8 in" } },
  { id: "aud-ro8", cat: "AUDIO", type: "AUDIO", name: "Yamaha Ro8-D", in: ["network"], out: ["audio"], details: { io: "8 out" } },
  { id: "aud-core510i", cat: "AUDIO", type: "AUDIO", name: "QSC Q-SYS Core 510i", in: ["audio", "network"], out: ["audio", "network"], details: { io: "128 network channels" } },
  { id: "aud-core110f", cat: "AUDIO", type: "AUDIO", name: "QSC Q-SYS Core 110f", in: ["audio", "network"], out: ["audio", "network"], details: {} },
  { id: "aud-core500i", cat: "AUDIO", type: "AUDIO", name: "QSC Q-SYS Core 500i", in: ["audio", "network"], out: ["audio", "network"], details: {} },
  { id: "aud-nv32h", cat: "AUDIO", type: "AUDIO", name: "QSC NV-32-H", in: ["video", "network"], out: ["video", "network"], details: {} },
  { id: "aud-cdn64", cat: "AUDIO", type: "AUDIO", name: "QSC CDN64 Dante card", in: ["network"], out: ["network"], details: { io: "64×64" } },
  { id: "aud-ulxd", cat: "AUDIO", type: "AUDIO", name: "Shure ULXD4Q", in: ["network"], out: ["audio", "network"], details: { channels: "4" } },
  { id: "aud-ad4q", cat: "AUDIO", type: "AUDIO", name: "Shure Axient AD4Q", in: ["network"], out: ["audio", "network"], details: { channels: "4" } },
  { id: "aud-ad611", cat: "AUDIO", type: "AUDIO", name: "Shure AD611", out: ["audio", "network"], details: {} },
  { id: "aud-psm", cat: "AUDIO", type: "AUDIO", name: "Shure PSM in-ear system", in: ["audio", "network"], details: {} },
  { id: "aud-livemix", cat: "AUDIO", type: "AUDIO", name: "Livemix LM-DIGITAL-SK1", in: ["audio", "network"], details: { channels: "24" } },
  { id: "aud-listen", cat: "AUDIO", type: "AUDIO", name: "Listen LW-160-02-D", in: ["network"], details: { role: "Assistive listening" } },
  { id: "aud-waves", cat: "AUDIO", type: "AUDIO", name: "Waves SoundGrid Server One", in: ["network"], out: ["network"], details: {} },
  { id: "aud-clearcom", cat: "AUDIO", type: "AUDIO", name: "Clear-Com intercom", in: ["audio", "network"], out: ["audio"], details: {} },

  // ── Amplifiers ────────────────────────────────────────────────────────
  { id: "amp-la4x", cat: "AMPLIFIERS", type: "AMP", name: "L-Acoustics LA4X", in: ["audio", "network"], details: { channels: "4 × 1000 W" } },
  { id: "amp-la716i", cat: "AMPLIFIERS", type: "AMP", name: "L-Acoustics LA7.16i", in: ["audio", "network"], details: {} },
  { id: "amp-cxq", cat: "AMPLIFIERS", type: "AMP", name: "QSC CX-Q network amplifier", in: ["audio", "network"], details: {} },
  { id: "amp-cxd45q", cat: "AMPLIFIERS", type: "AMP", name: "QSC CXD4.5Q", in: ["audio", "network"], details: {} },
  { id: "amp-netpau", cat: "AMPLIFIERS", type: "AMP", name: "Extron NetPA U 1004-70V", in: ["audio", "network"], details: {} },
  { id: "amp-e104", cat: "AMPLIFIERS", type: "AMP", name: "Lab.gruppen E 10:4", in: ["audio"], details: { channels: "4 × 250 W" } },

  // ── Streaming ─────────────────────────────────────────────────────────
  { id: "str-sme211", cat: "STREAMING", type: "STREAM", name: "Extron SME 211", in: ["video"], out: ["network"], details: {} },
  { id: "str-zeevee", cat: "STREAMING", type: "STREAM", name: "ZeeVee encoder", in: ["video"], out: ["network"], details: {} },

  // ── Network and infrastructure ────────────────────────────────────────
  { id: "net-sonicwall", cat: "NETWORK", type: "NETWORK", name: "SonicWall NSa 2700", in: ["network"], out: ["network"], details: {} },
  { id: "net-sg300", cat: "NETWORK", type: "NETWORK", name: "Cisco SG300", in: ["network"], out: ["network"], details: {} },
  { id: "net-araknis", cat: "NETWORK", type: "NETWORK", name: "Araknis switch", in: ["network"], out: ["network"], details: {} },
  { id: "net-pakedge", cat: "NETWORK", type: "NETWORK", name: "Pakedge SE-8-EP", in: ["network"], out: ["network"], details: { ports: "8" } },
  { id: "net-masterclock", cat: "NETWORK", type: "NETWORK", name: "Masterclock time system", in: ["network"], out: ["network"], details: {} },

  // ── Power ─────────────────────────────────────────────────────────────
  { id: "pwr-ups2200", cat: "POWER", type: "POWER", name: "Middle Atlantic UPS-2200R", out: ["power"], details: { capacity: "2200 VA / 1650 W" } },
  { id: "pwr-smt1500", cat: "POWER", type: "POWER", name: "APC Smart-UPS SMT1500", out: ["power"], details: { capacity: "1500 VA" } },
];

// Live merged palette (built-in + user additions). Reassigned by
// setCustomSystemDefs; ES module live bindings propagate the new array to every
// importer, so the palette and drop handler always see current devices.
export let SYSTEM_DEVICES: SystemDeviceDef[] = SYSTEM_BUILTIN;

export function setCustomSystemDefs(defs: SystemDeviceDef[]) {
  SYSTEM_DEVICES = [...SYSTEM_BUILTIN, ...defs];
}
