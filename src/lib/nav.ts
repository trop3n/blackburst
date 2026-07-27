import { useDocs } from "@/modules/docs/store";
import { useInventory } from "@/modules/inventory/store";
import { useLedWall } from "@/modules/led-wall/store";
import { useRack } from "@/modules/rack-builder/store";
import { useSystem } from "@/modules/system-designer/store";
import { useApp } from "@/store/useApp";

export type RefKind = "asset" | "wall" | "node" | "doc" | "rack-item";

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
    // Item ids are unique per rack, so a rack-item ref is "<rackId>:<iid>".
    // A bare number is still accepted and resolves against the active rack.
    case "rack-item": {
      setModule("rack");
      const rack = useRack.getState();
      const [a, b] = target.id.split(":");
      const iid = Number(b ?? a);
      if (!Number.isFinite(iid)) break;
      if (b != null && rack.racks.some((r) => r.id === a)) rack.setRackId(a);
      rack.setSelectedIid(iid);
      break;
    }
  }
}
