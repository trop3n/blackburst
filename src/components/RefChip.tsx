import type { CSSProperties, ReactNode } from "react";
import { goto, type RefKind } from "@/lib/nav";

interface RefChipProps {
  kind: RefKind;
  id: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function RefChip({ kind, id, children, style }: RefChipProps) {
  return (
    <a
      className="ref"
      style={style}
      onClick={(e) => {
        e.preventDefault();
        goto({ kind, id });
      }}
    >
      {children ?? id}
    </a>
  );
}
