import { create } from "zustand";
import type { RefKind } from "@/lib/nav";

export interface RecentEntry {
  // Derived from RefKind rather than restated, so a new ref kind doesn't need a
  // matching edit here. Type-only import: nav.ts pulls in the module stores, and
  // this store is itself registered in SPECS.
  kind: RefKind | "module";
  id: string;
  label: string;
  sub: string;
  ts: number;
}

interface CmdkRecentsState {
  recents: RecentEntry[];
  push: (entry: Omit<RecentEntry, "ts">) => void;
  clear: () => void;
}

const MAX_RECENTS = 12;

export const useCmdkRecents = create<CmdkRecentsState>()((set, get) => ({
  recents: [],
  push: (entry) => {
    const ts = Date.now();
    const filtered = get().recents.filter(
      (r) => !(r.kind === entry.kind && r.id === entry.id),
    );
    set({ recents: [{ ...entry, ts }, ...filtered].slice(0, MAX_RECENTS) });
  },
  clear: () => set({ recents: [] }),
}));
