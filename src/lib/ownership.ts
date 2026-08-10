import { isSupabaseConfigured } from "@/lib/supabase";

// Delete affordances for the shared global layers (catalog items, venues,
// maintenance entries) mirror the RLS delete policies: a row is deletable by
// its contributor, or by anyone once the contributor's account is gone
// (created_by null — migration 0007). Anything else renders no delete control,
// because the server would silently refuse and the optimistic removal would
// resurrect on the next refetch, which reads as a sync bug.
//
// `owner === undefined` means ownership is unknown (not hydrated yet) — treat
// as not deletable rather than offer a control that may fail.
export function canDeleteShared(
  owner: string | null | undefined,
  myId: string | null | undefined,
): boolean {
  if (!isSupabaseConfigured) return true;
  return owner === null || (owner != null && myId != null && owner === myId);
}
