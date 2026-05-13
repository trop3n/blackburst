import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentEntry {
  kind: "module" | "doc" | "asset" | "wall" | "node" | "rack-item";
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

export const useCmdkRecents = create<CmdkRecentsState>()(
  persist(
    (set, get) => ({
      recents: [],
      push: (entry) => {
        const ts = Date.now();
        const filtered = get().recents.filter(
          (r) => !(r.kind === entry.kind && r.id === entry.id),
        );
        set({ recents: [{ ...entry, ts }, ...filtered].slice(0, MAX_RECENTS) });
      },
      clear: () => set({ recents: [] }),
    }),
    { name: "blackburst:cmdk-recents:v1" },
  ),
);
