import type { LedProcessor } from "@/types";

// The LED controllers St Andrew owns. The VX2000 Pro drives the BAS — the flown
// Sanctuary wall — and its figures are the vendor's: "Equipped with 20 Ethernet
// ports ... capable of managing up to 13 million pixels" (NovaStar VX2000 Pro
// All-in-One Controller Specifications, V1.2.0, 2025-09-30). That headline is
// also exactly 20 × 650,000, the per-gigabit-port budget this file used to size
// controllers that publish an output count rather than a total.
//
// The Absen LED Video Pro-HD on the side screens publishes no headline capacity,
// so its figure comes from the same port rule: a rack photo (2026-09-24) shows
// four gigabit LED outputs and four OPT outputs, and 4 × 650,000 is 2.6 million.
// That is a derivation, not a vendor number — replace it if a datasheet turns up.
export const LED_PROCESSORS: LedProcessor[] = [
  { id: "vx2000pro", name: "NovaStar VX2000 Pro", pixelCapacity: 13_000_000, ports: "20×RJ45" },
  { id: "absen-prohd", name: "Absen LED Video Pro-HD", pixelCapacity: 2_600_000, ports: "4×RJ45 + 4×OPT" },
];

export const DEFAULT_PROCESSOR_ID = "vx2000pro";

export function processorById(id: string): LedProcessor {
  return LED_PROCESSORS.find((p) => p.id === id) ?? LED_PROCESSORS[0];
}
