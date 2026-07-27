import { processorById } from "@/lib/led-processor-data";
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
  procName: string;
  procCapacity: number;
  procsNeeded: number;
  proc1Pct: number;
  proc2Pct: number;
  circuitsNeeded: number;
  btuPerHr: number;
}

export function computeWallCalc(layout: WallLayout, panel: Panel): WallCalc {
  const totalPanels = layout.cols * layout.rows;
  const totalWeight = totalPanels * panel.weight;
  const totalWatts = totalPanels * panel.watts;
  const wallWmm = layout.cols * panel.w;
  const wallHmm = layout.rows * panel.h;
  const wallWft = wallWmm / 304.8;
  const wallHft = wallHmm / 304.8;
  const resW = layout.cols * panel.pxW;
  const resH = layout.rows * panel.pxH;
  const totalPixels = resW * resH;
  const aspectRatio = resH === 0 ? 0 : resW / resH;

  const proc = processorById(layout.processor);
  const procsNeeded = Math.max(1, Math.ceil(totalPixels / proc.pixelCapacity));
  const proc1Pct = Math.round((Math.min(proc.pixelCapacity, totalPixels) / proc.pixelCapacity) * 100);
  const proc2Pct = Math.round(
    (Math.max(0, totalPixels - proc.pixelCapacity) / proc.pixelCapacity) * 100,
  );

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
    procName: proc.name,
    procCapacity: proc.pixelCapacity,
    procsNeeded,
    proc1Pct,
    proc2Pct,
    circuitsNeeded,
    btuPerHr,
  };
}
