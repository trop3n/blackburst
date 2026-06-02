import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scaffoldBucket, switchProject, writeBucket } from "@/lib/project-storage";
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
  { id: "PRJ-2451", name: "Atrium Lobby Wall", client: "Northwind HQ", status: "in-design" },
  { id: "PRJ-2447", name: "Auditorium Refresh", client: "Helios Tech", status: "fabrication" },
  { id: "PRJ-2440", name: "Broadcast Studio B", client: "KCR Media", status: "delivered" },
];

const INITIAL_REVISIONS: Record<string, Revision[]> = {
  "PRJ-2451": [{ n: 42, note: "Initial baseline", at: "2026-04-28T14:22:08" }],
  "PRJ-2447": [],
  "PRJ-2440": [],
};

function nextProjectId(projects: Project[]): string {
  const nums = projects
    .map((p) => Number(p.id.split("-")[1]))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 2450;
  return `PRJ-${max + 1}`;
}

interface AppState {
  module: ModuleId;
  setModule: (m: ModuleId) => void;
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  project: Project;
  updateCurrentProject: (patch: Partial<Project>) => void;
  revisionsByProject: Record<string, Revision[]>;
  revisions: Revision[];
  saveRev: (note: string) => void;
  setRevisionsForCurrent: (list: Revision[]) => void;
  addProject: (name: string, client: string) => void;
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
      setCurrentProjectId: (id) => {
        const cur = get().currentProjectId;
        if (cur === id) return;
        const next = get().projects.find((p) => p.id === id);
        if (!next) return;
        switchProject(cur, id);
        set((s) => ({
          currentProjectId: id,
          project: next,
          revisions: s.revisionsByProject[id] ?? [],
        }));
      },
      updateCurrentProject: (patch) =>
        set((s) => {
          const id = s.currentProjectId;
          const projects = s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
          const project = projects.find((p) => p.id === id) ?? s.project;
          return { projects, project };
        }),
      revisionsByProject: INITIAL_REVISIONS,
      revisions: INITIAL_REVISIONS["PRJ-2451"] ?? [],
      saveRev: (note) =>
        set((s) => {
          const id = s.currentProjectId;
          const list = s.revisionsByProject[id] ?? [];
          const next = (list[0]?.n ?? 0) + 1;
          const rev: Revision = { n: next, note: note || "Saved revision", at: new Date().toISOString() };
          const updated = [rev, ...list];
          return {
            revisionsByProject: { ...s.revisionsByProject, [id]: updated },
            revisions: updated,
          };
        }),
      setRevisionsForCurrent: (list) =>
        set((s) => ({
          revisionsByProject: { ...s.revisionsByProject, [s.currentProjectId]: list },
          revisions: list,
        })),
      addProject: (name, client) => {
        const id = nextProjectId(get().projects);
        const project: Project = { id, name, client, status: "in-design" };
        writeBucket(id, scaffoldBucket());
        set((s) => ({ projects: [...s.projects, project] }));
        get().setCurrentProjectId(id);
      },
    }),
    { name: "blackburst:app:v1" },
  ),
);
