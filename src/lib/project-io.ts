import {
  applyState,
  snapshotCurrent,
  writeBucket,
  type ProjectStateBuckets,
} from "@/lib/project-storage";
import { useApp, type Revision } from "@/store/useApp";
import type { Project } from "@/types";

export interface ProjectSnapshot {
  format: "blackburst-project";
  version: 2;
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
    version: 2,
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
  a.download = `Blackburst-${snap.project.id}-${todayStamp()}.json`;
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
  if (!data.state || typeof data.state !== "object") {
    throw new Error("Project file is missing state");
  }
  const app = useApp.getState();
  const currentId = app.currentProjectId;
  applyState(data.state);
  writeBucket(currentId, data.state);
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
