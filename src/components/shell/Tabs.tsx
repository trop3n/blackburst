import { useApp } from "@/store/useApp";
import type { ModuleId } from "@/types";

const ITEMS: { id: ModuleId; label: string; num: string }[] = [
  { id: "wall", label: "LED Wall Builder", num: "01" },
  { id: "system", label: "System Designer", num: "02" },
  { id: "rack", label: "Rack Builder", num: "03" },
  { id: "inv", label: "Inventory", num: "04" },
  { id: "docs", label: "Documentation", num: "05" },
];

export function Tabs() {
  const module = useApp((s) => s.module);
  const setModule = useApp((s) => s.setModule);

  return (
    <div className="tabs">
      {ITEMS.map((it) => (
        <div
          key={it.id}
          className="tabs-pill"
          data-active={module === it.id ? "1" : "0"}
          onClick={() => setModule(it.id)}
        >
          <span className="num-badge">{it.num}</span>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
