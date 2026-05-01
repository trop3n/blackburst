import { useEffect } from "react";
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
        {module === "system" && <SystemDesignerModule />}
        {module === "rack" && <RackBuilderModule />}
        {module === "inv" && <InventoryModule />}
        {module === "docs" && <DocsModule />}
      </main>
      <StatusBar />
    </div>
  );
}
