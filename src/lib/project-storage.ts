import { useDocs } from "@/modules/docs/store";
import { useInventory } from "@/modules/inventory/store";
import { useLedWall } from "@/modules/led-wall/store";
import { useRack } from "@/modules/rack-builder/store";
import { useSystem } from "@/modules/system-designer/store";
import { useCmdkRecents } from "@/store/useCmdkRecents";
import { SYSTEM_EDGES, SYSTEM_NODES, WALL_LAYOUTS } from "@/lib/data";
import { INITIAL_COMMENTS } from "@/lib/docs-comments";
import { DOC_TREE } from "@/lib/docs-tree";
import { INITIAL_VERSIONS } from "@/lib/docs-versions";
import { ASSETS, SHOWS } from "@/lib/inventory-data";
import {
  beaconUpsertBucket,
  fetchBucket,
  subscribeToBucket,
  unsubscribeBucket,
  upsertBucket,
} from "@/lib/project-remote";
import { DEFAULT_RACK } from "@/lib/rack-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export const BUCKETS_KEY = "blackburst:projects:v1";

// Autosave: the module stores no longer persist themselves, so the current
// project's bucket is written here on every change (debounced) and flushed on
// page hide. Without this, edits are only saved when switching projects.
let activeProjectId: string | null = null;
let applying = false;
let autosaveStarted = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 250;

interface StoreSpec {
  fields: readonly string[];
  defaults: Record<string, unknown>;
  store: {
    getState: () => Record<string, unknown>;
    setState: (s: Record<string, unknown>) => void;
    subscribe: (
      listener: (state: Record<string, unknown>, prev: Record<string, unknown>) => void,
    ) => () => void;
  };
}

const SPECS = {
  "led-wall": {
    fields: ["walls", "layoutId", "selected", "tool", "zoom", "showDims", "showFaults", "tab"],
    defaults: {
      walls: WALL_LAYOUTS,
      layoutId: "W1",
      selected: null,
      tool: "select",
      zoom: 100,
      showDims: true,
      showFaults: true,
      tab: "wall",
    },
    store: useLedWall as unknown as StoreSpec["store"],
  },
  system: {
    fields: ["nodes", "edges", "lanes", "selectedNodeId", "view"],
    defaults: {
      nodes: SYSTEM_NODES,
      edges: SYSTEM_EDGES,
      lanes: { video: true, audio: true, network: true, power: true },
      selectedNodeId: "n4",
      view: "graph",
    },
    store: useSystem as unknown as StoreSpec["store"],
  },
  rack: {
    fields: ["items", "selectedIid", "rackSize", "filter"],
    defaults: {
      items: DEFAULT_RACK,
      selectedIid: 13,
      rackSize: 42,
      filter: "All",
    },
    store: useRack as unknown as StoreSpec["store"],
  },
  inv: {
    fields: ["assets", "shows", "cat", "selected", "view"],
    defaults: {
      assets: ASSETS,
      shows: SHOWS,
      cat: "All gear",
      selected: "BMD-S40-001",
      view: "list",
    },
    store: useInventory as unknown as StoreSpec["store"],
  },
  docs: {
    fields: ["tree", "activeId", "expanded", "recentIds", "bodies", "comments", "versions"],
    defaults: {
      tree: DOC_TREE,
      activeId: "d-prj-ros",
      expanded: ["d-prj", "d-spec", "d-sop"],
      recentIds: [],
      bodies: {},
      comments: INITIAL_COMMENTS,
      versions: INITIAL_VERSIONS,
    },
    store: useDocs as unknown as StoreSpec["store"],
  },
  cmdkRecents: {
    fields: ["recents"],
    defaults: {
      recents: [],
    },
    store: useCmdkRecents as unknown as StoreSpec["store"],
  },
} as const satisfies Record<string, StoreSpec>;

export type ProjectStateBuckets = Record<string, Record<string, unknown>>;
type AllBuckets = Record<string, ProjectStateBuckets>;

function loadAll(): AllBuckets {
  try {
    const raw = localStorage.getItem(BUCKETS_KEY);
    return raw ? (JSON.parse(raw) as AllBuckets) : {};
  } catch {
    return {};
  }
}

function saveAll(b: AllBuckets) {
  localStorage.setItem(BUCKETS_KEY, JSON.stringify(b));
}

export function snapshotCurrent(): ProjectStateBuckets {
  const out: ProjectStateBuckets = {};
  for (const [key, spec] of Object.entries(SPECS)) {
    const state = spec.store.getState();
    const slice: Record<string, unknown> = {};
    for (const f of spec.fields) slice[f] = state[f];
    out[key] = slice;
  }
  return out;
}

function defaultBucket(): ProjectStateBuckets {
  const out: ProjectStateBuckets = {};
  for (const [key, spec] of Object.entries(SPECS)) {
    out[key] = { ...spec.defaults };
  }
  return out;
}

// Starting state for a brand-new project: a clean canvas, not the demo seed.
// Each module gets enough to avoid its empty-state gaps (one wall so the LED
// builder has an active layout; a root folder + doc so the docs tree is usable)
// while everything else starts empty for real data entry.
export function scaffoldBucket(): ProjectStateBuckets {
  return {
    "led-wall": {
      walls: [{ id: "W1", name: "Wall 1", panel: "ROE-RB2.6", cols: 4, rows: 3, curve: 0, active: true }],
      layoutId: "W1",
      selected: null,
      tool: "select",
      zoom: 100,
      showDims: true,
      showFaults: true,
      tab: "wall",
    },
    system: {
      nodes: [],
      edges: [],
      lanes: { video: true, audio: true, network: true, power: true },
      selectedNodeId: "",
      view: "graph",
    },
    rack: {
      items: [],
      selectedIid: null,
      rackSize: 42,
      filter: "All",
    },
    inv: {
      assets: [],
      shows: [],
      cat: "All gear",
      selected: "",
      view: "list",
    },
    docs: {
      tree: [
        {
          id: "d-root",
          name: "Documents",
          kind: "folder",
          children: [{ id: "d-overview", name: "Overview", kind: "doc" }],
        },
      ],
      activeId: "d-overview",
      expanded: ["d-root"],
      recentIds: [],
      bodies: { "d-overview": "# Overview\n\nStart documenting this project here." },
      comments: {},
      versions: {},
    },
    cmdkRecents: {
      recents: [],
    },
  };
}

export function applyState(buckets: ProjectStateBuckets) {
  applying = true;
  try {
    for (const [key, spec] of Object.entries(SPECS)) {
      const slice = { ...spec.defaults, ...(buckets[key] ?? {}) };
      spec.store.setState(slice);
    }
  } finally {
    applying = false;
  }
}

export async function switchProject(fromId: string, toId: string) {
  if (fromId === toId) return;
  if (saveTimer != null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (isSupabaseConfigured) {
    await upsertBucket(fromId, snapshotCurrent());
    const bucket = await fetchBucket(toId);
    applyState(bucket ?? defaultBucket());
    activeProjectId = toId;
    subscribeToBucket(toId, applyRemote);
    return;
  }
  const all = loadAll();
  all[fromId] = snapshotCurrent();
  const next = all[toId] ?? defaultBucket();
  applyState(next);
  activeProjectId = toId;
  saveAll(all);
}

export function saveCurrentBucket(projectId: string) {
  const all = loadAll();
  all[projectId] = snapshotCurrent();
  saveAll(all);
}

export function writeBucket(projectId: string, buckets: ProjectStateBuckets) {
  const all = loadAll();
  all[projectId] = buckets;
  saveAll(all);
}

function persistActiveBucket() {
  if (activeProjectId == null) return;
  if (isSupabaseConfigured) {
    // Swallow rejects (e.g. a viewer's RLS-denied write) so autosave stays quiet.
    void upsertBucket(activeProjectId, snapshotCurrent()).catch(() => {});
  } else {
    saveCurrentBucket(activeProjectId);
  }
}

function flushSave() {
  if (saveTimer != null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (activeProjectId == null) return;
  if (isSupabaseConfigured) {
    beaconUpsertBucket(activeProjectId, snapshotCurrent());
  } else {
    saveCurrentBucket(activeProjectId);
  }
}

function scheduleSave() {
  if (applying || activeProjectId == null) return;
  if (saveTimer != null) clearTimeout(saveTimer);
  saveTimer = setTimeout(persistActiveBucket, SAVE_DEBOUNCE_MS);
}

// A collaborator's saved bucket. Skip while we're mid-apply or have local
// unsaved edits pending so a remote write never clobbers in-progress work.
function applyRemote(data: ProjectStateBuckets) {
  if (applying || saveTimer != null) return;
  applyState(data);
}

function startAutosave() {
  if (autosaveStarted) return;
  autosaveStarted = true;
  for (const spec of Object.values(SPECS)) spec.store.subscribe(scheduleSave);
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flushSave);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushSave();
    });
  }
}

export function initProjectState(projectId: string) {
  const all = loadAll();
  const buckets = all[projectId] ?? defaultBucket();
  applyState(buckets);
  activeProjectId = projectId;
  startAutosave();
}

export async function initProjectStateFromServer(projectId: string) {
  const bucket = await fetchBucket(projectId);
  applyState(bucket ?? defaultBucket());
  activeProjectId = projectId;
  startAutosave();
  subscribeToBucket(projectId, applyRemote);
}

export function clearActiveProject() {
  if (saveTimer != null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  activeProjectId = null;
  unsubscribeBucket();
}
