import type { ReactNode } from "react";
import { I } from "@/components/Icon";
import { useApp } from "@/store/useApp";
import { useSettings } from "@/store/useSettings";
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
  { id: "wall", label: "LED Wall", icon: <I.Wall size={20} /> },
  { id: "system", label: "System", icon: <I.System size={20} /> },
  { id: "rack", label: "Racks", icon: <I.Rack size={20} /> },
  { id: "inv", label: "Inventory", icon: <I.Inventory size={20} /> },
  { id: "docs", label: "Docs", icon: <I.Docs size={20} /> },
  { id: "maint", label: "Maintenance", icon: <I.Wrench size={20} /> },
];

export function Rail() {
  const module = useApp((s) => s.module);
  const setModule = useApp((s) => s.setModule);
  const openSettings = useSettings((s) => s.setOpen);

  return (
    <aside className="rail">
      <div className="rail-logo">SAMC</div>
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
        <RailButton label="Settings" onClick={() => openSettings(true)}>
          <I.Settings size={20} />
        </RailButton>
      </div>
    </aside>
  );
}
