import { create } from "zustand";
import {
  deleteMaintenanceEntryRemote,
  fetchMaintenanceEntries,
  insertMaintenanceEntry,
  updateMaintenanceEntryRemote,
} from "@/lib/maintenance-remote";
import { createDebouncedFlush } from "@/lib/debounced-write";
import { loadEntries, saveEntries } from "@/lib/maintenance-storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { MaintenanceEntry, MaintenanceKind } from "@/types";

export type KindFilter = MaintenanceKind | "all";

interface MaintenanceState {
  entries: MaintenanceEntry[];
  // Ephemeral view state. Held here rather than in a module store because this
  // layer is global — it has no project bucket to travel in, and persisting a
  // selection across reloads isn't worth a second storage key.
  selectedVenueId: string;
  selectedEntryId: string;
  selectedDeviceId: string;
  kindFilter: KindFilter;
  openOnly: boolean;
  search: string;
  setSelectedVenueId: (id: string) => void;
  setSelectedEntryId: (id: string) => void;
  setSelectedDeviceId: (id: string) => void;
  setKindFilter: (k: KindFilter) => void;
  setOpenOnly: (v: boolean) => void;
  setSearch: (v: string) => void;
  addEntry: (entry: MaintenanceEntry) => void;
  updateEntry: (id: string, patch: Partial<Omit<MaintenanceEntry, "id">>) => void;
  removeEntry: (id: string) => void;
  hydrateFromServer: () => Promise<void>;
}

// Summary, technician and the markdown detail body are text inputs, so
// updateEntry fires per keystroke; only the persist is deferred.
const pendingWrites = createDebouncedFlush((ids) => {
  const entries = useMaintenance.getState().entries;
  if (isSupabaseConfigured) {
    for (const id of ids) {
      const e = entries.find((x) => x.id === id);
      if (e) void updateMaintenanceEntryRemote(e).catch(() => {});
    }
  } else {
    saveEntries(entries);
  }
});

export const useMaintenance = create<MaintenanceState>()((set, get) => ({
  entries: isSupabaseConfigured ? [] : loadEntries(),
  selectedVenueId: "",
  selectedEntryId: "",
  selectedDeviceId: "",
  kindFilter: "all",
  openOnly: false,
  search: "",

  setSelectedVenueId: (selectedVenueId) =>
    set({ selectedVenueId, selectedEntryId: "", selectedDeviceId: "" }),
  setSelectedEntryId: (selectedEntryId) => set({ selectedEntryId }),
  setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),
  setKindFilter: (kindFilter) => set({ kindFilter }),
  setOpenOnly: (openOnly) => set({ openOnly }),
  setSearch: (search) => set({ search }),

  addEntry: (entry) => {
    const entries = [...get().entries, entry];
    if (isSupabaseConfigured) void insertMaintenanceEntry(entry).catch(() => {});
    else saveEntries(entries);
    set({ entries, selectedEntryId: entry.id });
  },

  updateEntry: (id, patch) => {
    const entries = get().entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
    set({ entries });
    pendingWrites.schedule(id);
  },

  removeEntry: (id) => {
    pendingWrites.cancel(id);
    const entries = get().entries.filter((e) => e.id !== id);
    if (isSupabaseConfigured) void deleteMaintenanceEntryRemote(id).catch(() => {});
    else saveEntries(entries);
    set((s) => ({ entries, selectedEntryId: s.selectedEntryId === id ? "" : s.selectedEntryId }));
  },

  hydrateFromServer: async () => {
    set({ entries: await fetchMaintenanceEntries() });
  },
}));

export function newEntryId(): string {
  return `mnt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}
