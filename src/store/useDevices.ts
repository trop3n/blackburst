import { create } from "zustand";
import {
  deleteDeviceRemote,
  fetchDevices,
  insertDevice,
  updateDeviceRemote,
} from "@/lib/device-remote";
import { createDebouncedFlush } from "@/lib/debounced-write";
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

// Matches the other global stores: local state is immediate, the persist is
// coalesced. Device edits aren't per-keystroke today, but sharing one path keeps
// the three registries behaving identically.
const pendingWrites = createDebouncedFlush((ids) => {
  const devices = useDevices.getState().devices;
  if (!isSupabaseConfigured) {
    saveDevices(devices);
    return;
  }
  // Returned so the flusher can count the writes as in flight until they land.
  return Promise.all(
    ids.map((id) => {
      const d = devices.find((x) => x.id === id);
      return d ? updateDeviceRemote(d).catch(() => {}) : null;
    }),
  );
});

export const hasPendingDeviceWrites = pendingWrites.hasPending;

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
    set({ devices });
    pendingWrites.schedule(id);
  },

  removeDevice: (id) => {
    pendingWrites.cancel(id);
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
