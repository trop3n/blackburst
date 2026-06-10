import { useEffect } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { CommandPalette } from "@/components/CommandPalette";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SharePanel } from "@/components/SharePanel";
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
import { useAuth } from "@/store/useAuth";
import { useCmdk } from "@/store/useCmdk";

export default function App() {
  const module = useApp((s) => s.module);
  const tweaks = useApp((s) => s.tweaks);
  const ready = useApp((s) => s.ready);
  const authConfigured = useAuth((s) => s.configured);
  const authStatus = useAuth((s) => s.status);

  useEffect(() => {
    useAuth.getState().init();
  }, []);

  useEffect(() => {
    if (!authConfigured) return;
    if (authStatus === "signed-in" && !ready) {
      void useApp.getState().bootstrap();
    } else if (authStatus === "signed-out" && ready) {
      useApp.getState().resetSession();
    }
  }, [authConfigured, authStatus, ready]);

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

  // Auth gate. When Supabase isn't configured the app runs locally as before;
  // once configured, sign-in is required and project state loads from the server.
  if (authConfigured) {
    if (authStatus === "loading") {
      return <div className="boot-splash">Blackburst</div>;
    }
    if (authStatus === "signed-out") {
      return <AuthScreen />;
    }
    if (!ready) {
      return <div className="boot-splash">Loading workspace…</div>;
    }
  }

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
      <SharePanel />
    </div>
  );
}
