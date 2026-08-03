import { useRef, useState } from "react";
import { I } from "@/components/Icon";
import { exportProject, importProject } from "@/lib/project-io";
import { useApp } from "@/store/useApp";
import { displayNameOf, initialsOf, useAuth } from "@/store/useAuth";
import { useCmdk } from "@/store/useCmdk";
import { alertDialog, confirmDialog, promptDialog } from "@/store/useDialog";
import { useSettings } from "@/store/useSettings";
import { useShare } from "@/store/useShare";
import type { ModuleId } from "@/types";

const MODULE_LABELS: Record<ModuleId, string> = {
  wall: "LED Wall Builder",
  system: "System Designer",
  rack: "Rack Builder",
  inv: "Asset & Inventory",
  docs: "Documentation Hub",
  maint: "Maintenance Log",
};

export function Topbar() {
  const module = useApp((s) => s.module);
  const project = useApp((s) => s.project);
  const projects = useApp((s) => s.projects);
  const currentProjectId = useApp((s) => s.currentProjectId);
  const setCurrentProjectId = useApp((s) => s.setCurrentProjectId);
  const addProject = useApp((s) => s.addProject);
  const deleteProject = useApp((s) => s.deleteCurrentProject);
  const saveRev = useApp((s) => s.saveRev);
  const openCmdk = useCmdk((s) => s.setOpen);
  const openSettings = useSettings((s) => s.setOpen);
  const authConfigured = useAuth((s) => s.configured);
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const openShare = useShare((s) => s.openFor);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canEdit = !authConfigured || project.role !== "viewer";
  // Deleting a project is destructive and cascades to all members, so it's
  // owner-only in accounts mode (non-owners use "Leave project" in Share).
  const canDelete = !authConfigured || project.role === "owner";

  const handleSaveRev = async () => {
    const note = await promptDialog("Revision note", "");
    if (note === null) return;
    saveRev(note);
  };

  const handleNewProject = async () => {
    const name = (await promptDialog("New project name?"))?.trim();
    if (!name) return;
    const client = (await promptDialog("Client name?"))?.trim() || "—";
    addProject(name, client);
  };

  const handleDeleteProject = async () => {
    const ok = await confirmDialog(
      `Delete "${project.name}"? This permanently removes the project and all its contents${
        authConfigured ? " for everyone it's shared with" : ""
      }. This can't be undone.`,
      { danger: true, confirmLabel: "Delete" },
    );
    if (ok) await deleteProject();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importProject(file);
    } catch (err) {
      await alertDialog(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
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
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <span>{project.code}</span>
          <I.Chev size={10} dir="down" />
        </label>
        <button
          className="icon-btn"
          type="button"
          onClick={handleNewProject}
          title="New project"
          aria-label="New project"
        >
          <I.Plus size={13} />
        </button>
        {canDelete && (
          <button
            className="icon-btn"
            type="button"
            onClick={handleDeleteProject}
            title="Delete project"
            aria-label="Delete project"
          >
            <I.Cross size={13} />
          </button>
        )}
        <span style={{ color: "var(--color-fg)" }}>{project.name}</span>
        <span className="chip">{project.client}</span>
        {authConfigured && project.role === "viewer" && (
          <span className="chip warn">view only</span>
        )}
      </div>
      <div className="topbar-section">
        <span className="crumb mono">PROJECTS</span>
        <span className="crumb-sep">/</span>
        <span className="crumb mono">{project.code}</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-curr mono">{MODULE_LABELS[module]}</span>
      </div>
      <div className="spacer" />
      <div className="topbar-section" style={{ borderRight: 0, paddingRight: 0 }}>
        <button className="cmdk" type="button" onClick={() => openCmdk(true)}>
          <I.Search size={12} />
          <span>Search assets, docs, panels…</span>
          <kbd>⌘K</kbd>
        </button>
        {authConfigured && (
          <button className="tb-btn" type="button" onClick={() => openShare(currentProjectId)}>
            Share
          </button>
        )}
        <button
          className="tb-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canEdit}
        >
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
        <button
          className="tb-btn primary"
          type="button"
          onClick={handleSaveRev}
          disabled={!canEdit}
        >
          <I.Plus size={13} /> Save Rev
        </button>
        <button
          className="icon-btn"
          type="button"
          onClick={() => openSettings(true)}
          title="Workspace settings"
          aria-label="Open settings"
        >
          <I.Settings size={14} />
        </button>
        {authConfigured ? (
          <div className="user-chip">
            <button
              type="button"
              className="avatar"
              onClick={() => setMenuOpen((v) => !v)}
              title={displayNameOf(user) || "Account"}
              aria-label="Account menu"
            >
              {initialsOf(user)}
            </button>
            {menuOpen && (
              <>
                <div className="user-menu-scrim" onClick={() => setMenuOpen(false)} />
                <div className="user-menu">
                  <div className="user-menu-id">
                    <span className="user-menu-name">{displayNameOf(user) || "Account"}</span>
                    {user?.email && displayNameOf(user) !== user.email && (
                      <span className="user-menu-email">{user.email}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="user-chip">
            <div className="avatar">BB</div>
          </div>
        )}
      </div>
    </header>
  );
}
