export type ModuleId = "wall" | "system" | "rack" | "inv" | "docs";

export type Density = "compact" | "normal" | "cozy";
export type Shell = "rail" | "tabs" | "palette";
export type AccentName = "acid-green" | "amber" | "cyan" | "magenta" | "white";
export type CanvasStyle = "grid" | "blueprint" | "schematic";

export interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
}

export interface Panel {
  id: string;
  model: string;
  pitch: number;
  w: number;
  h: number;
  weight: number;
  watts: number;
}

export interface WallLayout {
  id: string;
  name: string;
  panel: string;
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
}

export interface SystemEdge {
  from: string;
  to: string;
  lane: Lane;
  label: string;
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
