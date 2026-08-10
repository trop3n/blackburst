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
import { useAuth } from "@/store/useAuth";
import type { MaintenanceEntry, MaintenanceKind } from "@/types";

export type KindFilter = MaintenanceKind | "all";

interface MaintenanceState {
  entries: MaintenanceEntry[];
  // entry id → contributor (null = orphaned); gates the delete affordance to
  // what the RLS delete policy will permit. Empty in local mode.
  owners: Record<string, string | null>;
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
  if (!isSupabaseConfigured) {
    saveEntries(entries);
    return;
  }
  // Returned so the flusher can count the writes as in flight until they land.
  return Promise.all(
    ids.map((id) => {
      const e = entries.find((x) => x.id === id);
      return e ? updateMaintenanceEntryRemote(e).catch(() => {}) : null;
    }),
  );
});

export const hasPendingEntryWrites = pendingWrites.hasPending;

export const useMaintenance = create<MaintenanceState>()((set, get) => ({
  entries: isSupabaseConfigured ? [] : loadEntries(),
  owners: {},
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
    if (isSupabaseConfigured) {
      void insertMaintenanceEntry(entry).catch(() => {});
      set({
        entries,
        selectedEntryId: entry.id,
        owners: { ...get().owners, [entry.id]: useAuth.getState().user?.id ?? null },
      });
      return;
    }
    saveEntries(entries);
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
    if (isSupabaseConfigured)
      void deleteMaintenanceEntryRemote(id).catch(() => {
        // Denied delete: refetch to resurrect the row now, unless a debounced
        // edit is pending and the refetch would clobber it.
        if (!pendingWrites.hasPending()) void get().hydrateFromServer().catch(() => {});
      });
    else saveEntries(entries);
    const owners = { ...get().owners };
    delete owners[id];
    set((s) => ({
      entries,
      owners,
      selectedEntryId: s.selectedEntryId === id ? "" : s.selectedEntryId,
    }));
  },

  hydrateFromServer: async () => {
    const rows = await fetchMaintenanceEntries();
    set({
      entries: rows.map((r) => r.record),
      owners: Object.fromEntries(rows.map((r) => [r.record.id, r.createdBy])),
    });
  },
}));

export function newEntryId(): string {
  return `mnt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}
