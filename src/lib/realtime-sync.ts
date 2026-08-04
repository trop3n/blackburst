import type { RealtimeChannel } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";

// Bursts are common — renaming a venue writes once per keystroke — so coalesce
// them into a single refetch rather than one per broadcast.
const REFRESH_DEBOUNCE_MS = 300;

export interface TableSync {
  subscribe: () => void;
  unsubscribe: () => void;
}

// Realtime for a global (project-independent) table. On a collaborator's change
// the whole table is refetched rather than the row payload being merged: these
// tables are small, `hydrateFromServer` already exists and is the same path used
// at sign-in, and it keeps one code path instead of two.
// `hasPendingWrites` is the second half of the clobber guard, mirroring the
// pending-save check `applyRemote` carries for project_state: suppressing our
// own echo is not enough, because a *collaborator's* write to any row schedules
// a refetch of the whole table, including the row this user is still typing in.
export function createTableSync(
  table: string,
  refresh: () => Promise<void>,
  hasPendingWrites?: () => boolean,
): TableSync {
  let channel: RealtimeChannel | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function scheduleRefresh() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      // Re-arm rather than drop the refresh: local state is ahead of the server
      // until the debounced write lands, so refetching now would overwrite the
      // edit with a stale row — but bailing outright would leave this client
      // stale until the next collaborator write, which may never come.
      if (hasPendingWrites?.()) {
        scheduleRefresh();
        return;
      }
      // Best-effort, like every other server read: a failed refresh must never
      // break the session, it just means this client is stale until the next one.
      void refresh().catch(() => {});
    }, REFRESH_DEBOUNCE_MS);
  }

  function unsubscribe() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
  }

  return {
    subscribe() {
      if (!isSupabaseConfigured) return;
      unsubscribe();
      const myId = useAuth.getState().user?.id ?? null;
      channel = supabase
        .channel(`global:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            const row = payload.new as { updated_by?: string } | null;
            // Our own write echoes straight back, and the store already applied
            // it optimistically — refetching would just churn (and could clobber
            // an edit still being typed). DELETE carries no `new` row, so those
            // always refresh; that's harmless since the refetch is idempotent.
            if (row?.updated_by && row.updated_by === myId) return;
            scheduleRefresh();
          },
        )
        .subscribe();
    },
    unsubscribe,
  };
}
