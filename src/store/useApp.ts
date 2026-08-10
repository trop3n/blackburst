import { create } from "zustand";
import { persist } from "zustand/middleware";
import { subscribeGlobalTables, unsubscribeGlobalTables } from "@/lib/global-realtime";
import { hoistLegacyDevicesRemote } from "@/lib/migrate-devices";
import { migrateLocalProjects } from "@/lib/migrate-local";
import {
  claimInvites,
  createProjectRemote,
  deleteProjectRemote,
  fetchMyProjects,
  fetchRevisions,
  insertRevision,
  removeMember,
  updateProjectRemote,
} from "@/lib/project-remote";
import {
  cancelPendingSave,
  clearActiveProject,
  deleteProjectLocal,
  initProjectStateFromServer,
  scaffoldBucket,
  switchProject,
  writeBucket,
} from "@/lib/project-storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";
import { useCatalog } from "@/store/useCatalog";
import { useDevices } from "@/store/useDevices";
import { useMaintenance } from "@/store/useMaintenance";
import { useVenues } from "@/store/useVenues";
import type { AccentName, CanvasStyle, Density, ModuleId, Project, Shell } from "@/types";

export interface Tweaks {
  density: Density;
  accent: AccentName;
  shell: Shell;
  canvasStyle: CanvasStyle;
}

export const ACCENTS: Record<AccentName, { c: string; dim: string; faint: string }> = {
  "acid-green": {
    c: "oklch(0.86 0.19 145)",
    dim: "oklch(0.86 0.19 145 / 0.18)",
    faint: "oklch(0.86 0.19 145 / 0.08)",
  },
  amber: {
    c: "oklch(0.82 0.17 70)",
    dim: "oklch(0.82 0.17 70 / 0.18)",
    faint: "oklch(0.82 0.17 70 / 0.08)",
  },
  cyan: {
    c: "oklch(0.82 0.13 220)",
    dim: "oklch(0.82 0.13 220 / 0.18)",
    faint: "oklch(0.82 0.13 220 / 0.08)",
  },
  magenta: {
    c: "oklch(0.78 0.22 330)",
    dim: "oklch(0.78 0.22 330 / 0.18)",
    faint: "oklch(0.78 0.22 330 / 0.08)",
  },
  white: {
    c: "oklch(0.96 0 0)",
    dim: "oklch(0.96 0 0 / 0.18)",
    faint: "oklch(0.96 0 0 / 0.06)",
  },
};

export interface Revision {
  n: number;
  note: string;
  at: string;
}

// Clean local-mode starting point: one empty project. In accounts mode this is
// replaced by the user's server projects during bootstrap().
const PROJECTS: Project[] = [
  { id: "PRJ-0001", code: "PRJ-0001", name: "Untitled Project", client: "—", status: "in-design" },
];

const INITIAL_REVISIONS: Record<string, Revision[]> = {};

function nextCode(projects: Project[]): string {
  const nums = projects
    .map((p) => Number(p.code.split("-")[1]))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 2450;
  return `PRJ-${max + 1}`;
}

let bootstrapping = false;

interface AppState {
  module: ModuleId;
  setModule: (m: ModuleId) => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => Promise<void>;
  project: Project;
  updateCurrentProject: (patch: Partial<Project>) => void;
  revisionsByProject: Record<string, Revision[]>;
  revisions: Revision[];
  saveRev: (note: string) => void;
  setRevisionsForCurrent: (list: Revision[]) => void;
  addProject: (name: string, client: string) => Promise<void>;
  leaveCurrentProject: () => Promise<void>;
  deleteCurrentProject: () => Promise<void>;
  ready: boolean;
  // Why the last bootstrap failed; the splash renders it with a retry button.
  // Deliberately not persisted — a stale error must not outlive the session.
  bootError: string | null;
  bootstrap: () => Promise<void>;
  resetSession: () => void;
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      module: "wall",
      setModule: (module) => set({ module }),
      tweaks: {
        density: "normal",
        accent: "acid-green",
        shell: "rail",
        canvasStyle: "grid",
      },
      setTweak: (key, value) =>
        set((s) => ({ tweaks: { ...s.tweaks, [key]: value } })),
      projects: PROJECTS,
      currentProjectId: "PRJ-0001",
      project: PROJECTS[0],
      ready: !isSupabaseConfigured,
      bootError: null,
      setCurrentProjectId: async (id) => {
        const cur = get().currentProjectId;
        if (cur === id) return;
        const next = get().projects.find((p) => p.id === id);
        if (!next) return;
        await switchProject(cur, id);
        // Best-effort: once the stores hold the new project, the header must
        // switch with them — a failed revision list must not strand the UI
        // labeled with the old project over the new project's data.
        const revisions = isSupabaseConfigured
          ? await fetchRevisions(id).catch(() => [] as Revision[])
          : get().revisionsByProject[id] ?? [];
        set((s) => ({
          currentProjectId: id,
          project: next,
          revisions,
          revisionsByProject: isSupabaseConfigured
            ? { ...s.revisionsByProject, [id]: revisions }
            : s.revisionsByProject,
        }));
      },
      updateCurrentProject: (patch) => {
        const id = get().currentProjectId;
        set((s) => {
          const projects = s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
          const project = projects.find((p) => p.id === id) ?? s.project;
          return { projects, project };
        });
        if (isSupabaseConfigured) {
          void updateProjectRemote(id, {
            name: patch.name,
            client: patch.client,
            status: patch.status,
          }).catch(() => {});
        }
      },
      revisionsByProject: INITIAL_REVISIONS,
      revisions: [],
      saveRev: (note) => {
        const id = get().currentProjectId;
        const list = get().revisionsByProject[id] ?? [];
        const n = (list[0]?.n ?? 0) + 1;
        const rev: Revision = { n, note: note || "Saved revision", at: new Date().toISOString() };
        const updated = [rev, ...list];
        set((s) => ({
          revisionsByProject: { ...s.revisionsByProject, [id]: updated },
          revisions: updated,
        }));
        if (isSupabaseConfigured) void insertRevision(id, rev).catch(() => {});
      },
      setRevisionsForCurrent: (list) =>
        set((s) => ({
          revisionsByProject: { ...s.revisionsByProject, [s.currentProjectId]: list },
          revisions: list,
        })),
      addProject: async (name, client) => {
        const code = nextCode(get().projects);
        if (isSupabaseConfigured) {
          const created = await createProjectRemote({ name, client, code, bucket: scaffoldBucket() });
          set((s) => ({ projects: [...s.projects, created] }));
          await get().setCurrentProjectId(created.id);
          return;
        }
        const project: Project = { id: code, code, name, client, status: "in-design" };
        writeBucket(code, scaffoldBucket());
        set((s) => ({ projects: [...s.projects, project] }));
        await get().setCurrentProjectId(code);
      },
      leaveCurrentProject: async () => {
        const id = get().currentProjectId;
        const uid = useAuth.getState().user?.id;
        if (!isSupabaseConfigured || !uid) return;
        // A queued autosave must not fire against a project we're walking away
        // from — after removeMember it would be RLS-denied and flash an error.
        cancelPendingSave();
        await removeMember(id, uid);
        let remaining = get().projects.filter((p) => p.id !== id);
        if (remaining.length === 0) {
          const created = await createProjectRemote({
            name: "Untitled Project",
            client: "—",
            code: nextCode([]),
            bucket: scaffoldBucket(),
          });
          remaining = [created];
        }
        const nextProj = remaining[0];
        await initProjectStateFromServer(nextProj.id);
        const revisions = await fetchRevisions(nextProj.id).catch(() => [] as Revision[]);
        set({
          projects: remaining,
          currentProjectId: nextProj.id,
          project: nextProj,
          revisions,
          revisionsByProject: { [nextProj.id]: revisions },
        });
      },
      deleteCurrentProject: async () => {
        const id = get().currentProjectId;
        if (isSupabaseConfigured) {
          // Same as leave: drop any queued autosave before the row disappears.
          cancelPendingSave();
          await deleteProjectRemote(id);
          let remaining = get().projects.filter((p) => p.id !== id);
          // Never leave the workspace empty — seed a fresh project if it was the last.
          if (remaining.length === 0) {
            const created = await createProjectRemote({
              name: "Untitled Project",
              client: "—",
              code: nextCode([]),
              bucket: scaffoldBucket(),
            });
            remaining = [created];
          }
          const nextProj = remaining[0];
          await initProjectStateFromServer(nextProj.id);
          const revisions = await fetchRevisions(nextProj.id).catch(() => [] as Revision[]);
          set({
            projects: remaining,
            currentProjectId: nextProj.id,
            project: nextProj,
            revisions,
            revisionsByProject: { [nextProj.id]: revisions },
          });
          return;
        }
        let remaining = get().projects.filter((p) => p.id !== id);
        if (remaining.length === 0) {
          const code = nextCode([]);
          const fresh: Project = { id: code, code, name: "Untitled Project", client: "—", status: "in-design" };
          writeBucket(code, scaffoldBucket());
          remaining = [fresh];
        }
        const nextProj = remaining[0];
        deleteProjectLocal(id, nextProj.id);
        const remainingRevs = { ...get().revisionsByProject };
        delete remainingRevs[id];
        set({
          projects: remaining,
          currentProjectId: nextProj.id,
          project: nextProj,
          revisions: remainingRevs[nextProj.id] ?? [],
          revisionsByProject: remainingRevs,
        });
      },
      bootstrap: async () => {
        if (!isSupabaseConfigured) {
          set({ ready: true });
          return;
        }
        if (bootstrapping) return;
        bootstrapping = true;
        set({ bootError: null });
        try {
          try {
            await claimInvites();
          } catch {
            // best-effort: pending invites attach on load, never block bootstrap
          }
          let projects = await fetchMyProjects();
          // Import this browser's local projects on first login even when the
          // account already has shared ones (self-guarded by a per-user flag).
          const migrated = await migrateLocalProjects();
          if (migrated.length > 0) projects = [...projects, ...migrated];
          if (projects.length === 0) {
            const created = await createProjectRemote({
              name: "Untitled Project",
              client: "—",
              code: nextCode(projects),
              bucket: scaffoldBucket(),
            });
            projects = [created];
          }
          const persistedId = get().currentProjectId;
          const current = projects.find((p) => p.id === persistedId) ?? projects[0];
          await initProjectStateFromServer(current.id);
          const revisions = await fetchRevisions(current.id).catch(() => [] as Revision[]);
          try {
            await useCatalog.getState().hydrateFromServer();
          } catch {
            // best-effort: the shared catalog falls back to built-ins if the
            // catalog_items table isn't reachable (e.g. migration not yet run)
          }
          try {
            await hoistLegacyDevicesRemote(projects.map((p) => p.id));
            await useDevices.getState().hydrateFromServer();
          } catch {
            // best-effort: the device registry stays empty if the devices table
            // isn't reachable (e.g. migration not yet run)
          }
          try {
            await useVenues.getState().hydrateFromServer();
            await useMaintenance.getState().hydrateFromServer();
          } catch {
            // best-effort: the maintenance log stays empty if its tables aren't
            // reachable (e.g. migration not yet run)
          }
          // Subscribe after the initial hydrate so the first payload can't race
          // the load it would be refreshing.
          subscribeGlobalTables();
          set({
            projects,
            currentProjectId: current.id,
            project: current,
            revisions,
            revisionsByProject: { [current.id]: revisions },
            ready: true,
          });
        } catch (err) {
          // A transient failure used to strand the splash forever: the effect
          // that calls bootstrap never refires (its deps don't change), so the
          // error must surface with an explicit retry.
          set({ bootError: errorText(err) });
        } finally {
          bootstrapping = false;
        }
      },
      resetSession: () => {
        clearActiveProject();
        unsubscribeGlobalTables();
        set({ ready: false, bootError: null, projects: [], revisions: [], revisionsByProject: {} });
      },
    }),
    {
      name: "blackburst:app:v1",
      version: 2,
      // Backfill `code` for projects persisted before the field existed.
      migrate: (persisted) => {
        const s = (persisted ?? {}) as Partial<AppState>;
        if (Array.isArray(s.projects)) {
          s.projects = s.projects.map((p) => ({ ...p, code: p.code ?? p.id }));
        }
        if (s.project && !s.project.code) {
          s.project = { ...s.project, code: s.project.id };
        }
        return s as AppState;
      },
      partialize: (s) => ({
        module: s.module,
        tweaks: s.tweaks,
        currentProjectId: s.currentProjectId,
        projects: s.projects,
        project: s.project,
        revisionsByProject: s.revisionsByProject,
        revisions: s.revisions,
      }),
    },
  ),
);
