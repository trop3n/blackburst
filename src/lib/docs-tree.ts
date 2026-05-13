import type { DocNode } from "@/types";

export const DOC_TREE: DocNode[] = [
  {
    id: "d-prj",
    name: "Helios Auditorium",
    kind: "folder",
    children: [
      { id: "d-prj-ros", name: "Run-of-Show v3.2", kind: "doc" },
      { id: "d-prj-cue", name: "Cue Sheet — Day 1", kind: "doc" },
      { id: "d-prj-pat", name: "Patch List", kind: "doc" },
      { id: "d-prj-ho", name: "Handoff Notes", kind: "doc" },
    ],
  },
  {
    id: "d-spec",
    name: "Equipment Specs",
    kind: "folder",
    children: [
      { id: "d-spec-sx40", name: "Brompton SX40 — Manual", kind: "doc" },
      { id: "d-spec-rb", name: "ROE Ruby RB2.6 — Spec", kind: "doc" },
      { id: "d-spec-la", name: "L-Acoustics LA12X — Spec", kind: "doc" },
    ],
  },
  {
    id: "d-sop",
    name: "SOPs",
    kind: "folder",
    children: [
      { id: "d-sop-load", name: "Load-In Procedure", kind: "doc" },
      { id: "d-sop-cal", name: "Wall Calibration", kind: "doc" },
      { id: "d-sop-strk", name: "Strike & Pack-Out", kind: "doc" },
    ],
  },
];
