// RFC 4180 quoting: wrap in quotes when the value contains a delimiter, quote or
// newline, and double any embedded quotes. Model names carry commas often enough
// (e.g. "BMD 2110 IP Converter 3x3G, SFP") that this can't be skipped.
//
// Quoting does NOT stop Excel/Sheets from evaluating a leading = + - @ (or tab/
// CR) as a formula. Exported cells carry collaborator-supplied text — device
// models, serials, entry summaries — which must never execute on the machine
// that opens the file, so string cells get the standard apostrophe prefix
// (Excel reads it as a text marker and hides it). Numbers are exempt so
// negative readouts stay numeric.
function cell(value: string | number): string {
  const s = String(value ?? "");
  const guarded = typeof value === "string" && /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  // The BOM makes Excel read UTF-8 correctly — model names contain × and ϕ.
  const blob = new Blob(["﻿", toCsv(headers, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
