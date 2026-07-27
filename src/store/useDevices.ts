import { create } from "zustand";
import type { ProjectDevice } from "@/types";

interface DevicesState {
  devices: ProjectDevice[];
  addDevice: (device: ProjectDevice) => void;
  updateDevice: (id: string, patch: Partial<Omit<ProjectDevice, "id">>) => void;
  removeDevice: (id: string) => void;
}

// Per-project registry of real equipment. Modules reference entries by id; the
// registry never reaches back into them, so nothing here needs to know which
// module a device happens to appear in.
export const useDevices = create<DevicesState>()((set) => ({
  devices: [],
  addDevice: (device) => set((s) => ({ devices: [...s.devices, device] })),
  updateDevice: (id, patch) =>
    set((s) => ({ devices: s.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  removeDevice: (id) => set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),
}));

export function newDeviceId(): string {
  return `dev-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}
