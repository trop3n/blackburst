import type { Device } from "@/types";

// The device registry is GLOBAL — a physical box outlives the project that
// specified it, and its service history has to survive a project switch — so it
// lives under its own key and is deliberately NOT part of a project's bucket in
// project-storage.ts. Same split as the hardware catalog (catalog-storage.ts).
const KEY = "blackburst:devices:v1";

export function loadDevices(): Device[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Device[]) : [];
  } catch {
    return [];
  }
}

export function saveDevices(devices: Device[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(devices));
  } catch {
    // Storage full / unavailable — edits stay in memory for the session.
  }
}
