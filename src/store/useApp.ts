import { create } from "zustand";
import { persist } from "zustand/middleware";
import { migrateLocalProjects } from "@/lib/migrate-local";
import {
  claimInvites,
  createProjectRemote,
  fetchMyProjects,
  fetchRevisions,
  insertRevision,
  removeMember,
  updateProjectRemote,
} from "@/lib/project-remote";
import {
  clearActiveProject,
  initProjectStateFromServer,
  scaffoldBucket,
  switchProject,
  writeBucket,
} from "@/lib/project-storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";
import { useCatalog } from "@/store/useCatalog";
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

const PROJECTS: Project[] = [
  { id: "PRJ-2451", code: "PRJ-2451", name: "Atrium Lobby Wall", client: "Northwind HQ", status: "in-design" },
  { id: "PRJ-2447", code: "PRJ-2447", name: "Auditorium Refresh", client: "Helios Tech", status: "fabrication" },
  { id: "PRJ-2440", code: "PRJ-2440", name: "Broadcast Studio B", client: "KCR Media", status: "delivered" },
];

const INITIAL_REVISIONS: Record<string, Revision[]> = {
  "PRJ-2451": [{ n: 42, note: "Initial baseline", at: "2026-04-28T14:22:08" }],
  "PRJ-2447": [],
  "PRJ-2440": [],
};

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
  ready: boolean;
  bootstrap: () => Promise<void>;
  resetSession: () => void;
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
      currentProjectId: "PRJ-2451",
      project: PROJECTS[0],
      ready: !isSupabaseConfigured,
      setCurrentProjectId: async (id) => {
        const cur = get().currentProjectId;
        if (cur === id) return;
        const next = get().projects.find((p) => p.id === id);
        if (!next) return;
        await switchProject(cur, id);
        const revisions = isSupabaseConfigured
          ? await fetchRevisions(id)
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
      revisions: INITIAL_REVISIONS["PRJ-2451"] ?? [],
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
        const revisions = await fetchRevisions(nextProj.id);
        set({
          projects: remaining,
          currentProjectId: nextProj.id,
          project: nextProj,
          revisions,
          revisionsByProject: { [nextProj.id]: revisions },
        });
      },
      bootstrap: async () => {
        if (!isSupabaseConfigured) {
          set({ ready: true });
          return;
        }
        if (bootstrapping) return;
        bootstrapping = true;
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
          const revisions = await fetchRevisions(current.id);
          try {
            await useCatalog.getState().hydrateFromServer();
          } catch {
            // best-effort: the shared catalog falls back to built-ins if the
            // catalog_items table isn't reachable (e.g. migration not yet run)
          }
          set({
            projects,
            currentProjectId: current.id,
            project: current,
            revisions,
            revisionsByProject: { [current.id]: revisions },
            ready: true,
          });
        } finally {
          bootstrapping = false;
        }
      },
      resetSession: () => {
        clearActiveProject();
        set({ ready: false, projects: [], revisions: [], revisionsByProject: {} });
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
