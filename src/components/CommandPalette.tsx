import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { I } from "@/components/Icon";
import { RACK_CATALOG } from "@/lib/rack-data";
import { goto, type RefKind } from "@/lib/nav";
import { useDocs } from "@/modules/docs/store";
import { useInventory } from "@/modules/inventory/store";
import { useLedWall } from "@/modules/led-wall/store";
import { useRack } from "@/modules/rack-builder/store";
import { useSystem } from "@/modules/system-designer/store";
import { useApp } from "@/store/useApp";
import { useCmdk } from "@/store/useCmdk";
import type { DocNode, ModuleId } from "@/types";

type GroupId = "Jump" | "Docs" | "Assets" | "Walls" | "Nodes" | "Rack";

interface BaseRow {
  group: GroupId;
  label: string;
  sub: string;
  haystack: string;
}

interface ModuleRow extends BaseRow {
  group: "Jump";
  kind: "module";
  mod: ModuleId;
}

interface RefRow extends BaseRow {
  group: Exclude<GroupId, "Jump">;
  kind: RefKind;
  id: string;
}

type CmdRow = ModuleRow | RefRow;

const MODULE_ROWS: ModuleRow[] = [
  { group: "Jump", kind: "module", mod: "wall", label: "LED Wall Builder", sub: "Module", haystack: "led wall builder module" },
  { group: "Jump", kind: "module", mod: "system", label: "System Designer", sub: "Module", haystack: "system designer module" },
  { group: "Jump", kind: "module", mod: "rack", label: "Rack Builder", sub: "Module", haystack: "rack builder module" },
  { group: "Jump", kind: "module", mod: "inv", label: "Asset & Inventory", sub: "Module", haystack: "asset inventory module" },
  { group: "Jump", kind: "module", mod: "docs", label: "Documentation Hub", sub: "Module", haystack: "documentation docs hub module" },
];

const GROUP_ORDER: GroupId[] = ["Jump", "Docs", "Assets", "Walls", "Nodes", "Rack"];
const PER_GROUP_LIMIT = 6;

function flattenDocs(nodes: DocNode[], out: { id: string; name: string; folder: string }[] = [], folder = ""): typeof out {
  for (const n of nodes) {
    if (n.kind === "folder") {
      if (n.children) flattenDocs(n.children, out, n.name);
    } else {
      out.push({ id: n.id, name: n.name, folder });
    }
  }
  return out;
}

export function CommandPalette() {
  const open = useCmdk((s) => s.open);
  const setOpen = useCmdk((s) => s.setOpen);

  const assets = useInventory((s) => s.assets);
  const walls = useLedWall((s) => s.walls);
  const nodes = useSystem((s) => s.nodes);
  const docTree = useDocs((s) => s.tree);
  const rackItems = useRack((s) => s.items);
  const setModule = useApp((s) => s.setModule);

  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allRows = useMemo<CmdRow[]>(() => {
    const docs = flattenDocs(docTree).map<RefRow>((d) => ({
      group: "Docs",
      kind: "doc",
      id: d.id,
      label: d.name,
      sub: d.folder || "Docs",
      haystack: `${d.name} ${d.folder} ${d.id}`.toLowerCase(),
    }));
    const assetRows = assets.map<RefRow>((a) => ({
      group: "Assets",
      kind: "asset",
      id: a.id,
      label: a.id,
      sub: `${a.model} · ${a.cat}`,
      haystack: `${a.id} ${a.model} ${a.cat}`.toLowerCase(),
    }));
    const wallRows = walls.map<RefRow>((w) => ({
      group: "Walls",
      kind: "wall",
      id: w.id,
      label: `${w.id} · ${w.name}`,
      sub: `${w.cols}×${w.rows} · ${w.panel}`,
      haystack: `${w.id} ${w.name} ${w.panel}`.toLowerCase(),
    }));
    const nodeRows = nodes.map<RefRow>((n) => ({
      group: "Nodes",
      kind: "node",
      id: n.id,
      label: `${n.id} · ${n.name}`,
      sub: n.type,
      haystack: `${n.id} ${n.name} ${n.type}`.toLowerCase(),
    }));
    const rackRows = rackItems.map<RefRow>((it) => {
      const def = RACK_CATALOG.find((d) => d.id === it.id);
      return {
        group: "Rack",
        kind: "rack-item",
        id: String(it.iid),
        label: def?.model ?? it.id,
        sub: `U${it.pos} · ${def?.cat ?? ""}`,
        haystack: `${def?.model ?? ""} ${def?.cat ?? ""} u${it.pos}`.toLowerCase(),
      };
    });
    return [...MODULE_ROWS, ...docs, ...assetRows, ...wallRows, ...nodeRows, ...rackRows];
  }, [assets, walls, nodes, docTree, rackItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = new Map<GroupId, CmdRow[]>();
    for (const g of GROUP_ORDER) groups.set(g, []);
    if (!q) {
      groups.set("Jump", MODULE_ROWS);
      for (const r of allRows) {
        if (r.group === "Jump") continue;
        const bucket = groups.get(r.group)!;
        if (bucket.length < 3) bucket.push(r);
      }
    } else {
      for (const r of allRows) {
        if (!r.haystack.includes(q) && !r.label.toLowerCase().includes(q)) continue;
        const bucket = groups.get(r.group)!;
        if (bucket.length < PER_GROUP_LIMIT) bucket.push(r);
      }
    }
    const ordered: { group: GroupId; rows: CmdRow[] }[] = [];
    for (const g of GROUP_ORDER) {
      const rows = groups.get(g) ?? [];
      if (rows.length) ordered.push({ group: g, rows });
    }
    const flat = ordered.flatMap((s) => s.rows);
    return { sections: ordered, flat };
  }, [allRows, query]);

  useEffect(() => {
    setIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLDivElement>(
      `[data-cmdk-row="${index}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [index, open, filtered]);

  if (!open) return null;

  function dispatch(row: CmdRow) {
    setOpen(false);
    if (row.kind === "module") setModule(row.mod);
    else goto({ kind: row.kind, id: row.id });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const total = filtered.flat.length;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const row = filtered.flat[index];
      if (row) dispatch(row);
      return;
    }
    if (!total) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (i - 1 + total) % total);
    } else if (e.key === "Home") {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIndex(total - 1);
    }
  }

  let flatCursor = 0;

  return (
    <div className="cmdk-overlay" onMouseDown={() => setOpen(false)}>
      <div
        className="cmdk-panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cmdk-input-row">
          <I.Search size={14} />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Jump to a doc, asset, wall, node, rack item…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {filtered.flat.length === 0 ? (
            <div className="cmdk-empty">No matches.</div>
          ) : (
            filtered.sections.map((section) => (
              <div key={section.group} className="cmdk-group">
                <div className="cmdk-group-h">{section.group.toUpperCase()}</div>
                {section.rows.map((row) => {
                  const i = flatCursor++;
                  const active = i === index;
                  return (
                    <div
                      key={`${row.group}-${"mod" in row ? row.mod : row.id}`}
                      className="cmdk-row"
                      data-cmdk-row={i}
                      data-active={active ? "1" : "0"}
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => dispatch(row)}
                    >
                      <span className="cmdk-kind">{row.group}</span>
                      <span className="cmdk-label">{row.label}</span>
                      <span className="cmdk-sub">{row.sub}</span>
                      {active && (
                        <kbd style={{ marginLeft: "auto" } as CSSProperties}>↵</kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> select</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>ESC</kbd> close</span>
          <span style={{ marginLeft: "auto" }}>{filtered.flat.length} results</span>
        </div>
      </div>
    </div>
  );
}
