import { useDocs } from "@/modules/docs/store";
import { useInventory } from "@/modules/inventory/store";
import { useLedWall } from "@/modules/led-wall/store";
import { useRack } from "@/modules/rack-builder/store";
import { useSystem } from "@/modules/system-designer/store";
import { SYSTEM_EDGES, SYSTEM_NODES, WALL_LAYOUTS } from "@/lib/data";
import { DOC_TREE } from "@/lib/docs-tree";
import { ASSETS } from "@/lib/inventory-data";
import { DEFAULT_RACK } from "@/lib/rack-data";

export const BUCKETS_KEY = "blackburst:projects:v1";

interface StoreSpec {
  fields: readonly string[];
  defaults: Record<string, unknown>;
  store: {
    getState: () => Record<string, unknown>;
    setState: (s: Record<string, unknown>) => void;
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
    fields: ["assets", "cat", "selected", "view"],
    defaults: {
      assets: ASSETS,
      cat: "All gear",
      selected: "BMD-S40-001",
      view: "list",
    },
    store: useInventory as unknown as StoreSpec["store"],
  },
  docs: {
    fields: ["tree", "activeId", "expanded"],
    defaults: {
      tree: DOC_TREE,
      activeId: "d-prj-ros",
      expanded: ["d-prj", "d-spec", "d-sop"],
    },
    store: useDocs as unknown as StoreSpec["store"],
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

export function applyState(buckets: ProjectStateBuckets) {
  for (const [key, spec] of Object.entries(SPECS)) {
    const slice = { ...spec.defaults, ...(buckets[key] ?? {}) };
    spec.store.setState(slice);
  }
}

export function switchProject(fromId: string, toId: string) {
  if (fromId === toId) return;
  const all = loadAll();
  all[fromId] = snapshotCurrent();
  const next = all[toId] ?? defaultBucket();
  applyState(next);
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
