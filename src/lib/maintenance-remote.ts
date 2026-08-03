import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";
import type { MaintenanceEntry, Venue } from "@/types";

// Server access for venues and their service history (accounts mode). Same
// shape as the other global layers: one row per record, `data` holding the
// client record verbatim so its generated `id` round-trips and writes filter on
// `data->>id`. See supabase/migrations/0004_venues_maintenance.sql.

export async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("data")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as { data: Venue }[]).map((r) => r.data);
}

export async function insertVenue(venue: Venue): Promise<void> {
  const userId = useAuth.getState().user?.id ?? null;
  const { error } = await supabase.from("venues").insert({ data: venue, created_by: userId });
  if (error) throw error;
}

export async function updateVenueRemote(venue: Venue): Promise<void> {
  const { error } = await supabase.from("venues").update({ data: venue }).eq("data->>id", venue.id);
  if (error) throw error;
}

export async function deleteVenueRemote(venueId: string): Promise<void> {
  const { error } = await supabase.from("venues").delete().eq("data->>id", venueId);
  if (error) throw error;
}

export async function fetchMaintenanceEntries(): Promise<MaintenanceEntry[]> {
  const { data, error } = await supabase
    .from("maintenance_entries")
    .select("data")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as { data: MaintenanceEntry }[]).map((r) => r.data);
}

export async function insertMaintenanceEntry(entry: MaintenanceEntry): Promise<void> {
  const userId = useAuth.getState().user?.id ?? null;
  const { error } = await supabase
    .from("maintenance_entries")
    .insert({ data: entry, created_by: userId });
  if (error) throw error;
}

export async function updateMaintenanceEntryRemote(entry: MaintenanceEntry): Promise<void> {
  const { error } = await supabase
    .from("maintenance_entries")
    .update({ data: entry })
    .eq("data->>id", entry.id);
  if (error) throw error;
}

export async function deleteMaintenanceEntryRemote(entryId: string): Promise<void> {
  const { error } = await supabase.from("maintenance_entries").delete().eq("data->>id", entryId);
  if (error) throw error;
}
