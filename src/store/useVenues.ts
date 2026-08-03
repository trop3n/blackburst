import { create } from "zustand";
import {
  deleteVenueRemote,
  fetchVenues,
  insertVenue,
  updateVenueRemote,
} from "@/lib/maintenance-remote";
import { createDebouncedFlush } from "@/lib/debounced-write";
import { loadVenues, saveVenues } from "@/lib/maintenance-storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Venue } from "@/types";

interface VenuesState {
  venues: Venue[];
  addVenue: (venue: Venue) => void;
  updateVenue: (id: string, patch: Partial<Omit<Venue, "id">>) => void;
  removeVenue: (id: string) => void;
  hydrateFromServer: () => Promise<void>;
}

// Venue name/address/notes are bound to text inputs, so updateVenue fires per
// keystroke; only the persist is deferred, never the local state.
const pendingWrites = createDebouncedFlush((ids) => {
  const venues = useVenues.getState().venues;
  if (isSupabaseConfigured) {
    for (const id of ids) {
      const v = venues.find((x) => x.id === id);
      if (v) void updateVenueRemote(v).catch(() => {});
    }
  } else {
    saveVenues(venues);
  }
});

// Global and project-independent, like the device registry: a venue outlives
// every project that touches it, so this must never become a SPECS key.
export const useVenues = create<VenuesState>()((set, get) => ({
  venues: isSupabaseConfigured ? [] : loadVenues(),

  addVenue: (venue) => {
    const venues = [...get().venues, venue];
    if (isSupabaseConfigured) void insertVenue(venue).catch(() => {});
    else saveVenues(venues);
    set({ venues });
  },

  updateVenue: (id, patch) => {
    const venues = get().venues.map((v) => (v.id === id ? { ...v, ...patch } : v));
    set({ venues });
    pendingWrites.schedule(id);
  },

  removeVenue: (id) => {
    pendingWrites.cancel(id);
    const venues = get().venues.filter((v) => v.id !== id);
    if (isSupabaseConfigured) void deleteVenueRemote(id).catch(() => {});
    else saveVenues(venues);
    set({ venues });
  },

  hydrateFromServer: async () => {
    set({ venues: await fetchVenues() });
  },
}));

export function newVenueId(): string {
  return `ven-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}
