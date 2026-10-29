export type ModuleId = "wall" | "system" | "rack" | "inv" | "docs" | "maint";

export type Density = "compact" | "normal" | "cozy";
export type Shell = "rail" | "tabs" | "palette";
export type CanvasStyle = "grid" | "blueprint" | "schematic";

export type MemberRole = "owner" | "editor" | "viewer";

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  status: string;
  ownerId?: string;
  role?: MemberRole;
}

export interface Panel {
  id: string;
  model: string;
  pitch: number;
  w: number;
  h: number;
  // Real pixel count of one cabinet. Wall resolution multiplies this by the
  // panel count — dividing the whole wall by pitch compounds a rounding error.
  pxW: number;
  pxH: number;
  weight: number;
  watts: number;
}

export interface LedProcessor {
  id: string;
  name: string;
  pixelCapacity: number;
  ports: string;
}

export interface WallLayout {
  id: string;
  name: string;
  panel: string;
  processor: string;
  cols: number;
  rows: number;
  active: boolean;
}

export type Lane = "video" | "audio" | "network" | "power";
export type PatchLane = "video" | "audio" | "net" | "pwr";

// `bidi` is one socket that carries both ways — an etherCON or RJ45, which a
// patch sheet must count once but which feeds and is fed. Two ports would
// double every network row.
export type PortDirection = "in" | "out" | "bidi";

// What travels on the port, not what it plugs into: `line` and `aes3` both sit
// on XLR3, and the pair is what decides whether a link is sane. `Lane` is
// derived from this by `portLane` rather than stored twice.
export type SignalId =
  | "sdi"
  | "hdmi"
  | "dvi"
  | "video_analog"
  | "mic"
  | "line"
  | "speaker"
  | "aes3"
  | "ethernet"
  | "dante"
  | "mains";

export type ConnectorId =
  | "bnc"
  | "hdmi"
  | "dvi_d"
  | "hd15"
  | "xlr3"
  | "nl4"
  | "euroblock"
  | "rj45"
  | "ethercon"
  | "lc_duplex"
  | "iec_c14"
  | "edison";

// One physical socket. Built by the factories in `lib/ports.ts` — writing these
// out by hand is what makes a 32-input stage box unmaintainable.
export interface Port {
  // Unique within its device; derived from the label so it reads in a patch row.
  id: string;
  label: string;
  dir: PortDirection;
  signal: SignalId;
  connector: ConnectorId;
  // Channels carried by one socket, where the figure is known: a Dante pair
  // carries the card's whole count, an analogue socket carries one. Unset means
  // nobody has sourced it — capacity checks must skip the port, not assume 1.
  channels?: number;
}

export interface SystemNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  in?: Lane[];
  out?: Lane[];
  // Copied from the catalogue def at drop time, like `in` / `out` / `details`,
  // so an instance keeps the sockets it was placed with even if the def later
  // changes. Unset for the defs that carry no sourced port list yet.
  ports?: Port[];
  details: Record<string, string>;
  deviceId?: string;
}

export interface SystemEdge {
  // Edges carry their own identity because a device pair can be joined by many
  // cables — 24 line outs into 8 mic ins is one pair and many runs. Deriving a
  // key from from/to/lane capped that at one.
  id: string;
  from: string;
  to: string;
  lane: Lane;
  label: string;
  // Patch-sheet overrides. Unset means "use the derived value" — the graph knows
  // signal lanes, not connector types or real port numbers, so a designer can
  // correct any of these per connection without the default disappearing.
  srcPort?: string;
  destPort?: string;
  cable?: string;
  // Which socket the cable actually lands on, once both ends have a port list.
  // This is structural — it is what makes a port countable as occupied — while
  // srcPort / destPort above stay free text and still win as the display label.
  srcPortId?: string;
  destPortId?: string;
}

export interface SystemDeviceDef {
  id: string;
  cat: string;
  type: string;
  name: string;
  in?: Lane[];
  out?: Lane[];
  // Real sockets, where the model's figures are on file. Unset means nobody has
  // sourced them yet, so `in`/`out` remain the only thing the graph knows about
  // this model — the two coexist until every def carries ports.
  ports?: Port[];
  // Where this entry's figures came from, in words a person can re-check: a
  // spec page, an export in av-network-inventory, or the model designation
  // itself. Unset means nobody wrote it down, which is not the same as none.
  source?: string;
  // True only when the figures were checked against the manufacturer's
  // published spec. A count inferred from the model name is a good guess, not a
  // verification, so it stays false.
  verified?: boolean;
  details: Record<string, string>;
}

export type RackColor = "accent" | "magenta" | "info" | "warn" | "muted";
export type RackSize = 24 | 42 | 48;

export interface RackItemDef {
  id: string;
  model: string;
  cat: string;
  u: number;
  w: number;
  watts: number;
  depth: number;
  color: RackColor;
}

// One piece of real-world equipment, shared across modules and across projects.
// A rack slot, a graph node and an inventory asset can all point at the same
// device, which is how "the ATEM in rack 2" stays one thing rather than three
// unrelated records. The registry is global (`useDevices`) — a physical box
// outlives the project that specified it, so it is not part of a project bucket.
export interface Device {
  id: string;
  // Model name rather than a catalog id: rack items carry a def id but graph
  // nodes and inventory assets don't, and the model reads better anyway.
  model: string;
  label: string;
  serial: string;
  // Home venue for installed gear. Unset means fleet / touring stock that isn't
  // tied to one room.
  venueId?: string;
  // Canonical `AA:BB:CC:DD:EE:FF`. The join key to the Network app's export,
  // because an address moves and a MAC does not — the same reason
  // reservation_worklist.py pins DHCP leases by MAC over there. Optional
  // because plenty of real gear has no network interface at all: patchbays,
  // passive splitters, a projector lamp module.
  mac?: string;
}

// One row of the Network app's export (av-network-inventory). Read-only and
// never persisted: these are observations from the wire, and the only place
// they can be corrected is that app's own edit form.
export interface NetDevice {
  ip: string;
  mac: string;
  name: string;
  hostname: string;
  vendor: string;
  category: string;
  domain: string;
  status: string;
  statusLabel: string;
  venue: string;
  location: string;
  ports: string;
  triage: string;
}

// A physical place with a permanent install. Venues are global and outlive
// projects — several jobs can touch the same room over years, so the
// maintenance log is keyed to the place, not to whichever project specified it.
export interface Venue {
  id: string;
  name: string;
  address: string;
  notes: string;
}

// Which subsystem the work touched, on a separate axis from the room. This is
// av-network-inventory's `Domain` vocabulary verbatim (reconcile.domain_key /
// DOM_LABEL), because that estate already answers this question for every
// networked device and a second taxonomy would drift from it within a month.
//
// Deliberately NOT modelled as a venue. A venue is a physical room; "Sanctuary
// Audio" is a subsystem within one, and making it a venue splits a room's
// history across several records and breaks the join to the Network app, which
// knows one `sanctuary`. The inventory makes the same call -- reconcile.py's
// LOC_FIX maps "sanctuary audio" to the sub-location `Sanctuary — Audio`, not
// to a room of its own.
export type MaintenanceDomain =
  | "audio"
  | "video"
  | "control"
  | "display"
  | "light"
  | "infra"
  | "compute"
  | "other";

export type MaintenanceKind =
  | "repair"
  | "replace"
  | "firmware"
  | "config"
  | "inspect"
  | "calibrate";

// One logged intervention against one device at one venue — a changelog entry
// for an AV install. `resolved` separates finished work from an open fault.
export interface MaintenanceEntry {
  id: string;
  venueId: string;
  deviceId: string;
  at: string;
  who: string;
  kind: MaintenanceKind;
  // Unset means nobody said, which is honest for older entries and for work
  // that spans subsystems.
  domain?: MaintenanceDomain;
  summary: string;
  body: string;
  resolved: boolean;
}

export interface RackItem {
  iid: number;
  id: string;
  pos: number;
  deviceId?: string;
}

export interface Rack {
  id: string;
  name: string;
  location: string;
  size: RackSize;
  items: RackItem[];
}

export type AssetStatus = "in" | "out" | "maint";

export interface Asset {
  id: string;
  model: string;
  cat: string;
  status: AssetStatus;
  show: string;
  due: string;
  utilization: number;
  last: string;
  deviceId?: string;
}

export interface AssetCategory {
  name: string;
  count: number;
}

export interface InventoryModelDef {
  id: string;
  model: string;
  cat: string;
}

export interface ShowSchedule {
  id: string;
  name: string;
  start: number;
  end: number;
  pct: number;
  kind?: "maint" | "warn";
}

export type DocKind = "folder" | "doc";

export interface DocNode {
  id: string;
  name: string;
  kind: DocKind;
  children?: DocNode[];
}

export interface DocVersion {
  v: string;
  who: string;
  when: string;
  note: string;
  body?: string;
}

export interface DocComment {
  who: string;
  t: string;
  c: string;
  // Author's user id, so the edit/delete affordance can be gated on the real
  // author rather than on the display name. Absent on comments written before
  // this existed and in local mode, where there is no account to attribute to;
  // canDeleteShared treats that as unowned.
  byId?: string | null;
}

export interface PatchEntry {
  id: string;
  src: string;
  srcPort: string;
  dest: string;
  destPort: string;
  lane: PatchLane;
  cable: string;
}
