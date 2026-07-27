import type { ReactNode } from "react";
import { useApp } from "@/store/useApp";

interface PrintSheetProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

// A print-only document. Hidden on screen; the print stylesheet hides everything
// else and reveals this on a white page, so output doesn't inherit the shell's
// dark canvas. Only the active module is mounted, so only one exists at a time.
export function PrintSheet({ title, subtitle, children }: PrintSheetProps) {
  const project = useApp((s) => s.project);
  const revisions = useApp((s) => s.revisions);
  const rev = revisions[0];

  return (
    <div className="print-sheet" aria-hidden="true">
      <header className="print-hd">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="print-sub">{subtitle}</p>}
        </div>
        <dl className="print-meta">
          <dt>Project</dt>
          <dd>
            {project.code} · {project.name}
          </dd>
          <dt>Client</dt>
          <dd>{project.client || "—"}</dd>
          <dt>Revision</dt>
          <dd>{String(rev?.n ?? 0).padStart(4, "0")}</dd>
          <dt>Printed</dt>
          <dd>{new Date().toLocaleString()}</dd>
        </dl>
      </header>
      {children}
      <footer className="print-ft">
        Blackburst · {project.code} · {title}
      </footer>
    </div>
  );
}
