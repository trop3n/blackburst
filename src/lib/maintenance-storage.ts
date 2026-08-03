import type { MaintenanceEntry, Venue } from "@/types";

// Venues and their service history are GLOBAL, for the same reason the device
// registry is: a venue outlives every project that touches it, so neither may
// live in a project bucket (project-storage.ts). Two keys, one domain.
const VENUES_KEY = "blackburst:venues:v1";
const ENTRIES_KEY = "blackburst:maintenance:v1";

function loadArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function saveArray<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / unavailable — edits stay in memory for the session.
  }
}

export function loadVenues(): Venue[] {
  return loadArray<Venue>(VENUES_KEY);
}

export function saveVenues(venues: Venue[]) {
  saveArray(VENUES_KEY, venues);
}

export function loadEntries(): MaintenanceEntry[] {
  return loadArray<MaintenanceEntry>(ENTRIES_KEY);
}

export function saveEntries(entries: MaintenanceEntry[]) {
  saveArray(ENTRIES_KEY, entries);
}
