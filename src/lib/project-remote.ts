import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ProjectStateBuckets } from "@/lib/project-storage";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";
import type { Revision } from "@/store/useApp";
import type { MemberRole, Project } from "@/types";

export interface RemoteProject extends Project {
  ownerId: string;
  role: MemberRole;
}

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  client: string;
  status: string;
  owner_id: string;
}

function currentUserId(): string | null {
  return useAuth.getState().user?.id ?? null;
}

function toRemote(p: ProjectRow, role: MemberRole): RemoteProject {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    client: p.client,
    status: p.status,
    ownerId: p.owner_id,
    role,
  };
}

export async function fetchMyProjects(): Promise<RemoteProject[]> {
  const userId = currentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("project_members")
    .select("role, project:projects(id, code, name, client, status, owner_id)")
    .eq("user_id", userId);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{ role: MemberRole; project: ProjectRow | null }>;
  return rows
    .filter((r): r is { role: MemberRole; project: ProjectRow } => r.project != null)
    .map((r) => toRemote(r.project, r.role));
}

export async function fetchBucket(projectId: string): Promise<ProjectStateBuckets | null> {
  const { data, error } = await supabase
    .from("project_state")
    .select("data")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  const row = data as unknown as { data: ProjectStateBuckets } | null;
  return row?.data ?? null;
}

export async function upsertBucket(projectId: string, data: ProjectStateBuckets): Promise<void> {
  const userId = currentUserId();
  const { error } = await supabase.from("project_state").upsert(
    { project_id: projectId, data, updated_at: new Date().toISOString(), updated_by: userId },
    { onConflict: "project_id" },
  );
  if (error) throw error;
}

// Fire-and-forget upsert for pagehide/visibilitychange — supabase-js can't set
// `keepalive`, so this posts straight to PostgREST so the write survives unload.
export function beaconUpsertBucket(projectId: string, data: ProjectStateBuckets): void {
  const session = useAuth.getState().session;
  if (!SUPABASE_URL || !session) return;
  void fetch(`${SUPABASE_URL}/rest/v1/project_state`, {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      project_id: projectId,
      data,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id,
    }),
  }).catch(() => {});
}

export async function createProjectRemote(input: {
  name: string;
  client: string;
  code: string;
  bucket: ProjectStateBuckets;
}): Promise<RemoteProject> {
  const userId = currentUserId();
  if (!userId) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: input.name, client: input.client, code: input.code, owner_id: userId })
    .select("id, code, name, client, status, owner_id")
    .single();
  if (error) throw error;
  const project = data as unknown as ProjectRow;
  const { error: stateErr } = await supabase
    .from("project_state")
    .insert({ project_id: project.id, data: input.bucket, updated_by: userId });
  if (stateErr) throw stateErr;
  return toRemote(project, "owner");
}

export async function updateProjectRemote(
  id: string,
  patch: Partial<Pick<Project, "name" | "client" | "status">>,
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProjectRemote(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchRevisions(projectId: string): Promise<Revision[]> {
  const { data, error } = await supabase
    .from("project_revisions")
    .select("n, note, at")
    .eq("project_id", projectId)
    .order("n", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Revision[];
}

export async function insertRevision(projectId: string, rev: Revision): Promise<void> {
  const userId = currentUserId();
  const { error } = await supabase
    .from("project_revisions")
    .insert({ project_id: projectId, n: rev.n, note: rev.note, at: rev.at, author_id: userId });
  if (error) throw error;
}

// ───────────────────────── sharing ─────────────────────────

export interface ShareMember {
  userId: string;
  role: MemberRole;
  email: string | null;
  displayName: string | null;
}

export interface ShareInvite {
  id: string;
  email: string;
  role: MemberRole;
}

export async function fetchMembers(projectId: string): Promise<ShareMember[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id, role")
    .eq("project_id", projectId);
  if (error) throw error;
  const members = (data ?? []) as unknown as Array<{ user_id: string; role: MemberRole }>;
  const ids = members.map((m) => m.user_id);
  let profiles: Array<{ id: string; email: string | null; display_name: string | null }> = [];
  if (ids.length) {
    const { data: profRows, error: pErr } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", ids);
    if (pErr) throw pErr;
    profiles = (profRows ?? []) as unknown as typeof profiles;
  }
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return members.map((m) => {
    const p = byId.get(m.user_id);
    return {
      userId: m.user_id,
      role: m.role,
      email: p?.email ?? null,
      displayName: p?.display_name ?? null,
    };
  });
}

export async function fetchInvites(projectId: string): Promise<ShareInvite[]> {
  const { data, error } = await supabase
    .from("project_invites")
    .select("id, email, role")
    .eq("project_id", projectId)
    .is("accepted_at", null);
  if (error) throw error;
  return (data ?? []) as unknown as ShareInvite[];
}

export async function inviteMember(projectId: string, email: string, role: MemberRole): Promise<void> {
  const { error } = await supabase.from("project_invites").upsert(
    {
      project_id: projectId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: currentUserId(),
      accepted_at: null,
    },
    { onConflict: "project_id,email" },
  );
  if (error) throw error;
}

export async function updateMemberRole(projectId: string, userId: string, role: MemberRole): Promise<void> {
  const { error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from("project_invites").delete().eq("id", inviteId);
  if (error) throw error;
}

export async function claimInvites(): Promise<number> {
  const { data, error } = await supabase.rpc("claim_invites");
  if (error) throw error;
  return (data as number | null) ?? 0;
}

// ───────────────────────── realtime ─────────────────────────
// A collaborator's saved bucket lands here so the active project refreshes
// without a manual reload. Last-write-wins awareness, not a CRDT merge.

let stateChannel: RealtimeChannel | null = null;

export function subscribeToBucket(
  projectId: string,
  onRemote: (data: ProjectStateBuckets) => void,
): void {
  unsubscribeBucket();
  const myId = currentUserId();
  stateChannel = supabase
    .channel(`project_state:${projectId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "project_state", filter: `project_id=eq.${projectId}` },
      (payload) => {
        const row = payload.new as { data?: ProjectStateBuckets; updated_by?: string } | null;
        if (!row?.data) return;
        if (row.updated_by && row.updated_by === myId) return; // ignore our own echo
        onRemote(row.data);
      },
    )
    .subscribe();
}

export function unsubscribeBucket(): void {
  if (stateChannel) {
    void supabase.removeChannel(stateChannel);
    stateChannel = null;
  }
}
