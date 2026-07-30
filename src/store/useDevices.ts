import { create } from "zustand";
import {
  deleteDeviceRemote,
  fetchDevices,
  insertDevice,
  updateDeviceRemote,
} from "@/lib/device-remote";
import { loadDevices, saveDevices } from "@/lib/device-storage";
import { hoistLegacyDevices } from "@/lib/migrate-devices";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Device } from "@/types";

interface DevicesState {
  devices: Device[];
  addDevice: (device: Device) => void;
  updateDevice: (id: string, patch: Partial<Omit<Device, "id">>) => void;
  removeDevice: (id: string) => void;
  hydrateFromServer: () => Promise<void>;
}

// Accounts mode loads the registry from the server after sign-in (useApp
// .bootstrap → hydrateFromServer), so it starts empty. Local mode reads it here,
// first folding in any devices left behind in project buckets by the pre-global
// version.
function initialDevices(): Device[] {
  if (isSupabaseConfigured) return [];
  hoistLegacyDevices();
  return loadDevices();
}

// Global registry of real equipment, project-independent: a physical box
// outlives the project that specified it, so this must never become a SPECS key.
// Modules reference entries by id; the registry never reaches back into them, so
// nothing here needs to know which module a device happens to appear in.
export const useDevices = create<DevicesState>()((set, get) => ({
  devices: initialDevices(),

  addDevice: (device) => {
    const devices = [...get().devices, device];
    if (isSupabaseConfigured) void insertDevice(device).catch(() => {});
    else saveDevices(devices);
    set({ devices });
  },

  updateDevice: (id, patch) => {
    const devices = get().devices.map((d) => (d.id === id ? { ...d, ...patch } : d));
    if (isSupabaseConfigured) {
      const updated = devices.find((d) => d.id === id);
      if (updated) void updateDeviceRemote(updated).catch(() => {});
    } else saveDevices(devices);
    set({ devices });
  },

  removeDevice: (id) => {
    const devices = get().devices.filter((d) => d.id !== id);
    if (isSupabaseConfigured) void deleteDeviceRemote(id).catch(() => {});
    else saveDevices(devices);
    set({ devices });
  },

  hydrateFromServer: async () => {
    set({ devices: await fetchDevices() });
  },
}));

export function newDeviceId(): string {
  return `dev-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}
