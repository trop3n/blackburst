import { createProjectRemote, insertRevision, type RemoteProject } from "@/lib/project-remote";
import { BUCKETS_KEY, scaffoldBucket, type ProjectStateBuckets } from "@/lib/project-storage";
import { useAuth } from "@/store/useAuth";
import { confirmDialog } from "@/store/useDialog";
import type { Revision } from "@/store/useApp";
import type { Project } from "@/types";

const APP_KEY = "blackburst:app:v1";

interface LegacyState {
  projects?: Project[];
  revisionsByProject?: Record<string, Revision[]>;
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// One-time on first sign-in: lift this browser's local-mode projects into the
// account. Guarded by a per-user flag so it never re-runs (or re-prompts).
export async function migrateLocalProjects(): Promise<RemoteProject[]> {
  const userId = useAuth.getState().user?.id;
  if (!userId) return [];
  const flagKey = `blackburst:migrated:${userId}`;
  if (localStorage.getItem(flagKey)) return [];
  // Per-project progress: a failure partway must not re-create the projects
  // that already made it when bootstrap retries.
  const doneKey = `blackburst:migrated-projects:${userId}`;
  const done = new Set(readJSON<string[]>(doneKey) ?? []);

  const persisted = readJSON<{ state?: LegacyState }>(APP_KEY);
  // Only local-shaped projects: a local project's id IS its code (and pre-code
  // projects have no code at all), while a server project carries a UUID id ≠
  // code. The filter matters because accounts mode persists the server project
  // list back into this same key — without it, the next account to sign in on
  // this browser would be offered the previous user's cloud projects as an
  // "import" and create empty duplicates of them.
  const projects = (persisted?.state?.projects ?? []).filter(
    (p) => (p.code == null || p.id === p.code) && !done.has(p.id),
  );
  if (projects.length === 0) {
    localStorage.setItem(flagKey, new Date().toISOString());
    localStorage.removeItem(doneKey);
    return [];
  }

  const ok = await confirmDialog(
    `Import ${projects.length} project${projects.length === 1 ? "" : "s"} from this browser into your account?`,
    { confirmLabel: "Import" },
  );
  if (!ok) {
    localStorage.setItem(flagKey, "declined");
    localStorage.removeItem(doneKey);
    return [];
  }

  const buckets = readJSON<Record<string, ProjectStateBuckets>>(BUCKETS_KEY) ?? {};
  const revisionsByProject = persisted?.state?.revisionsByProject ?? {};
  const created: RemoteProject[] = [];
  for (const p of projects) {
    const remote = await createProjectRemote({
      name: p.name,
      client: p.client,
      code: p.code ?? p.id,
      bucket: buckets[p.id] ?? scaffoldBucket(),
    });
    // The project now exists server-side — record that before anything else
    // can throw, or a retry would import it twice. Revisions are best-effort
    // for the same reason: losing a note beats duplicating a project.
    done.add(p.id);
    localStorage.setItem(doneKey, JSON.stringify([...done]));
    for (const rev of revisionsByProject[p.id] ?? []) {
      await insertRevision(remote.id, rev).catch(() => {});
    }
    created.push(remote);
  }
  localStorage.setItem(flagKey, new Date().toISOString());
  localStorage.removeItem(doneKey);
  return created;
}
