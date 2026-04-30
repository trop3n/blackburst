import { I } from "@/components/Icon";
import { useApp } from "@/store/useApp";
import type { ModuleId } from "@/types";

const MODULE_LABELS: Record<ModuleId, string> = {
  wall: "LED Wall Builder",
  system: "System Designer",
  rack: "Rack Builder",
  inv: "Asset & Inventory",
  docs: "Documentation Hub",
};

export function Topbar() {
  const module = useApp((s) => s.module);
  const project = useApp((s) => s.project);

  return (
    <header className="topbar">
      <div className="topbar-section">
        <span className="proj-pill mono">{project.id}</span>
        <span style={{ color: "var(--color-fg)" }}>{project.name}</span>
        <span className="chip">{project.client}</span>
      </div>
      <div className="topbar-section">
        <span className="crumb mono">PROJECTS</span>
        <span className="crumb-sep">/</span>
        <span className="crumb mono">{project.id}</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-curr mono">{MODULE_LABELS[module]}</span>
      </div>
      <div className="spacer" />
      <div className="topbar-section" style={{ borderRight: 0, paddingRight: 0 }}>
        <div className="cmdk">
          <I.Search size={12} />
          <span>Search assets, docs, panels…</span>
          <kbd>⌘K</kbd>
        </div>
        <button className="tb-btn">
          <I.Export size={13} /> Export
        </button>
        <button className="tb-btn primary">
          <I.Plus size={13} /> Save Rev
        </button>
        <div className="user-chip">
          <div className="avatar">MR</div>
        </div>
      </div>
    </header>
  );
}
