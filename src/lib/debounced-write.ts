// Text inputs in the inspectors call their store's update action on every
// keystroke, which previously meant one server write per character. Local state
// stays immediate — only persistence is deferred.
//
// This is the same shape as the project bucket autosave in project-storage.ts,
// but per-record: it tracks which ids were touched so a flush writes exactly the
// rows that changed rather than the whole table.
const WRITE_DEBOUNCE_MS = 400;

export interface DebouncedFlush {
  schedule: (id: string) => void;
  cancel: (id: string) => void;
  flush: () => void;
}

const flushers: (() => void)[] = [];

export function createDebouncedFlush(
  write: (ids: string[]) => void,
  delayMs: number = WRITE_DEBOUNCE_MS,
): DebouncedFlush {
  const dirty = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    if (dirty.size === 0) return;
    const ids = [...dirty];
    dirty.clear();
    write(ids);
  }

  flushers.push(flush);

  return {
    schedule(id) {
      dirty.add(id);
      if (timer != null) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    // A record deleted while an edit is still pending must not be written back.
    cancel(id) {
      dirty.delete(id);
    },
    flush,
  };
}

// Without this a pending edit is lost when the tab closes or is backgrounded —
// exactly the case the debounce would otherwise introduce.
if (typeof window !== "undefined") {
  const flushAll = () => {
    for (const f of flushers) f();
  };
  window.addEventListener("pagehide", flushAll);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAll();
  });
}
