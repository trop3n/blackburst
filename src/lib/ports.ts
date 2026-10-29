import type { ConnectorId, Lane, Port, PortDirection, SignalId, SystemEdge, SystemNode } from "@/types";

const SIGNAL_LANE: Record<SignalId, Lane> = {
  sdi: "video",
  hdmi: "video",
  dvi: "video",
  video_analog: "video",
  mic: "audio",
  line: "audio",
  speaker: "audio",
  aes3: "audio",
  ethernet: "network",
  dante: "network",
  mains: "power",
};

export function portLane(signal: SignalId): Lane {
  return SIGNAL_LANE[signal];
}

// The bridge back to the old model: a def that carries ports can answer the
// `in` / `out` lane question the whole module already asks, so neither has to
// be maintained by hand once a def is converted.
export function deviceLanes(ports: Port[]): { in: Lane[]; out: Lane[] } {
  const inLanes = new Set<Lane>();
  const outLanes = new Set<Lane>();
  for (const p of ports) {
    const lane = portLane(p.signal);
    if (p.dir !== "out") inLanes.add(lane);
    if (p.dir !== "in") outLanes.add(lane);
  }
  return { in: [...inLanes], out: [...outLanes] };
}

export function portsById(ports: Port[]): Map<string, Port> {
  return new Map(ports.map((p) => [p.id, p]));
}

export function findPort(node: SystemNode | undefined, portId: string | undefined): Port | undefined {
  if (!node?.ports || !portId) return undefined;
  return node.ports.find((p) => p.id === portId);
}

// Sockets that could take a cable of this lane at this end. A `bidi` socket
// faces both ways, so it appears in either direction's list.
export function portsFacing(ports: Port[], dir: "in" | "out", lane: Lane): Port[] {
  return ports.filter((p) => (p.dir === dir || p.dir === "bidi") && portLane(p.signal) === lane);
}

// Sockets already taken on this node. A port is occupied only once a cable
// names it: edges that predate the port model, or land on a def with no port
// list, occupy nothing and must not make a socket look used. A `bidi` socket is
// never occupied — many streams ride one etherCON, so claiming it for the first
// cable would hide every later one.
export function occupiedPortIds(node: SystemNode, edges: SystemEdge[]): Set<string> {
  const shared = new Set((node.ports ?? []).filter((p) => p.dir === "bidi").map((p) => p.id));
  const used = new Set<string>();
  for (const e of edges) {
    if (e.from === node.id && e.srcPortId && !shared.has(e.srcPortId)) used.add(e.srcPortId);
    if (e.to === node.id && e.destPortId && !shared.has(e.destPortId)) used.add(e.destPortId);
  }
  return used;
}

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A single socket keeps the bare label ("OUT"); a bank numbers from 1 ("IN 1"),
// which is how the figures are written on the panel and in a patch row.
function bank(
  n: number,
  label: string,
  dir: PortDirection,
  signal: SignalId,
  connector: ConnectorId,
  channels?: number,
): Port[] {
  const base = slug(label);
  return Array.from({ length: n }, (_, i) => ({
    id: n === 1 ? base : `${base}-${i + 1}`,
    label: n === 1 ? label : `${label} ${i + 1}`,
    dir,
    signal,
    connector,
    ...(channels === undefined ? {} : { channels }),
  }));
}

export function sdiIn(n: number, label = "SDI IN"): Port[] {
  return bank(n, label, "in", "sdi", "bnc");
}

export function sdiOut(n: number, label = "SDI OUT"): Port[] {
  return bank(n, label, "out", "sdi", "bnc");
}

export function hdmiIn(n: number, label = "HDMI IN"): Port[] {
  return bank(n, label, "in", "hdmi", "hdmi");
}

export function hdmiOut(n: number, label = "HDMI OUT"): Port[] {
  return bank(n, label, "out", "hdmi", "hdmi");
}

export function dviIn(n: number, label = "DVI IN"): Port[] {
  return bank(n, label, "in", "dvi", "dvi_d");
}

export function dviOut(n: number, label = "DVI OUT"): Port[] {
  return bank(n, label, "out", "dvi", "dvi_d");
}

export function vgaIn(n: number, label = "VGA IN"): Port[] {
  return bank(n, label, "in", "video_analog", "hd15");
}

export function micIn(n: number, label = "IN"): Port[] {
  return bank(n, label, "in", "mic", "xlr3");
}

export function lineIn(n: number, label = "LINE IN"): Port[] {
  return bank(n, label, "in", "line", "xlr3");
}

export function lineOut(n: number, label = "OUT"): Port[] {
  return bank(n, label, "out", "line", "xlr3");
}

export function speakerOut(n: number, label = "SPEAKER OUT"): Port[] {
  return bank(n, label, "out", "speaker", "nl4");
}

export function aes3Out(n: number, label = "AES/EBU OUT"): Port[] {
  return bank(n, label, "out", "aes3", "xlr3");
}

// Primary / secondary by default.
export function dante(n = 2, channels?: number, label = "DANTE"): Port[] {
  return bank(n, label, "bidi", "dante", "ethercon", channels);
}

export function ethernet(n: number, label = "NETWORK"): Port[] {
  return bank(n, label, "bidi", "ethernet", "rj45");
}

export function fibre(n: number, label = "OPT"): Port[] {
  return bank(n, label, "bidi", "ethernet", "lc_duplex");
}

export function powerIn(n = 1, label = "POWER"): Port[] {
  return bank(n, label, "in", "mains", "iec_c14");
}
