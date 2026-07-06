import type { DocNode } from "@/types";

// Clean starting tree: a Documents root with a single blank Overview doc
// (matches scaffoldBucket). Real docs are added per project.
export const DOC_TREE: DocNode[] = [
  {
    id: "d-root",
    name: "Documents",
    kind: "folder",
    children: [{ id: "d-overview", name: "Overview", kind: "doc" }],
  },
];
