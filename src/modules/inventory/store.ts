import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InventoryView = "list" | "schedule";

interface InventoryState {
  cat: string;
  selected: string;
  view: InventoryView;
  setCat: (cat: string) => void;
  setSelected: (id: string) => void;
  setView: (v: InventoryView) => void;
}

export const useInventory = create<InventoryState>()(
  persist(
    (set) => ({
      cat: "All gear",
      selected: "BMD-S40-001",
      view: "list",
      setCat: (cat) => set({ cat }),
      setSelected: (selected) => set({ selected }),
      setView: (view) => set({ view }),
    }),
    { name: "blackburst:inventory:v1" },
  ),
);
