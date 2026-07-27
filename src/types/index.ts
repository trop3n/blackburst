export type ModuleId = "wall" | "system" | "rack" | "inv" | "docs";

export type Density = "compact" | "normal" | "cozy";
export type Shell = "rail" | "tabs" | "palette";
export type AccentName = "acid-green" | "amber" | "cyan" | "magenta" | "white";
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
  curve: number;
  active: boolean;
}

export interface FaultPanel {
  c: number;
  r: number;
}

export type Lane = "video" | "audio" | "network" | "power";
export type PatchLane = "video" | "audio" | "net" | "pwr";

export interface SystemNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  in?: Lane[];
  out?: Lane[];
  details: Record<string, string>;
  deviceId?: string;
}

export interface SystemEdge {
  from: string;
  to: string;
  lane: Lane;
  label: string;
}

export interface SystemDeviceDef {
  id: string;
  cat: string;
  type: string;
  name: string;
  in?: Lane[];
  out?: Lane[];
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

// One piece of real-world equipment, shared across modules. A rack slot, a
// graph node and an inventory asset can all point at the same device, which is
// how "the ATEM in rack 2" stays one thing rather than three unrelated records.
export interface ProjectDevice {
  id: string;
  // Model name rather than a catalog id: rack items carry a def id but graph
  // nodes and inventory assets don't, and the model reads better anyway.
  model: string;
  label: string;
  serial: string;
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
