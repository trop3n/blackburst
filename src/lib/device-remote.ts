import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";
import type { Device } from "@/types";

// Server access for the global device registry (accounts mode). One row per
// device in public.devices; `data` is the Device record stored verbatim so its
// client-generated `id` round-trips — rack items, graph nodes and inventory
// assets reference that id, so updates and deletes filter on `data->>id`.
// See supabase/migrations/0003_devices.sql.

export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("data")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as { data: Device }[]).map((r) => r.data);
}

export async function insertDevice(device: Device): Promise<void> {
  const userId = useAuth.getState().user?.id ?? null;
  const { error } = await supabase.from("devices").insert({ data: device, created_by: userId });
  if (error) throw error;
}

// Unlike catalog items (immutable once contributed), a device record is edited
// in place — serials get corrected and labels get renamed as gear moves.
export async function updateDeviceRemote(device: Device): Promise<void> {
  const { error } = await supabase
    .from("devices")
    .update({ data: device })
    .eq("data->>id", device.id);
  if (error) throw error;
}

export async function deleteDeviceRemote(deviceId: string): Promise<void> {
  const { error } = await supabase.from("devices").delete().eq("data->>id", deviceId);
  if (error) throw error;
}
