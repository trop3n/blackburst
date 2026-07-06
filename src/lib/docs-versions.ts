import type { DocVersion } from "@/types";

export const INITIAL_VERSIONS: Record<string, DocVersion[]> = {};

export function bumpVersion(prev: string | undefined): string {
  if (!prev) return "v1.0";
  const stripped = prev.replace(/^v/i, "");
  const parts = stripped.split(".");
  if (parts.length === 0) return "v1.0";
  const last = parseInt(parts[parts.length - 1], 10);
  if (Number.isNaN(last)) return "v1.0";
  parts[parts.length - 1] = String(last + 1);
  return "v" + parts.join(".");
}

export function nowStamp(d: Date = new Date()): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hh}:${mm}`;
}
