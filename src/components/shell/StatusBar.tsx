import { useEffect, useState } from "react";
import { PANEL_LIBRARY, WALL_LAYOUTS } from "@/lib/data";
import { ASSETS, SHOWS } from "@/lib/inventory-data";
import { computeWallCalc } from "@/modules/led-wall/calculations";
import { useLedWall } from "@/modules/led-wall/store";
import { summarize, validateWall } from "@/modules/led-wall/validation";
import { summarizeAssetIssues, validateAssets } from "@/modules/inventory/validation";
import { useApp } from "@/store/useApp";

export function StatusBar() {
  const project = useApp((s) => s.project);
  const revisions = useApp((s) => s.revisions);
  const layoutId = useLedWall((s) => s.layoutId);
  const latest = revisions[0];
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tt = now.toTimeString().slice(0, 8);
  const offsetHours = -now.getTimezoneOffset() / 60;
  const sign = offsetHours >= 0 ? "+" : "-";
  const tz = `UTC${sign}${String(Math.abs(offsetHours)).padStart(2, "0")}`;

  const layout = WALL_LAYOUTS.find((l) => l.id === layoutId) ?? WALL_LAYOUTS[0];
  const panel = PANEL_LIBRARY.find((p) => p.id === layout.panel) ?? PANEL_LIBRARY[0];
  const calc = computeWallCalc(layout, panel);
  const wall = summarize(validateWall(layout, panel, calc));
  const assets = summarizeAssetIssues(validateAssets(ASSETS, SHOWS));
  const errors = wall.errors + assets.errors;
  const warnings = wall.warnings + assets.warnings;
  const level: "ok" | "warn" | "error" =
    errors > 0 ? "error" : warnings > 0 ? "warn" : "ok";

  const statusLabel =
    level === "error"
      ? `${errors} ERROR${errors === 1 ? "" : "S"}${warnings > 0 ? ` · ${warnings} WARN` : ""}`
      : level === "warn"
        ? `${warnings} WARNING${warnings === 1 ? "" : "S"}`
        : "ALL CHECKS OK";

  return (
    <footer className="statusbar">
      <div className="seg">
        <span className="dot" /> READY
      </div>
      <div className="seg">REV {String(latest?.n ?? 0).padStart(4, "0")}</div>
      <div className="seg">SAVED {latest ? new Date(latest.at).toTimeString().slice(0, 8) : "—"}</div>
      <div className="seg">
        <span className={`dot ${level}`} /> {statusLabel}
      </div>
      <div className="spacer" />
      <div className="seg">{project.id}</div>
      <div className="seg">{tz}</div>
      <div className="seg" style={{ color: "var(--accent)" }}>
        {tt}
      </div>
    </footer>
  );
}
