import type { ReactNode } from "react";
import { RefChip } from "@/components/RefChip";
import { useApp } from "@/store/useApp";
import type { DocVersion } from "@/types";

export { DOC_TREE } from "@/lib/docs-tree";

export const DOC_VERSIONS_BY_ID: Record<string, DocVersion[]> = {
  "d-prj-ros": [
    { v: "v3.2", who: "M. Reyes", when: "Apr 28, 14:22", note: "Adjusted cue 14 timing" },
    { v: "v3.1", who: "M. Reyes", when: "Apr 27, 09:08", note: "Inserted IMAG sub-cues" },
    { v: "v3.0", who: "K. Tanaka", when: "Apr 24, 17:55", note: "Tech rehearsal pass" },
    { v: "v2.4", who: "S. Larsson", when: "Apr 19, 11:30", note: "Pre-production lock" },
    { v: "v2.3", who: "S. Larsson", when: "Apr 17, 16:02", note: "Speaker order change" },
  ],
  "d-sop-cal": [
    { v: "v1.4", who: "K. Tanaka", when: "Apr 22, 10:11", note: "Added curved-wall delta" },
    { v: "v1.3", who: "K. Tanaka", when: "Apr 12, 18:40", note: "Probe ordering corrected" },
  ],
  "d-sop-load": [
    { v: "v2.0", who: "S. Larsson", when: "Apr 18, 09:00", note: "Truss pickup recount" },
  ],
};

export const RECENT_DOCS: { id: string; n: string; w: string; t: string }[] = [
  { id: "d-prj-cue", n: "Cue Sheet — Day 1", w: "M. Reyes", t: "12m" },
  { id: "d-spec-rb", n: "ROE Ruby RB2.6 — Spec", w: "K. Tanaka", t: "1h" },
  { id: "d-sop-load", n: "Load-In Procedure", w: "S. Larsson", t: "3h" },
];

export type LinkedRef = { k: "ASSET" | "WALL" | "NODE" | "DOC"; n: string; id: string };

export const DOC_LINKED_BY_ID: Record<string, LinkedRef[]> = {
  "d-prj-ros": [
    { k: "ASSET", n: "BMD-S40-001 · Brompton SX40", id: "BMD-S40-001" },
    { k: "ASSET", n: "ROE-RB2.6-A1 · 24-pack", id: "ROE-RB2.6-A1" },
    { k: "WALL", n: "W1 · Main Lobby Wall", id: "W1" },
    { k: "NODE", n: "n4 · SX40 Processor #1", id: "n4" },
    { k: "DOC", n: "SOP · Wall Calibration", id: "d-sop-cal" },
    { k: "DOC", n: "Patch List · Day 1", id: "d-prj-pat" },
  ],
  "d-sop-cal": [
    { k: "WALL", n: "W1 · Main Lobby Wall", id: "W1" },
    { k: "ASSET", n: "BMD-S40-001 · Brompton SX40", id: "BMD-S40-001" },
  ],
  "d-sop-load": [
    { k: "DOC", n: "Run-of-Show v3.2", id: "d-prj-ros" },
  ],
};

export type DocComment = { who: string; t: string; c: string };

export const DOC_COMMENTS_BY_ID: Record<string, DocComment[]> = {
  "d-prj-ros": [
    { who: "K. Tanaka", t: "12m", c: "Shifted cue 14 by +2s — confirmed with director." },
    { who: "S. Larsson", t: "1h", c: "Need a hot spare staged stage-left for SX40 #1." },
  ],
};

const RunOfShowBody = () => (
  <>
    <h1>Run-of-Show — Helios Auditorium Refresh</h1>
    <div className="meta-row">
      <span>REV v3.2</span>
      <span>EDITED Apr 28, 14:22 by M. Reyes</span>
      <span style={{ color: "var(--accent)" }}>● LOCKED FOR SHOW</span>
    </div>

    <p>
      This document is the operational reference for the Helios Auditorium load-in and main session days.
      All cue numbers, signal paths, and asset IDs are linked to live records — clicking a reference opens
      the corresponding asset, system node, or panel.
    </p>

    <h2>01 · System Overview</h2>
    <p>
      The room is driven by a redundant Brompton SX40 pair (
      <RefChip kind="asset" id="BMD-S40-001" /> /{" "}
      <RefChip kind="asset" id="BMD-S40-002" />) feeding the{" "}
      <RefChip kind="wall" id="W1">W1 · Main Lobby Wall</RefChip> (P2.6, 18×8 cabinets, 9000×2080
      native). Audio reinforcement is via <RefChip kind="asset" id="DGC-SD12-001" /> through{" "}
      <RefChip kind="asset" id="LA-12X-001" />.
    </p>

    <div className="callout">
      <strong
        style={{
          color: "var(--accent)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
      >
        NOTE
      </strong>
      <div style={{ marginTop: 4 }}>
        SX40 #1 carries the left half of the wall, SX40 #2 the right. Failover is manual — see{" "}
        <RefChip kind="doc" id="d-sop-cal">SOP · Wall Calibration §4</RefChip>.
      </div>
    </div>

    <h2>02 · Load-In · Day 1 (07:00 – 16:00)</h2>
    <ul>
      <li><code>07:00</code> — Truck arrival; rigging walk-through with FOH</li>
      <li><code>08:00</code> — Truss to height; pickup points marked at 6 hangs · 84 kg/pt</li>
      <li>
        <code>10:30</code> — Panel hang begins (left half first); ref{" "}
        <RefChip kind="doc" id="d-sop-load">SOP · Load-In §2.4</RefChip>
      </li>
      <li>
        <code>13:00</code> — Processor power-up; data sync via{" "}
        <RefChip kind="node" id="n4">10GbE A/B</RefChip>
      </li>
      <li>
        <code>14:30</code> — Calibration sweep — see{" "}
        <RefChip kind="doc" id="d-sop-cal">SOP · Wall Calibration</RefChip>
      </li>
      <li><code>15:30</code> — Audio system checks; FOH walk</li>
      <li><code>16:00</code> — End of Day 1; system held overnight in standby</li>
    </ul>

    <h2>03 · Show · Day 2 (09:00 – 21:00)</h2>
    <p>
      Director cues delivered over <code>Stage Manager → Cue 1</code>. Standby pages issued 5 min before
      each major change. Two warnings flagged on the system:{" "}
      <RefChip
        kind="wall"
        id="W1"
        style={{ color: "var(--color-warn)", borderColor: "var(--color-warn)" }}
      >
        Panel C7,R3 fault
      </RefChip>{" "}
      and{" "}
      <RefChip
        kind="asset"
        id="BMD-S40-001"
        style={{ color: "var(--color-warn)", borderColor: "var(--color-warn)" }}
      >
        SX40 #1 thermal
      </RefChip>{" "}
      — both have hot-swap spares staged stage-left.
    </p>

    <h2>04 · Strike · Day 3 (06:00 – 11:00)</h2>
    <p>
      Reverse load-in order. Power down via SOP. All assets returned to crates and checked back into{" "}
      <a
        className="ref"
        onClick={(e) => {
          e.preventDefault();
          useApp.getState().setModule("inv");
        }}
      >
        Inventory
      </a>{" "}
      with QC pass.
    </p>
  </>
);

const WallCalibrationBody = () => (
  <>
    <h1>SOP · Wall Calibration</h1>
    <div className="meta-row">
      <span>REV v1.4</span>
      <span>EDITED Apr 22, 10:11 by K. Tanaka</span>
    </div>

    <p>
      Procedure for end-to-end calibration of the <RefChip kind="wall" id="W1">Main Lobby Wall</RefChip>{" "}
      after panel hang. Run with full processor chain online — see{" "}
      <RefChip kind="asset" id="BMD-S40-001" /> + <RefChip kind="asset" id="BMD-S40-002" />.
    </p>

    <h2>§1 · Prerequisites</h2>
    <ul>
      <li>All cabinets fully seated; magnets engaged; no daisy gaps</li>
      <li>Processors powered, firmware ≥ 4.2.6, redundancy in <em>active/active</em></li>
      <li>Probe (CR-300) calibrated within 30 days — verify sticker</li>
    </ul>

    <h2>§2 · Probe Sweep Order</h2>
    <ol>
      <li>Center column, top → bottom (8 cabinets)</li>
      <li>Outer columns alternating L/R until perimeter complete</li>
      <li>Re-probe any cabinet flagged ΔE &gt; 1.5 between runs</li>
    </ol>

    <h2>§3 · Save &amp; Promote</h2>
    <p>
      Save the resulting profile as <code>helios-v3-cal.bpf</code> on both processors. Promote to{" "}
      <em>active</em> only after a full black-frame + 100-IRE grey sweep with no visible seams.
    </p>

    <h2>§4 · Manual Failover</h2>
    <p>
      If a processor drops mid-show, hold <code>SHIFT</code> + press <code>BYPASS</code> on the surviving
      unit. The half-wall it doesn't carry will go black for ~1.2s before takeover completes. Notify FOH
      before initiating.
    </p>
  </>
);

const LoadInBody = () => (
  <>
    <h1>SOP · Load-In Procedure</h1>
    <div className="meta-row">
      <span>REV v2.0</span>
      <span>EDITED Apr 18, 09:00 by S. Larsson</span>
    </div>

    <p>
      Standard load-in for stage-on-truss venues. Cross-reference timing on{" "}
      <RefChip kind="doc" id="d-prj-ros">Run-of-Show §02</RefChip>.
    </p>

    <h2>§1 · Truss</h2>
    <ul>
      <li>6 hangs at 84 kg/pt; ground-supported corners only if rigger flags overhead</li>
      <li>Trim to working height, then dead-hang on motor lock before any panel load</li>
    </ul>

    <h2>§2 · Panels</h2>
    <ul>
      <li>Hang left half first; QC each row before chaining the next</li>
      <li>Bottom row at <code>+1.20m</code> deck-relative; verify with laser</li>
      <li>
        Daisy <em>signal</em> bottom-up; daisy <em>power</em> top-down — see §2.4 for the rationale
      </li>
    </ul>

    <h2>§3 · Hand-Off to Calibration</h2>
    <p>
      Hand-off only after processor sync is green on both units. Calibration owns the wall from this
      point — see <RefChip kind="doc" id="d-sop-cal">SOP · Wall Calibration</RefChip>.
    </p>
  </>
);

export const DOC_BODIES: Record<string, ReactNode> = {
  "d-prj-ros": <RunOfShowBody />,
  "d-sop-cal": <WallCalibrationBody />,
  "d-sop-load": <LoadInBody />,
};
