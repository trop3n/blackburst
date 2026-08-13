import type { RefKind } from "@/lib/nav";

// A doc body links into the app with ordinary markdown link syntax plus a kind
// scheme: [Booth 2 PSU swap](maint-entry:mnt-abc123). Anything else stays a
// plain link, so external URLs are unaffected.
//
// Type-only import of RefKind: nav.ts pulls in every module store, and this file
// is consumed by MarkdownBody and DocsModule. `import type` is erased, so no
// runtime dependency is created.
const REF_KINDS: readonly RefKind[] = [
  "asset",
  "wall",
  "node",
  "doc",
  "rack-item",
  "maint-entry",
  "venue",
];

export interface DocRef {
  kind: RefKind;
  id: string;
  label: string;
}

export function parseRefTarget(url: string): { kind: RefKind; id: string } | null {
  const at = url.indexOf(":");
  if (at <= 0) return null;
  const kind = url.slice(0, at).trim();
  // rack-item ids are themselves "<rackId>:<iid>", so only the first colon splits.
  const id = url.slice(at + 1).trim();
  if (!id) return null;
  return (REF_KINDS as readonly string[]).includes(kind)
    ? { kind: kind as RefKind, id }
    : null;
}

// Every ref a doc body points at, in source order, deduped by kind+id. Drives the
// LINKED REFERENCES pane so it reflects the document rather than a static map.
export function extractRefs(body: string): DocRef[] {
  const out: DocRef[] = [];
  const seen = new Set<string>();
  for (const m of body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    const target = parseRefTarget(m[2]);
    if (!target) continue;
    const key = `${target.kind}:${target.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...target, label: m[1] });
  }
  return out;
}

export const REF_KIND_LABEL: Record<RefKind, string> = {
  asset: "ASSET",
  wall: "WALL",
  node: "NODE",
  doc: "DOC",
  "rack-item": "RACK",
  "maint-entry": "MAINT",
  venue: "VENUE",
};
