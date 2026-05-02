import { useDocs } from "@/modules/docs/store";
import { useInventory } from "@/modules/inventory/store";
import { useLedWall } from "@/modules/led-wall/store";
import { useRack } from "@/modules/rack-builder/store";
import { useSystem } from "@/modules/system-designer/store";
import { useApp } from "@/store/useApp";

const STORE_KEYS = [
  "blackburst:app:v1",
  "blackburst:led-wall:v1",
  "blackburst:system:v1",
  "blackburst:rack:v1",
  "blackburst:inventory:v1",
  "blackburst:docs:v1",
] as const;

type StoreKey = typeof STORE_KEYS[number];

const STORES: Record<StoreKey, { getState: () => unknown }> = {
  "blackburst:app:v1": useApp,
  "blackburst:led-wall:v1": useLedWall,
  "blackburst:system:v1": useSystem,
  "blackburst:rack:v1": useRack,
  "blackburst:inventory:v1": useInventory,
  "blackburst:docs:v1": useDocs,
};

export interface ProjectSnapshot {
  format: "blackburst-project";
  version: 1;
  exportedAt: string;
  project: { id: string; name: string; client: string; status: string };
  stores: Record<string, { state: unknown; version: number }>;
}

function snapshot(): ProjectSnapshot {
  const stores: ProjectSnapshot["stores"] = {};
  for (const key of STORE_KEYS) {
    stores[key] = { state: STORES[key].getState(), version: 0 };
  }
  return {
    format: "blackburst-project",
    version: 1,
    exportedAt: new Date().toISOString(),
    project: useApp.getState().project,
    stores,
  };
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function exportProject() {
  const snap = snapshot();
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
  const data = JSON.parse(text) as ProjectSnapshot;
  if (data.format !== "blackburst-project") {
    throw new Error("Not a Blackburst project file");
  }
  for (const [key, value] of Object.entries(data.stores)) {
    if (STORE_KEYS.includes(key as typeof STORE_KEYS[number])) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
  // Reload so persist middleware re-hydrates from the new localStorage values.
  window.location.reload();
}

