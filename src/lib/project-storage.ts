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
import { DEFAULT_RACKS } from "@/lib/rack-data";
import { isSupabaseConfigured } from "@/lib/supabase";
// Import cycle with useApp is benign: both sides only dereference the other
// inside function bodies at runtime, never during module evaluation.
import { useApp } from "@/store/useApp";
import { useSaveStatus } from "@/store/useSaveStatus";

export const BUCKETS_KEY = "blackburst:projects:v1";

// Autosave: the module stores no longer persist themselves, so the current
// project's bucket is written here on every change (debounced) and flushed on
// page hide. Without this, edits are only saved when switching projects.
let activeProjectId: string | null = null;
let applying = false;
let autosaveStarted = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 250;

// Dirtiness ledger for the pagehide/hidden flush: editSeq advances on every
// store change, savedSeq on every *confirmed* persist. Equal means nothing
// unconfirmed, so the flush can skip — the old unconditional flush re-upserted
// the whole bucket on every tab switch, each write waking every collaborator's
// realtime handler. Covers the fired-but-in-flight window too, which a plain
// saveTimer check would miss.
let editSeq = 0;
let savedSeq = 0;

// Drop a queued autosave without firing it. Load and teardown paths must call
// this: a timer that survives into delete/leave fires against a project row
// that no longer exists, surfacing as a spurious RLS save error.
export function cancelPendingSave() {
  if (saveTimer != null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

// A freshly loaded (or discarded) project starts clean: the ledger aligns and
// the status surface resets, so the status bar never describes the previous
// project's save state.
function markClean() {
  savedSeq = editSeq;
  useSaveStatus.getState().reset();
}

// A viewer's server writes are RLS-denied, so attempting them meant one doomed
// upsert per edit and a permanent error pill. Local edits stay local (exploring
// is harmless, and incoming realtime updates overwrite them); the status bar
// labels the situation as VIEW ONLY instead of reporting phantom saves.
function viewerActive(): boolean {
  return isSupabaseConfigured && useApp.getState().project.role === "viewer";
}

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
      selectedNodeId: "",
      view: "graph",
    },
    store: useSystem as unknown as StoreSpec["store"],
  },
  rack: {
    fields: ["racks", "rackId", "selectedIid", "filter"],
    defaults: {
      racks: DEFAULT_RACKS,
      rackId: DEFAULT_RACKS[0].id,
      selectedIid: null,
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
      selected: "",
      view: "list",
    },
    store: useInventory as unknown as StoreSpec["store"],
  },
  docs: {
    fields: ["tree", "activeId", "expanded", "recentIds", "bodies", "comments", "versions"],
    defaults: {
      tree: DOC_TREE,
      activeId: "d-overview",
      expanded: ["d-root"],
      recentIds: [],
      bodies: { "d-overview": "# Overview\n\nStart documenting this project here." },
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
      walls: [
        { id: "W1", name: "Wall 1", panel: "ROE-RB2.6", processor: "sx40", cols: 4, rows: 3, curve: 0, active: true },
      ],
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
      racks: [{ id: "R-001", name: "Rack 1", location: "", size: 42, items: [] }],
      rackId: "R-001",
      selectedIid: null,
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

// Upgrade older persisted shapes before they merge with defaults. Every load
// path funnels through applyState, so this is the one place a migration lives.
function migrateBucket(buckets: ProjectStateBuckets): ProjectStateBuckets {
  const rack = buckets.rack;
  if (!rack || Array.isArray(rack.racks)) return buckets;
  // Pre-multi-rack projects stored a single `items` array plus `rackSize`.
  const items = Array.isArray(rack.items) ? rack.items : [];
  const size = typeof rack.rackSize === "number" ? rack.rackSize : 42;
  return {
    ...buckets,
    rack: {
      racks: [{ id: "R-001", name: "Rack 1", location: "", size, items }],
      rackId: "R-001",
      selectedIid: rack.selectedIid ?? null,
      filter: rack.filter ?? "All",
    },
  };
}

// Shallow shape guard: an imported file or server row whose field type
// disagrees with its default (a string where an array belongs) used to crash
// the first render that mapped over it — and since the bucket was persisted
// before rendering, every reload crashed the same way. A null default carries
// no shape to check against (nullable selections), so those pass through;
// deep garbage inside a well-typed array is caught by ModuleErrorBoundary.
function conforms(value: unknown, fallback: unknown): boolean {
  if (fallback === null) return true;
  if (Array.isArray(fallback)) return Array.isArray(value);
  const t = typeof fallback;
  if (t === "object") return typeof value === "object" && value !== null && !Array.isArray(value);
  return typeof value === t;
}

export function applyState(buckets: ProjectStateBuckets) {
  applying = true;
  try {
    const migrated = migrateBucket(buckets);
    for (const [key, spec] of Object.entries(SPECS)) {
      const incoming = (migrated[key] ?? {}) as Record<string, unknown>;
      const defaults = spec.defaults as Record<string, unknown>;
      const slice: Record<string, unknown> = {};
      for (const f of spec.fields) {
        const v = incoming[f];
        slice[f] = f in incoming && conforms(v, defaults[f]) ? v : defaults[f];
      }
      spec.store.setState(slice);
    }
  } finally {
    applying = false;
  }
}

export async function switchProject(fromId: string, toId: string) {
  if (fromId === toId) return;
  cancelPendingSave();
  if (isSupabaseConfigured) {
    // Best-effort save-away: a transient error must never block navigating to
    // another project. Viewers skip it — the write would be RLS-denied anyway.
    if (!viewerActive()) await upsertBucket(fromId, snapshotCurrent()).catch(() => {});
    const bucket = await fetchBucket(toId);
    applyState(bucket ?? defaultBucket());
    activeProjectId = toId;
    markClean();
    subscribeToBucket(toId, applyRemote);
    return;
  }
  const all = loadAll();
  all[fromId] = snapshotCurrent();
  const next = all[toId] ?? defaultBucket();
  applyState(next);
  activeProjectId = toId;
  saveAll(all);
  markClean();
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

// Local-mode project delete: drop the removed project's bucket and load `nextId`
// into the live stores (mirrors switchProject's load, minus the save-away).
export function deleteProjectLocal(deletedId: string, nextId: string) {
  cancelPendingSave();
  const all = loadAll();
  delete all[deletedId];
  applyState(all[nextId] ?? defaultBucket());
  activeProjectId = nextId;
  saveAll(all);
  markClean();
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function persistActiveBucket() {
  if (activeProjectId == null) return;
  const status = useSaveStatus.getState();
  const seq = editSeq;
  if (isSupabaseConfigured) {
    // Still fire-and-forget so a viewer's RLS-denied write never blocks the UI,
    // but the outcome is now reported instead of swallowed.
    status.markSaving();
    void upsertBucket(activeProjectId, snapshotCurrent())
      .then(() => {
        savedSeq = Math.max(savedSeq, seq);
        useSaveStatus.getState().markSaved();
      })
      .catch((err: unknown) => useSaveStatus.getState().markError(messageOf(err)));
  } else {
    try {
      saveCurrentBucket(activeProjectId);
      savedSeq = Math.max(savedSeq, seq);
      status.markSaved();
    } catch (err) {
      status.markError(messageOf(err));
    }
  }
}

// Flush on pagehide / visibility→hidden — but only when the ledger says
// something is unconfirmed. The beacon's status is reported from its actual
// response: if the page dies first the promise never settles and nobody reads
// the status bar anyway; if the page survives (tab switch), the bar tells the
// truth instead of asserting "saved" for a write whose outcome was unknown.
function flushSave() {
  cancelPendingSave();
  if (activeProjectId == null || editSeq === savedSeq) return;
  const seq = editSeq;
  if (isSupabaseConfigured) {
    useSaveStatus.getState().markSaving();
    beaconUpsertBucket(activeProjectId, snapshotCurrent())
      .then(() => {
        savedSeq = Math.max(savedSeq, seq);
        useSaveStatus.getState().markSaved();
      })
      .catch((err: unknown) => useSaveStatus.getState().markError(messageOf(err)));
  } else {
    try {
      saveCurrentBucket(activeProjectId);
      savedSeq = Math.max(savedSeq, seq);
      useSaveStatus.getState().markSaved();
    } catch (err) {
      useSaveStatus.getState().markError(messageOf(err));
    }
  }
}

function scheduleSave() {
  if (applying || activeProjectId == null || viewerActive()) return;
  editSeq++;
  useSaveStatus.getState().markPending();
  if (saveTimer != null) clearTimeout(saveTimer);
  // Null the handle when it fires so applyRemote (which skips while a save is
  // pending) resumes applying collaborator updates once editing settles.
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persistActiveBucket();
  }, SAVE_DEBOUNCE_MS);
}

// A collaborator's saved bucket. Skip while we're mid-apply or have local
// unsaved edits pending so a remote write never clobbers in-progress work. The
// docs editor counts as pending too: its draft isn't in the store, so a save
// isn't queued, but applyState would reset the active doc and drop it. Like the
// pending-save case, the update is dropped rather than deferred — the next
// collaborator write re-delivers it.
function applyRemote(data: ProjectStateBuckets) {
  if (applying || saveTimer != null || useDocs.getState().editorDirty) return;
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
  markClean();
  startAutosave();
}

export async function initProjectStateFromServer(projectId: string) {
  // Delete/leave land here with the doomed project possibly still holding a
  // queued autosave; callers cancel before their server call, and this covers
  // any path that doesn't.
  cancelPendingSave();
  const bucket = await fetchBucket(projectId);
  applyState(bucket ?? defaultBucket());
  activeProjectId = projectId;
  markClean();
  startAutosave();
  subscribeToBucket(projectId, applyRemote);
}

export function clearActiveProject() {
  cancelPendingSave();
  activeProjectId = null;
  markClean();
  unsubscribeBucket();
}
