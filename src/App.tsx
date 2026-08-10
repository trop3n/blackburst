import { useEffect } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { CommandPalette } from "@/components/CommandPalette";
import { DialogHost } from "@/components/DialogHost";
import { WorkspaceErrorBoundary } from "@/components/WorkspaceErrorBoundary";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SharePanel } from "@/components/SharePanel";
import { Rail } from "@/components/shell/Rail";
import { StatusBar } from "@/components/shell/StatusBar";
import { Tabs } from "@/components/shell/Tabs";
import { Topbar } from "@/components/shell/Topbar";
import { DocsModule } from "@/modules/docs/DocsModule";
import { InventoryModule } from "@/modules/inventory/InventoryModule";
import { LedWallModule } from "@/modules/led-wall/LedWallModule";
import { MaintenanceModule } from "@/modules/maintenance/MaintenanceModule";
import { RackBuilderModule } from "@/modules/rack-builder/RackBuilderModule";
import { SystemDesignerModule } from "@/modules/system-designer/SystemDesignerModule";
import { ACCENTS, useApp } from "@/store/useApp";
import { useAuth } from "@/store/useAuth";
import { useCmdk } from "@/store/useCmdk";

export default function App() {
  const module = useApp((s) => s.module);
  const tweaks = useApp((s) => s.tweaks);
  const ready = useApp((s) => s.ready);
  const bootError = useApp((s) => s.bootError);
  const currentProjectId = useApp((s) => s.currentProjectId);
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
  // DialogHost stays mounted across every branch so in-app dialogs work even
  // during bootstrap (e.g. the first-login local→cloud import prompt).
  let content;
  if (authConfigured && authStatus === "loading") {
    content = <div className="boot-splash">Blackburst</div>;
  } else if (authConfigured && authStatus === "signed-out") {
    content = <AuthScreen />;
  } else if (authConfigured && !ready) {
    // A failed bootstrap surfaces here with a retry — the effect above never
    // refires on its own (its deps don't change), so without this the splash
    // would sit forever on a transient network error.
    content = bootError ? (
      <div className="boot-splash">
        <span>Workspace failed to load</span>
        <span className="boot-splash-detail">{bootError}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="tb-btn primary" onClick={() => void useApp.getState().bootstrap()}>
            Retry
          </button>
          <button className="tb-btn" onClick={() => void useAuth.getState().signOut()}>
            Sign out
          </button>
        </div>
      </div>
    ) : (
      <div className="boot-splash">Loading workspace…</div>
    );
  } else {
    content = (
      <WorkspaceErrorBoundary key={currentProjectId}>
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
            {module === "maint" && <MaintenanceModule />}
          </main>
          <StatusBar />
          <CommandPalette />
          <SettingsPanel />
          <SharePanel />
        </div>
      </WorkspaceErrorBoundary>
    );
  }

  return (
    <>
      {content}
      <DialogHost />
    </>
  );
}
