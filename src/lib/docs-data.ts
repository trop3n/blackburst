import type { DocNode, DocVersion } from "@/types";

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

export const DOC_VERSIONS: DocVersion[] = [
  { v: "v3.2", who: "M. Reyes", when: "Apr 28, 14:22", note: "Adjusted cue 14 timing" },
  { v: "v3.1", who: "M. Reyes", when: "Apr 27, 09:08", note: "Inserted IMAG sub-cues" },
  { v: "v3.0", who: "K. Tanaka", when: "Apr 24, 17:55", note: "Tech rehearsal pass" },
  { v: "v2.4", who: "S. Larsson", when: "Apr 19, 11:30", note: "Pre-production lock" },
  { v: "v2.3", who: "S. Larsson", when: "Apr 17, 16:02", note: "Speaker order change" },
];

export const RECENT_DOCS: { id: string; n: string; w: string; t: string }[] = [
  { id: "r1", n: "Cue Sheet — Day 1", w: "M. Reyes", t: "12m" },
  { id: "r2", n: "ROE Ruby RB2.6 — Spec", w: "K. Tanaka", t: "1h" },
  { id: "r3", n: "Load-In Procedure", w: "S. Larsson", t: "3h" },
];

export const LINKED_REFS: { k: string; n: string }[] = [
  { k: "ASSET", n: "BMD-S40-001 · Brompton SX40" },
  { k: "ASSET", n: "ROE-RB2.6-A1 · 24-pack" },
  { k: "WALL", n: "W1 · Main Lobby Wall" },
  { k: "NODE", n: "n4 · SX40 Processor #1" },
  { k: "DOC", n: "SOP · Wall Calibration" },
  { k: "DOC", n: "Patch List · Day 1" },
];

export const DOC_COMMENTS: { who: string; t: string; c: string }[] = [
  { who: "K. Tanaka", t: "12m", c: "Shifted cue 14 by +2s — confirmed with director." },
  { who: "S. Larsson", t: "1h", c: "Need a hot spare staged stage-left for SX40 #1." },
];
