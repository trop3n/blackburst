import type { Panel, WallLayout } from "@/types";

export interface WallCalc {
  totalPanels: number;
  totalWeight: number;
  totalWatts: number;
  wallWmm: number;
  wallHmm: number;
  wallWft: number;
  wallHft: number;
  resW: number;
  resH: number;
  totalPixels: number;
  aspectRatio: number;
  procsNeeded: number;
  proc1Pct: number;
  proc2Pct: number;
  circuitsNeeded: number;
  btuPerHr: number;
}

const PROC_CAPACITY = 8_800_000; // Brompton SX40

export function computeWallCalc(layout: WallLayout, panel: Panel): WallCalc {
  const totalPanels = layout.cols * layout.rows;
  const totalWeight = totalPanels * panel.weight;
  const totalWatts = totalPanels * panel.watts;
  const wallWmm = layout.cols * panel.w;
  const wallHmm = layout.rows * panel.h;
  const wallWft = wallWmm / 304.8;
  const wallHft = wallHmm / 304.8;
  const resW = Math.round(wallWmm / panel.pitch);
  const resH = Math.round(wallHmm / panel.pitch);
  const totalPixels = resW * resH;
  const aspectRatio = resW / resH;
  const procsNeeded = Math.max(1, Math.ceil(totalPixels / PROC_CAPACITY));
  const proc1Pct = Math.round((Math.min(PROC_CAPACITY, totalPixels) / PROC_CAPACITY) * 100);
  const proc2Pct = Math.round((Math.max(0, totalPixels - PROC_CAPACITY) / PROC_CAPACITY) * 100);
  const circuitsNeeded = Math.ceil(totalWatts / 2400);
  const btuPerHr = Math.round(totalWatts * 3.412);

  return {
    totalPanels,
    totalWeight,
    totalWatts,
    wallWmm,
    wallHmm,
    wallWft,
    wallHft,
    resW,
    resH,
    totalPixels,
    aspectRatio,
    procsNeeded,
    proc1Pct,
    proc2Pct,
    circuitsNeeded,
    btuPerHr,
  };
}

export const PROC_PIXEL_CAPACITY = PROC_CAPACITY;
