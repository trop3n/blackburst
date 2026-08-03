import type { ReactNode } from "react";

// The proof-of-concept doc bodies were removed with the demo seed. A real doc's
// body comes from the project bucket and renders via MarkdownBody, so this map
// stays empty; DocsModule still reads it for stock bodies. Cross-references are
// no longer a static map — they're parsed out of the body itself (lib/doc-refs).
// See the pure-data files for tree/versions/comments.
export const DOC_BODIES: Record<string, ReactNode> = {};
