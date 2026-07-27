import type { LedProcessor } from "@/types";

// Load capacities are the manufacturer's 8-bit figure. Where a vendor specs by
// output count rather than a headline number, capacity is ports × 650,000 —
// the standard gigabit-port budget the whole industry sizes against.
export const LED_PROCESSORS: LedProcessor[] = [
  { id: "sx40", name: "Brompton Tessera SX40", pixelCapacity: 9_000_000, ports: "4×10GbE" },
  { id: "s8", name: "Brompton Tessera S8", pixelCapacity: 4_600_000, ports: "8×1GbE" },
  { id: "t1", name: "Brompton Tessera T1", pixelCapacity: 1_300_000, ports: "2×1GbE" },
  { id: "mx40pro", name: "Novastar MX40 Pro", pixelCapacity: 13_000_000, ports: "20×RJ45" },
  { id: "vx1000pro", name: "Novastar VX1000 Pro", pixelCapacity: 6_500_000, ports: "10×RJ45" },
  { id: "vx600pro", name: "Novastar VX600 Pro", pixelCapacity: 3_900_000, ports: "6×RJ45" },
  { id: "vx400pro", name: "Novastar VX400 Pro", pixelCapacity: 2_600_000, ports: "4×RJ45" },
  { id: "z6", name: "Colorlight Z6", pixelCapacity: 13_000_000, ports: "20×RJ45" },
];

export const DEFAULT_PROCESSOR_ID = "sx40";

export function processorById(id: string): LedProcessor {
  return LED_PROCESSORS.find((p) => p.id === id) ?? LED_PROCESSORS[0];
}
