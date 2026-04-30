import { useEffect } from "react";
import { Rail } from "@/components/shell/Rail";
import { StatusBar } from "@/components/shell/StatusBar";
import { Tabs } from "@/components/shell/Tabs";
import { Topbar } from "@/components/shell/Topbar";
import { LedWallModule } from "@/modules/led-wall/LedWallModule";
import { ACCENTS, useApp } from "@/store/useApp";

function ModulePlaceholder({ name }: { name: string }) {
  return (
    <div className="empty" style={{ gridColumn: "1 / -1" }}>
      <span className="mono" style={{ fontSize: 14, color: "var(--color-fg-mute)" }}>
        {name}
      </span>
      <span className="mono" style={{ fontSize: 11 }}>
        Module pending implementation
      </span>
    </div>
  );
}

export default function App() {
  const module = useApp((s) => s.module);
  const tweaks = useApp((s) => s.tweaks);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = tweaks.density;
    root.dataset.shell = tweaks.shell;
    const a = ACCENTS[tweaks.accent] ?? ACCENTS["acid-green"];
    root.style.setProperty("--accent", a.c);
    root.style.setProperty("--accent-dim", a.dim);
    root.style.setProperty("--accent-faint", a.faint);
  }, [tweaks]);

  return (
    <div className="app">
      <Rail />
      <Topbar />
      {tweaks.shell === "tabs" && <Tabs />}
      <main className="main">
        {module === "wall" && <LedWallModule />}
        {module === "system" && <ModulePlaceholder name="System Designer" />}
        {module === "rack" && <ModulePlaceholder name="Rack Builder" />}
        {module === "inv" && <ModulePlaceholder name="Asset & Inventory" />}
        {module === "docs" && <ModulePlaceholder name="Documentation Hub" />}
      </main>
      <StatusBar />
    </div>
  );
}
