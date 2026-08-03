import { create } from "zustand";
import {
  deleteVenueRemote,
  fetchVenues,
  insertVenue,
  updateVenueRemote,
} from "@/lib/maintenance-remote";
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
    if (isSupabaseConfigured) {
      const updated = venues.find((v) => v.id === id);
      if (updated) void updateVenueRemote(updated).catch(() => {});
    } else saveVenues(venues);
    set({ venues });
  },

  removeVenue: (id) => {
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
