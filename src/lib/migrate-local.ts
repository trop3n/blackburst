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

  const persisted = readJSON<{ state?: LegacyState }>(APP_KEY);
  const projects = persisted?.state?.projects ?? [];
  if (projects.length === 0) {
    localStorage.setItem(flagKey, new Date().toISOString());
    return [];
  }

  const ok = await confirmDialog(
    `Import ${projects.length} project${projects.length === 1 ? "" : "s"} from this browser into your account?`,
    { confirmLabel: "Import" },
  );
  if (!ok) {
    localStorage.setItem(flagKey, "declined");
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
    for (const rev of revisionsByProject[p.id] ?? []) {
      await insertRevision(remote.id, rev);
    }
    created.push(remote);
  }
  localStorage.setItem(flagKey, new Date().toISOString());
  return created;
}
