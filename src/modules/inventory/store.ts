import { create } from "zustand";
import { ASSETS, SHOWS } from "@/lib/inventory-data";
import type { Asset, AssetStatus, ShowSchedule } from "@/types";

export type InventoryView = "list" | "schedule";

interface InventoryState {
  assets: Asset[];
  shows: ShowSchedule[];
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
  addShow: (show: ShowSchedule) => void;
  updateShow: (id: string, patch: Partial<ShowSchedule>) => void;
  removeShow: (id: string) => void;
}

export const useInventory = create<InventoryState>()((set) => ({
      assets: ASSETS,
      shows: SHOWS,
      cat: "All gear",
      selected: "",
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
      addShow: (show) => set((s) => ({ shows: [...s.shows, show] })),
      updateShow: (id, patch) =>
        set((s) => ({
          shows: s.shows.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)),
        })),
      removeShow: (id) =>
        set((s) => ({ shows: s.shows.filter((sh) => sh.id !== id) })),
    }),
);
