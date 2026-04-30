import type { ReactNode } from "react";
import { I } from "@/components/Icon";
import { useApp } from "@/store/useApp";
import type { ModuleId } from "@/types";

interface RailButtonProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

function RailButton({ label, active, onClick, children }: RailButtonProps) {
  return (
    <button className="rail-btn" data-active={active ? "1" : "0"} onClick={onClick}>
      <span className="ico">{children}</span>
      <span className="lbl">{label}</span>
    </button>
  );
}

const ITEMS: { id: ModuleId; label: string; icon: ReactNode }[] = [
  { id: "wall", label: "WALL", icon: <I.Wall size={18} /> },
  { id: "system", label: "SYS", icon: <I.System size={18} /> },
  { id: "rack", label: "RACK", icon: <I.Rack size={18} /> },
  { id: "inv", label: "INV", icon: <I.Inventory size={18} /> },
  { id: "docs", label: "DOCS", icon: <I.Docs size={18} /> },
];

export function Rail() {
  const module = useApp((s) => s.module);
  const setModule = useApp((s) => s.setModule);

  return (
    <aside className="rail">
      <div className="rail-logo">BB</div>
      <div className="rail-section">
        {ITEMS.map((it) => (
          <RailButton
            key={it.id}
            label={it.label}
            active={module === it.id}
            onClick={() => setModule(it.id)}
          >
            {it.icon}
          </RailButton>
        ))}
      </div>
      <div className="rail-spacer" />
      <div
        className="rail-section"
        style={{ borderBottom: 0, borderTop: "1px solid var(--color-line)" }}
      >
        <RailButton label="SET">
          <I.Settings size={16} />
        </RailButton>
      </div>
    </aside>
  );
}
