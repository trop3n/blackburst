import { useEffect } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Rail } from "@/components/shell/Rail";
import { StatusBar } from "@/components/shell/StatusBar";
import { Tabs } from "@/components/shell/Tabs";
import { Topbar } from "@/components/shell/Topbar";
import { DocsModule } from "@/modules/docs/DocsModule";
import { InventoryModule } from "@/modules/inventory/InventoryModule";
import { LedWallModule } from "@/modules/led-wall/LedWallModule";
import { RackBuilderModule } from "@/modules/rack-builder/RackBuilderModule";
import { SystemDesignerModule } from "@/modules/system-designer/SystemDesignerModule";
import { ACCENTS, useApp } from "@/store/useApp";
import { useCmdk } from "@/store/useCmdk";

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        useCmdk.getState().toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <Rail />
      <Topbar />
      {tweaks.shell === "tabs" && <Tabs />}
      <main className="main">
        {module === "wall" && <LedWallModule />}
        {module === "system" && <SystemDesignerModule />}
        {module === "rack" && <RackBuilderModule />}
        {module === "inv" && <InventoryModule />}
        {module === "docs" && <DocsModule />}
      </main>
      <StatusBar />
      <CommandPalette />
      <SettingsPanel />
    </div>
  );
}
