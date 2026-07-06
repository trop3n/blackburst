import type { ReactNode } from "react";

// The proof-of-concept doc bodies and cross-references were removed with the
// demo seed. DocsModule still reads these two maps: a real doc's body comes from
// the project bucket (rendered via MarkdownBody), and linked references are added
// per doc, so both start empty. See the pure-data files for tree/versions/comments.
export type LinkedRef = { k: "ASSET" | "WALL" | "NODE" | "DOC"; n: string; id: string };

export const DOC_LINKED_BY_ID: Record<string, LinkedRef[]> = {};

export const DOC_BODIES: Record<string, ReactNode> = {};
