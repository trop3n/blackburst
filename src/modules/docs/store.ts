import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DocsState {
  activeId: string;
  expanded: string[];
  setActive: (id: string) => void;
  toggle: (id: string) => void;
}

export const useDocs = create<DocsState>()(
  persist(
    (set, get) => ({
      activeId: "d-prj-ros",
      expanded: ["d-prj", "d-spec", "d-sop"],
      setActive: (activeId) => set({ activeId }),
      toggle: (id) => {
        const cur = get().expanded;
        set({
          expanded: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        });
      },
    }),
    { name: "blackburst:docs:v1" },
  ),
);
