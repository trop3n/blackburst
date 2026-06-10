import { create } from "zustand";
import {
  fetchInvites,
  fetchMembers,
  inviteMember,
  removeMember,
  revokeInvite,
  updateMemberRole,
  type ShareInvite,
  type ShareMember,
} from "@/lib/project-remote";
import type { MemberRole } from "@/types";

interface ShareState {
  open: boolean;
  projectId: string | null;
  members: ShareMember[];
  invites: ShareInvite[];
  loading: boolean;
  error: string | null;
  openFor: (projectId: string) => void;
  close: () => void;
  reload: () => Promise<void>;
  invite: (email: string, role: MemberRole) => Promise<void>;
  setRole: (userId: string, role: MemberRole) => Promise<void>;
  remove: (userId: string) => Promise<void>;
  revoke: (inviteId: string) => Promise<void>;
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const useShare = create<ShareState>((set, get) => ({
  open: false,
  projectId: null,
  members: [],
  invites: [],
  loading: false,
  error: null,
  openFor: (projectId) => {
    set({ open: true, projectId, members: [], invites: [], error: null });
    void get().reload();
  },
  close: () => set({ open: false }),
  reload: async () => {
    const projectId = get().projectId;
    if (!projectId) return;
    set({ loading: true, error: null });
    try {
      const [members, invites] = await Promise.all([
        fetchMembers(projectId),
        fetchInvites(projectId),
      ]);
      set({ members, invites, loading: false });
    } catch (e) {
      set({ error: message(e), loading: false });
    }
  },
  invite: async (email, role) => {
    const projectId = get().projectId;
    if (!projectId) return;
    set({ error: null });
    try {
      await inviteMember(projectId, email, role);
      await get().reload();
    } catch (e) {
      set({ error: message(e) });
    }
  },
  setRole: async (userId, role) => {
    const projectId = get().projectId;
    if (!projectId) return;
    try {
      await updateMemberRole(projectId, userId, role);
      await get().reload();
    } catch (e) {
      set({ error: message(e) });
    }
  },
  remove: async (userId) => {
    const projectId = get().projectId;
    if (!projectId) return;
    try {
      await removeMember(projectId, userId);
      await get().reload();
    } catch (e) {
      set({ error: message(e) });
    }
  },
  revoke: async (inviteId) => {
    try {
      await revokeInvite(inviteId);
      await get().reload();
    } catch (e) {
      set({ error: message(e) });
    }
  },
}));
