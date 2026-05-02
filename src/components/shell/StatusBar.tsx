import { useEffect, useState } from "react";
import { useApp } from "@/store/useApp";

export function StatusBar() {
  const project = useApp((s) => s.project);
  const revisions = useApp((s) => s.revisions);
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

  return (
    <footer className="statusbar">
      <div className="seg">
        <span className="dot" /> READY
      </div>
      <div className="seg">REV {String(latest?.n ?? 0).padStart(4, "0")}</div>
      <div className="seg">SAVED {latest ? new Date(latest.at).toTimeString().slice(0, 8) : "—"}</div>
      <div className="seg">
        <span className="dot warn" /> 2 WARNINGS
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
