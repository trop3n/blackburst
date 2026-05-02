import type { Panel, WallLayout } from "@/types";
import type { WallCalc } from "./calculations";

export type IssueLevel = "warn" | "error";
export type IssueCategory = "processor" | "power" | "rigging" | "data" | "aspect";

export interface WallIssue {
  id: string;
  level: IssueLevel;
  category: IssueCategory;
  title: string;
  detail: string;
}

export const PROC_PIXEL_CAPACITY = 8_800_000;
export const DISTRO_CAPACITY_W = 144_000;
export const DATA_LINK_CAPACITY_GBPS = 20;
export const TRUSS_SWL_KG = 600;
export const RIG_POINTS = 6;
export const RIG_OVERHEAD = 0.15;
export const NEAR_THRESHOLD = 0.85;

export interface IssueSummary {
  errors: number;
  warnings: number;
  level: "ok" | "warn" | "error";
}

export function summarize(issues: WallIssue[]): IssueSummary {
  let errors = 0;
  let warnings = 0;
  for (const i of issues) {
    if (i.level === "error") errors++;
    else warnings++;
  }
  const level = errors > 0 ? "error" : warnings > 0 ? "warn" : "ok";
  return { errors, warnings, level };
}

export function validateWall(
  _layout: WallLayout,
  _panel: Panel,
  calc: WallCalc,
): WallIssue[] {
  const issues: WallIssue[] = [];

  const procCapacity = calc.procsNeeded * PROC_PIXEL_CAPACITY;
  const procPct = calc.totalPixels / procCapacity;
  if (procPct > 1) {
    issues.push({
      id: "proc-over",
      level: "error",
      category: "processor",
      title: "Processor capacity exceeded",
      detail: `${calc.totalPixels.toLocaleString()} px > ${procCapacity.toLocaleString()} px (${calc.procsNeeded} × SX40). Add a processor.`,
    });
  } else if (procPct > NEAR_THRESHOLD) {
    issues.push({
      id: "proc-near",
      level: "warn",
      category: "processor",
      title: "Processor near capacity",
      detail: `${(procPct * 100).toFixed(0)}% of ${calc.procsNeeded} × SX40 budget — margin under 15%.`,
    });
  }

  const powerPct = calc.totalWatts / DISTRO_CAPACITY_W;
  if (powerPct > 1) {
    issues.push({
      id: "power-over",
      level: "error",
      category: "power",
      title: "Distro capacity exceeded",
      detail: `${(calc.totalWatts / 1000).toFixed(1)} kW > 144 kW available. Upsize service or split feeds.`,
    });
  } else if (powerPct > NEAR_THRESHOLD) {
    issues.push({
      id: "power-near",
      level: "warn",
      category: "power",
      title: "Distro near capacity",
      detail: `${(powerPct * 100).toFixed(0)}% of 144 kVA — keep 15% headroom for inrush.`,
    });
  }

  const rigTotal = calc.totalWeight * (1 + RIG_OVERHEAD);
  const perPoint = rigTotal / RIG_POINTS;
  if (perPoint > TRUSS_SWL_KG) {
    issues.push({
      id: "rig-over",
      level: "error",
      category: "rigging",
      title: "Per-point load exceeds SWL",
      detail: `${perPoint.toFixed(0)} kg/pt > ${TRUSS_SWL_KG} kg SWL. Add pickup points or move to ground support.`,
    });
  } else if (perPoint > TRUSS_SWL_KG * NEAR_THRESHOLD) {
    issues.push({
      id: "rig-near",
      level: "warn",
      category: "rigging",
      title: "Per-point load near SWL",
      detail: `${perPoint.toFixed(0)} kg/pt vs ${TRUSS_SWL_KG} kg SWL — margin under 15%.`,
    });
  }

  const dataRate = (calc.resW * calc.resH * 60 * 30) / 1e9;
  if (dataRate > DATA_LINK_CAPACITY_GBPS) {
    issues.push({
      id: "data-over",
      level: "error",
      category: "data",
      title: "Data rate exceeds 2 × 10GbE",
      detail: `${dataRate.toFixed(1)} Gbps > 20 Gbps. Drop to 4:2:2 / 30 Hz or add a link.`,
    });
  } else if (dataRate > DATA_LINK_CAPACITY_GBPS * NEAR_THRESHOLD) {
    issues.push({
      id: "data-near",
      level: "warn",
      category: "data",
      title: "Data rate near link capacity",
      detail: `${dataRate.toFixed(1)} Gbps used · ${(DATA_LINK_CAPACITY_GBPS - dataRate).toFixed(1)} Gbps headroom.`,
    });
  }

  if (calc.aspectRatio < 0.5 || calc.aspectRatio > 4) {
    issues.push({
      id: "aspect-extreme",
      level: "warn",
      category: "aspect",
      title: "Unusual aspect ratio",
      detail: `${calc.aspectRatio.toFixed(2)}:1 — confirm content workflow supports this.`,
    });
  }

  return issues;
}
