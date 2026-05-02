import { useRef } from "react";
import { I } from "@/components/Icon";
import { exportProject, importProject } from "@/lib/project-io";
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
  const projects = useApp((s) => s.projects);
  const currentProjectId = useApp((s) => s.currentProjectId);
  const setCurrentProjectId = useApp((s) => s.setCurrentProjectId);
  const saveRev = useApp((s) => s.saveRev);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveRev = () => {
    const note = window.prompt("Revision note", "");
    if (note === null) return;
    saveRev(note);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importProject(file);
    } catch (err) {
      window.alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    e.target.value = "";
  };

  return (
    <header className="topbar">
      <div className="topbar-section">
        <label className="proj-pill mono proj-select">
          <select
            value={currentProjectId}
            onChange={(e) => setCurrentProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.name}
              </option>
            ))}
          </select>
          <span>{project.id}</span>
          <I.Chev size={10} dir="down" />
        </label>
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
        <button className="tb-btn" onClick={() => fileInputRef.current?.click()}>
          <I.Folder size={13} /> Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          style={{ display: "none" }}
        />
        <button className="tb-btn" onClick={exportProject}>
          <I.Export size={13} /> Export
        </button>
        <button className="tb-btn primary" onClick={handleSaveRev}>
          <I.Plus size={13} /> Save Rev
        </button>
        <div className="user-chip">
          <div className="avatar">MR</div>
        </div>
      </div>
    </header>
  );
}
