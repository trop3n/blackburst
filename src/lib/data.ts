import type { FaultPanel, Panel, Project, WallLayout } from "@/types";

export const PROJECTS: Project[] = [
  { id: "PRJ-2451", name: "Atrium Lobby Wall", client: "Northwind HQ", status: "in-design" },
  { id: "PRJ-2447", name: "Auditorium Refresh", client: "Helios Tech", status: "fabrication" },
  { id: "PRJ-2440", name: "Broadcast Studio B", client: "KCR Media", status: "delivered" },
];

export const PANEL_LIBRARY: Panel[] = [
  { id: "ROE-CB5", model: "ROE Carbon CB5", pitch: 5.77, w: 500, h: 500, weight: 8.4, watts: 145 },
  { id: "ROE-RB2.6", model: "ROE Ruby RB2.6", pitch: 2.6, w: 500, h: 500, weight: 8.0, watts: 200 },
  { id: "INF-XR3", model: "INFiLED XR3", pitch: 3.91, w: 500, h: 500, weight: 7.8, watts: 160 },
  { id: "ABS-AT5", model: "Absen AT5 Pro", pitch: 5.2, w: 640, h: 480, weight: 9.1, watts: 175 },
  { id: "UNI-UPAD", model: "Unilumin UpadIV H6", pitch: 6.0, w: 500, h: 500, weight: 7.0, watts: 130 },
];

export const WALL_LAYOUTS: WallLayout[] = [
  { id: "W1", name: "Main Lobby Wall", panel: "ROE-RB2.6", cols: 18, rows: 8, curve: 0, active: true },
  { id: "W2", name: "Reception Stripe", panel: "INF-XR3", cols: 24, rows: 3, curve: 0, active: false },
  { id: "W3", name: "Curved Backdrop (Stage)", panel: "ROE-CB5", cols: 14, rows: 6, curve: 8, active: false },
];

export const FAULT_PANELS: FaultPanel[] = [
  { c: 7, r: 3 },
  { c: 12, r: 5 },
];
