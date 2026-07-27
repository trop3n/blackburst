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
import { useCmdkRecents } from "@/store/useCmdkRecents";
import type { DocNode, ModuleId } from "@/types";

type SectionId = "Recents" | "Jump" | "Docs" | "Assets" | "Walls" | "Nodes" | "Rack";
type RowGroup = Exclude<SectionId, "Recents">;
type Mode = null | "doc" | "asset" | "wall" | "node" | "rack-item" | "module";

interface BaseRow {
  group: RowGroup;
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
  group: Exclude<RowGroup, "Jump">;
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

const GROUP_ORDER: RowGroup[] = ["Jump", "Docs", "Assets", "Walls", "Nodes", "Rack"];
const PER_GROUP_LIMIT = 6;
const RECENTS_LIMIT = 5;

const MODE_TO_GROUP: Record<Exclude<Mode, null>, RowGroup> = {
  module: "Jump",
  doc: "Docs",
  asset: "Assets",
  wall: "Walls",
  node: "Nodes",
  "rack-item": "Rack",
};

const MODE_PLACEHOLDER: Record<Exclude<Mode, null>, string> = {
  module: "Jump to a module…",
  doc: "Find a document…",
  asset: "Find an asset…",
  wall: "Find a wall…",
  node: "Find a system node…",
  "rack-item": "Find a rack item…",
};

function parseQuery(raw: string): { mode: Mode; rest: string } {
  const m = raw.match(/^>(\w+)\s?(.*)$/);
  if (!m) return { mode: null, rest: raw };
  const prefix = m[1].toLowerCase();
  const rest = m[2];
  if (prefix === "doc" || prefix === "docs") return { mode: "doc", rest };
  if (prefix === "asset" || prefix === "assets") return { mode: "asset", rest };
  if (prefix === "wall" || prefix === "walls") return { mode: "wall", rest };
  if (prefix === "node" || prefix === "nodes") return { mode: "node", rest };
  if (prefix === "rack") return { mode: "rack-item", rest };
  if (prefix === "mod" || prefix === "jump" || prefix === "go") return { mode: "module", rest };
  return { mode: null, rest: raw };
}

function score(q: string, label: string, haystack: string): number {
  if (!q) return 1;
  const labelL = label.toLowerCase();
  if (labelL === q) return 1000;
  if (labelL.startsWith(q)) return 800 - (labelL.length - q.length);
  const boundaryIdx = (() => {
    if (labelL.startsWith(q)) return 0;
    const at = labelL.indexOf(` ${q}`);
    return at < 0 ? -1 : at + 1;
  })();
  if (boundaryIdx >= 0) return 600 - boundaryIdx;
  const subIdx = labelL.indexOf(q);
  if (subIdx >= 0) return 400 - subIdx;
  const hayIdx = haystack.indexOf(q);
  if (hayIdx >= 0) return 200 - hayIdx;
  let li = 0;
  for (let i = 0; i < q.length; i++) {
    const idx = labelL.indexOf(q[i], li);
    if (idx < 0) return 0;
    li = idx + 1;
  }
  return 50;
}

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

function rowKey(row: CmdRow): string {
  return row.kind === "module" ? `mod:${row.mod}` : `${row.kind}:${row.id}`;
}

export function CommandPalette() {
  const open = useCmdk((s) => s.open);
  const setOpen = useCmdk((s) => s.setOpen);

  const assets = useInventory((s) => s.assets);
  const walls = useLedWall((s) => s.walls);
  const nodes = useSystem((s) => s.nodes);
  const docTree = useDocs((s) => s.tree);
  const racks = useRack((s) => s.racks);
  const setModule = useApp((s) => s.setModule);
  const recents = useCmdkRecents((s) => s.recents);
  const pushRecent = useCmdkRecents((s) => s.push);

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
    const rackRows = racks.flatMap((r) =>
      r.items.map<RefRow>((it) => {
        const def = RACK_CATALOG.find((d) => d.id === it.id);
        return {
          group: "Rack",
          kind: "rack-item",
          id: `${r.id}:${it.iid}`,
          label: def?.model ?? it.id,
          sub: `${r.name} · U${it.pos}`,
          haystack: `${def?.model ?? ""} ${def?.cat ?? ""} ${r.name} u${it.pos}`.toLowerCase(),
        };
      }),
    );
    return [...MODULE_ROWS, ...docs, ...assetRows, ...wallRows, ...nodeRows, ...rackRows];
  }, [assets, walls, nodes, docTree, racks]);

  const { mode, rest } = useMemo(() => parseQuery(query), [query]);
  const q = rest.trim().toLowerCase();

  const filtered = useMemo(() => {
    const ordered: { group: SectionId; rows: CmdRow[] }[] = [];
    const isEmpty = !q && !mode;
    const allowedGroup = mode ? MODE_TO_GROUP[mode] : null;

    if (isEmpty && recents.length > 0) {
      const recentRows: CmdRow[] = [];
      for (const r of recents) {
        const match = allRows.find((row) => rowKey(row) === `${r.kind === "module" ? "mod" : r.kind}:${r.id}`);
        if (match) recentRows.push(match);
        if (recentRows.length >= RECENTS_LIMIT) break;
      }
      if (recentRows.length) ordered.push({ group: "Recents", rows: recentRows });
    }

    const buckets = new Map<RowGroup, { row: CmdRow; s: number }[]>();
    for (const g of GROUP_ORDER) buckets.set(g, []);

    if (isEmpty) {
      buckets.set("Jump", MODULE_ROWS.map((r) => ({ row: r, s: 1 })));
      for (const r of allRows) {
        if (r.group === "Jump") continue;
        const bucket = buckets.get(r.group)!;
        if (bucket.length < 3) bucket.push({ row: r, s: 1 });
      }
    } else {
      for (const r of allRows) {
        if (allowedGroup && r.group !== allowedGroup) continue;
        const s = q ? score(q, r.label, r.haystack) : 1;
        if (s <= 0) continue;
        buckets.get(r.group)!.push({ row: r, s });
      }
      for (const items of buckets.values()) {
        items.sort((a, b) => b.s - a.s);
        if (items.length > PER_GROUP_LIMIT) items.length = PER_GROUP_LIMIT;
      }
    }

    for (const g of GROUP_ORDER) {
      if (mode && g !== allowedGroup) continue;
      const items = buckets.get(g) ?? [];
      if (items.length === 0) continue;
      ordered.push({ group: g, rows: items.map((x) => x.row) });
    }

    const flat = ordered.flatMap((s) => s.rows);
    return { sections: ordered, flat };
  }, [allRows, q, mode, recents]);

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
    if (row.kind === "module") {
      setModule(row.mod);
      pushRecent({ kind: "module", id: row.mod, label: row.label, sub: row.sub });
    } else {
      goto({ kind: row.kind, id: row.id });
      pushRecent({ kind: row.kind, id: row.id, label: row.label, sub: row.sub });
    }
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
    if (e.key === "Backspace" && mode && rest === "") {
      e.preventDefault();
      setQuery("");
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
  const placeholder = mode
    ? MODE_PLACEHOLDER[mode]
    : "Jump to a doc, asset, wall, node, rack item… (try >doc, >asset)";

  return (
    <div className="cmdk-overlay" onMouseDown={() => setOpen(false)}>
      <div
        className="cmdk-panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cmdk-input-row">
          <I.Search size={14} />
          {mode && <span className="cmdk-mode">{mode.toUpperCase()}</span>}
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder={placeholder}
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
                      key={`${section.group}-${rowKey(row)}`}
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
          <span><kbd>&gt;</kbd>doc / asset / wall / node / rack</span>
          <span style={{ marginLeft: "auto" }}>{filtered.flat.length} results</span>
        </div>
      </div>
    </div>
  );
}
