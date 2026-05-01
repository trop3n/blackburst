import type { Asset, AssetCategory, ShowSchedule } from "@/types";

export const ASSETS: Asset[] = [
  { id: "BMD-S40-001", model: "Brompton SX40", cat: "Processor", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 82, last: "2026-04-12" },
  { id: "BMD-S40-002", model: "Brompton SX40", cat: "Processor", status: "in", show: "—", due: "—", utilization: 64, last: "2026-04-22" },
  { id: "BMD-S40-003", model: "Brompton SX40", cat: "Processor", status: "maint", show: "—", due: "Apr 30", utilization: 71, last: "2026-04-09" },
  { id: "ROE-RB2.6-A1", model: "ROE Ruby RB2.6 (24-pack)", cat: "LED Panel", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 88, last: "2026-04-12" },
  { id: "ROE-RB2.6-A2", model: "ROE Ruby RB2.6 (24-pack)", cat: "LED Panel", status: "in", show: "—", due: "—", utilization: 41, last: "2026-04-19" },
  { id: "ROE-CB5-A1", model: "ROE Carbon CB5 (24-pack)", cat: "LED Panel", status: "in", show: "—", due: "—", utilization: 33, last: "2026-04-15" },
  { id: "VMX-M4-001", model: "vMix M4 Switcher", cat: "Switcher", status: "out", show: "KCR Studio B", due: "May 02", utilization: 94, last: "2026-04-20" },
  { id: "DGC-SD12-001", model: "DiGiCo SD12", cat: "Console", status: "in", show: "—", due: "—", utilization: 58, last: "2026-04-18" },
  { id: "LA-12X-001", model: "L-Acoustics LA12X", cat: "Amplifier", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 76, last: "2026-04-12" },
  { id: "LA-12X-002", model: "L-Acoustics LA12X", cat: "Amplifier", status: "maint", show: "—", due: "May 04", utilization: 81, last: "2026-04-08" },
  { id: "PTZ-AW-UE150-1", model: "AW-UE150 PTZ Cam", cat: "Camera", status: "in", show: "—", due: "—", utilization: 52, last: "2026-04-21" },
  { id: "PTZ-AW-UE150-2", model: "AW-UE150 PTZ Cam", cat: "Camera", status: "out", show: "KCR Studio B", due: "May 02", utilization: 67, last: "2026-04-20" },
  { id: "DST-200A-01", model: "Distro 200A 3ϕ", cat: "Power", status: "out", show: "Helios Auditorium", due: "Apr 28", utilization: 70, last: "2026-04-12" },
];

export const ASSET_CATEGORIES: AssetCategory[] = [
  { name: "All gear", count: 348 },
  { name: "LED Panel", count: 144 },
  { name: "Processor", count: 12 },
  { name: "Switcher", count: 8 },
  { name: "Console", count: 6 },
  { name: "Camera", count: 22 },
  { name: "Amplifier", count: 18 },
  { name: "Power", count: 26 },
  { name: "Cabling", count: 112 },
];

export const SHOWS: ShowSchedule[] = [
  { id: "SH-A", name: "Helios Auditorium", start: 1, end: 6, pct: 88 },
  { id: "SH-B", name: "KCR Studio B Refresh", start: 5, end: 9, pct: 64 },
  { id: "SH-C", name: "Northwind Atrium", start: 8, end: 13, pct: 41 },
  { id: "SH-D", name: "Maintenance · LA12X", start: 3, end: 5, pct: 100, kind: "maint" },
  { id: "SH-E", name: "Calibration · SX40", start: 10, end: 12, pct: 100, kind: "warn" },
];

export const ASSET_HISTORY: { d: string; e: string; t: string }[] = [
  { d: "Apr 22", e: "Returned · QC pass", t: "S. Larsson" },
  { d: "Apr 12", e: "Deployed → Helios", t: "M. Reyes" },
  { d: "Apr 09", e: "PM service · firmware 3.4.12", t: "K. Tanaka" },
  { d: "Mar 28", e: "Returned · ok", t: "S. Larsson" },
];
