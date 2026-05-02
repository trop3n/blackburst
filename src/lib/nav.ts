import { useDocs } from "@/modules/docs/store";
import { useInventory } from "@/modules/inventory/store";
import { useLedWall } from "@/modules/led-wall/store";
import { useSystem } from "@/modules/system-designer/store";
import { useApp } from "@/store/useApp";

export type RefKind = "asset" | "wall" | "node" | "doc";

export interface RefTarget {
  kind: RefKind;
  id: string;
}

export function goto(target: RefTarget) {
  const { setModule } = useApp.getState();
  switch (target.kind) {
    case "asset":
      setModule("inv");
      useInventory.getState().setSelected(target.id);
      break;
    case "wall":
      setModule("wall");
      useLedWall.getState().setLayoutId(target.id);
      break;
    case "node":
      setModule("system");
      useSystem.getState().setSelectedNodeId(target.id);
      break;
    case "doc":
      setModule("docs");
      useDocs.getState().setActive(target.id);
      break;
  }
}
