import { useEffect, useMemo, useState } from "react";
import { PANEL_LIBRARY } from "@/lib/data";
import { computeWallCalc } from "@/modules/led-wall/calculations";
import { useLedWall } from "@/modules/led-wall/store";
import { summarize, validateWall } from "@/modules/led-wall/validation";
import { useInventory } from "@/modules/inventory/store";
import { summarizeAssetIssues, validateAssets } from "@/modules/inventory/validation";
import { useApp } from "@/store/useApp";
import { useAuth } from "@/store/useAuth";
import { useCatalog } from "@/store/useCatalog";
import { useSaveStatus } from "@/store/useSaveStatus";

export function StatusBar() {
  const project = useApp((s) => s.project);
  const revisions = useApp((s) => s.revisions);
  const authConfigured = useAuth((s) => s.configured);
  // Viewers' edits are never written (RLS would deny them) — showing save
  // state would either error-spam or claim saves that don't happen.
  const viewOnly = authConfigured && project.role === "viewer";
  const walls = useLedWall((s) => s.walls);
  const layoutId = useLedWall((s) => s.layoutId);
  const inventoryAssets = useInventory((s) => s.assets);
  const inventoryShows = useInventory((s) => s.shows);
  const customPanels = useCatalog((s) => s.panel);
  const latest = revisions[0];
  const saveState = useSaveStatus((s) => s.state);
  const savedAt = useSaveStatus((s) => s.lastSavedAt);
  const saveError = useSaveStatus((s) => s.error);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tt = now.toTimeString().slice(0, 8);
  // Whole hours were assumed, so India rendered as "UTC+5.5". Minutes are only
  // shown where they're non-zero, keeping the common case two digits.
  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMin);
  const tzMinutes = absMin % 60;
  const tz = `UTC${sign}${String(Math.floor(absMin / 60)).padStart(2, "0")}${
    tzMinutes ? `:${String(tzMinutes).padStart(2, "0")}` : ""
  }`;

  // Memoized against the clock: this component re-renders every second, and
  // without these it re-ran the wall maths and validated the entire asset list
  // on each tick to produce the same answer.
  const wall = useMemo(() => {
    const layout = walls.find((l) => l.id === layoutId) ?? walls[0];
    const panel = PANEL_LIBRARY.find((p) => p.id === layout.panel) ?? PANEL_LIBRARY[0];
    return summarize(validateWall(layout, panel, computeWallCalc(layout, panel)));
    // customPanels is a dep because PANEL_LIBRARY is a live binding: editing the
    // catalog changes the panel this resolves to without touching `walls`.
  }, [walls, layoutId, customPanels]);
  const assets = useMemo(
    () => summarizeAssetIssues(validateAssets(inventoryAssets, inventoryShows)),
    [inventoryAssets, inventoryShows],
  );
  const errors = wall.errors + assets.errors;
  const warnings = wall.warnings + assets.warnings;
  const level: "ok" | "warn" | "error" =
    errors > 0 ? "error" : warnings > 0 ? "warn" : "ok";

  const saveLabel =
    saveState === "error"
      ? "SAVE FAILED"
      : saveState === "saving"
        ? "SAVING…"
        : saveState === "pending"
          ? "UNSAVED"
          : savedAt
            ? `SAVED ${new Date(savedAt).toTimeString().slice(0, 8)}`
            : "SAVED —";

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
      {viewOnly ? (
        <div className="seg" title="Your role on this project is viewer — edits stay in this window and are not saved">
          <span className="dot warn" /> VIEW ONLY
        </div>
      ) : (
        <div className="seg" title={saveError ?? undefined}>
          <span className={`dot ${saveState === "error" ? "error" : saveState === "saved" ? "ok" : ""}`} />{" "}
          {saveLabel}
        </div>
      )}
      <div className="seg">
        <span className={`dot ${level}`} /> {statusLabel}
      </div>
      <div className="spacer" />
      <div className="seg">{project.code}</div>
      <div className="seg">{tz}</div>
      <div className="seg" style={{ color: "var(--accent)" }}>
        {tt}
      </div>
    </footer>
  );
}
