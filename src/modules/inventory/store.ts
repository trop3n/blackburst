import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ASSETS } from "@/lib/inventory-data";
import type { Asset, AssetStatus } from "@/types";

export type InventoryView = "list" | "schedule";

interface InventoryState {
  assets: Asset[];
  cat: string;
  selected: string;
  view: InventoryView;
  setCat: (cat: string) => void;
  setSelected: (id: string) => void;
  setView: (v: InventoryView) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  setAssetStatus: (id: string, status: AssetStatus, opts?: { show?: string; due?: string }) => void;
  checkIn: (id: string) => void;
  checkOut: (id: string, show: string, due: string) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;
}

export const useInventory = create<InventoryState>()(
  persist(
    (set) => ({
      assets: ASSETS,
      cat: "All gear",
      selected: "BMD-S40-001",
      view: "list",
      setCat: (cat) => set({ cat }),
      setSelected: (selected) => set({ selected }),
      setView: (view) => set({ view }),
      updateAsset: (id, patch) =>
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      setAssetStatus: (id, status, opts) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  ...(opts?.show !== undefined ? { show: opts.show } : {}),
                  ...(opts?.due !== undefined ? { due: opts.due } : {}),
                }
              : a,
          ),
        })),
      checkIn: (id) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, status: "in", show: "—", due: "—" } : a,
          ),
        })),
      checkOut: (id, show, due) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, status: "out", show, due } : a,
          ),
        })),
      addAsset: (asset) =>
        set((s) =>
          s.assets.some((a) => a.id === asset.id)
            ? s
            : { assets: [...s.assets, asset] },
        ),
      removeAsset: (id) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
        })),
    }),
    { name: "blackburst:inventory:v2" },
  ),
);
