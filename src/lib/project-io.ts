import { upsertBucket } from "@/lib/project-remote";
import {
  applyState,
  snapshotCurrent,
  writeBucket,
  type ProjectStateBuckets,
} from "@/lib/project-storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp, type Revision } from "@/store/useApp";
import type { Project } from "@/types";

// v4 moved the rack module from a single `items` array to a `racks` list.
// Older files still import — applyState migrates the shape on load.
export const SUPPORTED_SNAPSHOT_VERSIONS = [2, 3, 4] as const;
export type SnapshotVersion = (typeof SUPPORTED_SNAPSHOT_VERSIONS)[number];

export interface ProjectSnapshot {
  format: "blackburst-project";
  version: SnapshotVersion;
  exportedAt: string;
  project: Project;
  revisions: Revision[];
  state: ProjectStateBuckets;
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildSnapshot(): ProjectSnapshot {
  const app = useApp.getState();
  return {
    format: "blackburst-project",
    version: 4,
    exportedAt: new Date().toISOString(),
    project: app.project,
    revisions: app.revisions,
    state: snapshotCurrent(),
  };
}

export function exportProject() {
  const snap = buildSnapshot();
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Blackburst-${snap.project.code}-${todayStamp()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importProject(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as Partial<ProjectSnapshot>;
  if (data.format !== "blackburst-project") {
    throw new Error("Not a Blackburst project file");
  }
  if (
    typeof data.version !== "number" ||
    !SUPPORTED_SNAPSHOT_VERSIONS.includes(data.version as SnapshotVersion)
  ) {
    throw new Error(
      `Unsupported project file version: ${String(data.version)}. Expected one of ${SUPPORTED_SNAPSHOT_VERSIONS.join(", ")}.`,
    );
  }
  if (!data.state || typeof data.state !== "object") {
    throw new Error("Project file is missing state");
  }
  const app = useApp.getState();
  const currentId = app.currentProjectId;
  applyState(data.state);
  // Persist what the stores actually hold, not the raw file: applyState upgrades
  // older bucket shapes, and this keeps the stored copy in the current format.
  const migrated = snapshotCurrent();
  if (isSupabaseConfigured) {
    await upsertBucket(currentId, migrated);
  } else {
    writeBucket(currentId, migrated);
  }
  const importedProject = data.project;
  if (importedProject) {
    app.updateCurrentProject({
      name: importedProject.name,
      client: importedProject.client,
      status: importedProject.status,
    });
  }
  if (Array.isArray(data.revisions)) {
    app.setRevisionsForCurrent(data.revisions);
  }
}
