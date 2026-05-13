import type { ReactNode } from "react";
import { RefChip } from "@/components/RefChip";
import { useApp } from "@/store/useApp";

export { INITIAL_COMMENTS as DOC_COMMENTS_BY_ID } from "@/lib/docs-comments";

export { DOC_TREE } from "@/lib/docs-tree";

export { INITIAL_VERSIONS as DOC_VERSIONS_BY_ID } from "@/lib/docs-versions";

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
  "d-prj-cue": [
    { k: "DOC", n: "Run-of-Show v3.2", id: "d-prj-ros" },
    { k: "ASSET", n: "BMD-S40-001 · Brompton SX40 #1", id: "BMD-S40-001" },
    { k: "ASSET", n: "DGC-SD12-001 · DiGiCo SD12", id: "DGC-SD12-001" },
    { k: "WALL", n: "W1 · Main Lobby Wall", id: "W1" },
    { k: "NODE", n: "n3 · vMix M4", id: "n3" },
    { k: "DOC", n: "SOP · Wall Calibration", id: "d-sop-cal" },
  ],
  "d-prj-pat": [
    { k: "NODE", n: "n3 · vMix M4", id: "n3" },
    { k: "NODE", n: "n4 · SX40 #1", id: "n4" },
    { k: "NODE", n: "n5 · SX40 #2", id: "n5" },
    { k: "ASSET", n: "DGC-SD12-001 · DiGiCo SD12", id: "DGC-SD12-001" },
    { k: "ASSET", n: "LA-12X-001 · L-Acoustics LA12X", id: "LA-12X-001" },
    { k: "ASSET", n: "DST-200A-01 · Distro 200A", id: "DST-200A-01" },
    { k: "WALL", n: "W1 · Main Lobby Wall", id: "W1" },
  ],
  "d-prj-ho": [
    { k: "DOC", n: "Run-of-Show v3.2", id: "d-prj-ros" },
    { k: "DOC", n: "Cue Sheet — Day 1", id: "d-prj-cue" },
    { k: "DOC", n: "Patch List", id: "d-prj-pat" },
    { k: "DOC", n: "SOP · Strike & Pack-Out", id: "d-sop-strk" },
    { k: "ASSET", n: "ROE-RB2.6-A1 · 24-pack", id: "ROE-RB2.6-A1" },
    { k: "ASSET", n: "BMD-S40-001 · SX40 #1", id: "BMD-S40-001" },
  ],
  "d-spec-sx40": [
    { k: "ASSET", n: "BMD-S40-001 · Brompton SX40 #1", id: "BMD-S40-001" },
    { k: "ASSET", n: "BMD-S40-002 · Brompton SX40 #2", id: "BMD-S40-002" },
    { k: "ASSET", n: "BMD-S40-003 · Brompton SX40 spare", id: "BMD-S40-003" },
    { k: "NODE", n: "n4 · SX40 #1", id: "n4" },
    { k: "DOC", n: "SOP · Wall Calibration", id: "d-sop-cal" },
  ],
  "d-spec-rb": [
    { k: "ASSET", n: "ROE-RB2.6-A1 · 24-pack", id: "ROE-RB2.6-A1" },
    { k: "ASSET", n: "ROE-RB2.6-A2 · 24-pack", id: "ROE-RB2.6-A2" },
    { k: "WALL", n: "W1 · Main Lobby Wall", id: "W1" },
  ],
  "d-spec-la": [
    { k: "ASSET", n: "LA-12X-001 · L-Acoustics LA12X", id: "LA-12X-001" },
    { k: "ASSET", n: "LA-12X-002 · L-Acoustics LA12X", id: "LA-12X-002" },
    { k: "ASSET", n: "DGC-SD12-001 · DiGiCo SD12", id: "DGC-SD12-001" },
    { k: "NODE", n: "n8 · L-Acoustics LA12X", id: "n8" },
  ],
  "d-sop-strk": [
    { k: "DOC", n: "SOP · Load-In Procedure", id: "d-sop-load" },
    { k: "DOC", n: "Cue Sheet — Day 1", id: "d-prj-cue" },
    { k: "ASSET", n: "BMD-S40-001 · SX40 #1", id: "BMD-S40-001" },
    { k: "ASSET", n: "LA-12X-001 · LA12X", id: "LA-12X-001" },
    { k: "ASSET", n: "DST-200A-01 · Distro 200A", id: "DST-200A-01" },
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

const CueSheetBody = () => (
  <>
    <h1>Cue Sheet — Day 1</h1>
    <div className="meta-row">
      <span>REV v3.2</span>
      <span>EDITED Apr 28, 14:22 by M. Reyes</span>
      <span style={{ color: "var(--accent)" }}>● LOCKED FOR SHOW</span>
    </div>

    <p>
      Locked cue list for Day 1 (<RefChip kind="doc" id="d-prj-ros">Run-of-Show v3.2</RefChip>). Each cue
      is paired with a director call and a stage-manager standby. Standby is issued 5 min before the cue
      unless tagged <strong>HOT</strong>.
    </p>

    <h2>Act I — Opening Block</h2>
    <ul>
      <li><code>Q01</code> · 09:00:00 — House to half · audio bed in @ -18 LUFS</li>
      <li>
        <code>Q02</code> · 09:01:30 — IMAG live ·{" "}
        <RefChip kind="node" id="n3">vMix M4</RefChip> →{" "}
        <RefChip kind="asset" id="BMD-S40-001">SX40 #1</RefChip>
      </li>
      <li>
        <code>Q03</code> · 09:04:00 — Title plate on{" "}
        <RefChip kind="wall" id="W1">W1 · Main Lobby Wall</RefChip>
      </li>
      <li><code>Q04</code> · 09:05:15 — Mic 1 hot · speaker walk-on (M. Reyes call)</li>
      <li><code>Q05</code> · 09:08:00 — Lower-third graphic · standby Q06 30s</li>
      <li><code>Q06</code> · 09:08:30 — IMAG cross-fade · 2s</li>
    </ul>

    <h2>Act II — Panel Block</h2>
    <ul>
      <li>
        <code>Q07</code> · 10:15:00 — Panel layout (4-up) ·{" "}
        <RefChip kind="node" id="n3">vMix M4</RefChip>
      </li>
      <li>
        <code>Q08</code> · 10:18:00 — Audio mix to console scene B (
        <RefChip kind="asset" id="DGC-SD12-001">SD12</RefChip>)
      </li>
      <li><code>Q09</code> · 10:35:00 — Sponsor reel · 90s, locked timecode</li>
    </ul>

    <h2>Act III — Closing Block</h2>
    <ul>
      <li><code>Q10</code> · 11:50:00 — Single-cam (Cam-B) · PTZ preset 3</li>
      <li><code>Q11</code> · 11:54:00 — Curtain-call plate · cross-fade 1s</li>
      <li><code>Q12</code> · 11:58:00 — Audio bed up · -22 LUFS · 8s</li>
      <li><code>Q13</code> · 12:00:00 — Strike to walkout loop</li>
      <li><code>Q14</code> · 12:02:00 — House lights full (<strong>HOT</strong>)</li>
    </ul>

    <div className="callout">
      <strong
        style={{
          color: "var(--color-warn)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
        }}
      >
        STANDBY
      </strong>
      <div style={{ marginTop: 4 }}>
        Failover plates staged at <code>Q03</code> and <code>Q14</code>; manual recall via SM panel if{" "}
        <RefChip kind="asset" id="BMD-S40-001">SX40 #1</RefChip> drops. See{" "}
        <RefChip kind="doc" id="d-sop-cal">SOP · Wall Calibration §4</RefChip>.
      </div>
    </div>
  </>
);

const PatchListBody = () => (
  <>
    <h1>Patch List — Day 1</h1>
    <div className="meta-row">
      <span>REV v2.1</span>
      <span>EDITED Apr 27, 17:40 by K. Tanaka</span>
    </div>

    <p>
      Source-to-destination patch for Helios Day 1. Lane labels mirror the{" "}
      <RefChip kind="node" id="n4">System Designer</RefChip> view. Every patch is paired with a labeled
      cable on the runlist.
    </p>

    <h2>Video</h2>
    <ul>
      <li>
        <code>VID-01</code> · <RefChip kind="node" id="n1">Resolume Mac Pro</RefChip> →{" "}
        <RefChip kind="node" id="n3">vMix M4 IN-A</RefChip> · SDI #1 · 30m
      </li>
      <li>
        <code>VID-02</code> · <RefChip kind="node" id="n2">PTZ · Stage</RefChip> → vMix M4 IN-B · SDI #2 ·
        18m
      </li>
      <li>
        <code>VID-03</code> · vMix M4 OUT-A →{" "}
        <RefChip kind="asset" id="BMD-S40-001">SX40 #1</RefChip> · SDI #3 · 6m
      </li>
      <li>
        <code>VID-04</code> · vMix M4 OUT-B →{" "}
        <RefChip kind="asset" id="BMD-S40-002">SX40 #2</RefChip> · SDI #4 · 6m
      </li>
    </ul>

    <h2>Network</h2>
    <ul>
      <li>
        <code>NET-01</code> · SX40 #1 10GbE A →{" "}
        <RefChip kind="wall" id="W1">W1 · East Half</RefChip>
      </li>
      <li><code>NET-02</code> · SX40 #1 10GbE B → W1 · East Half (redundant)</li>
      <li><code>NET-03</code> · SX40 #2 10GbE A → W1 · West Half</li>
      <li><code>NET-04</code> · SX40 #2 10GbE B → W1 · West Half (redundant)</li>
    </ul>

    <h2>Audio</h2>
    <ul>
      <li>
        <code>AUD-01</code> · Mic 1–8 →{" "}
        <RefChip kind="asset" id="DGC-SD12-001">SD12 Local I/O 1</RefChip> · Cat-6a
      </li>
      <li>
        <code>AUD-02</code> · SD12 main out →{" "}
        <RefChip kind="asset" id="LA-12X-001">LA12X</RefChip> · AES/EBU pair 1
      </li>
      <li><code>AUD-03</code> · LA12X CH 1–2 → FOH array (L/R)</li>
      <li><code>AUD-04</code> · LA12X CH 3 → sub array (mono)</li>
    </ul>

    <h2>Power</h2>
    <ul>
      <li>
        <code>PWR-01</code> ·{" "}
        <RefChip kind="asset" id="DST-200A-01">Distro 200A</RefChip> CB-1 → Processor rack (32A 1ϕ)
      </li>
      <li><code>PWR-02</code> · Distro CB-2 → Audio rack (16A 1ϕ)</li>
      <li><code>PWR-03</code> · Distro CB-3 → W1 wall pwr (63A 3ϕ)</li>
    </ul>
  </>
);

const HandoffBody = () => (
  <>
    <h1>Handoff Notes — Helios</h1>
    <div className="meta-row">
      <span>REV v1.0</span>
      <span>EDITED Apr 28, 19:14 by S. Larsson</span>
      <span style={{ color: "var(--accent)" }}>● HANDED TO M. REYES</span>
    </div>

    <p>
      End-of-prep handoff from design to show ops. Open items must be resolved or owned before doors at{" "}
      <code>08:30 Day 2</code>.
    </p>

    <h2>Open Items</h2>
    <ul>
      <li>
        <strong>P1 ·</strong> Replace{" "}
        <RefChip kind="asset" id="ROE-RB2.6-A1">RB2.6 cabinet C7,R3</RefChip> — flagged ΔE 1.8 on second
        calibration pass. Hot spare staged stage-left.
      </li>
      <li>
        <strong>P2 ·</strong> Verify{" "}
        <RefChip kind="asset" id="BMD-S40-001">SX40 #1</RefChip> thermal logs before show. Last
        calibration sweep saw a brief 64°C spike on processor B.
      </li>
      <li>
        <strong>P3 ·</strong> Re-pin labels on PWR-02 / PWR-03 — both currently swapped on the truck-side
        label maker.
      </li>
    </ul>

    <h2>Show Ops Contacts</h2>
    <ul>
      <li>Director · M. Reyes · cue calls &amp; talent</li>
      <li>FOH · K. Tanaka · audio + processor watch</li>
      <li>Stage · S. Larsson · panel &amp; power</li>
      <li>Standby · J. Park · oncall radio Ch 4</li>
    </ul>

    <h2>Documents</h2>
    <ul>
      <li><RefChip kind="doc" id="d-prj-ros">Run-of-Show v3.2</RefChip> — locked</li>
      <li><RefChip kind="doc" id="d-prj-cue">Cue Sheet — Day 1</RefChip> — locked</li>
      <li><RefChip kind="doc" id="d-prj-pat">Patch List</RefChip> — v2.1</li>
      <li>
        <RefChip kind="doc" id="d-sop-cal">SOP · Wall Calibration</RefChip> — reference for §4 failover
      </li>
    </ul>

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
        Strike begins immediately after closing cue — see{" "}
        <RefChip kind="doc" id="d-sop-strk">SOP · Strike &amp; Pack-Out</RefChip>.
      </div>
    </div>
  </>
);

const SX40SpecBody = () => (
  <>
    <h1>Brompton SX40 — Manual</h1>
    <div className="meta-row">
      <span>REV v4.2.6</span>
      <span>EDITED Apr 10, 09:30 by K. Tanaka</span>
      <span>● VENDOR REFERENCE</span>
    </div>

    <p>
      The Brompton SX40 is the primary LED processor across all Blackburst shows. Each unit drives up to
      8.3 megapixels at 60 Hz with 12-bit HDR and per-cabinet calibration profiles.
    </p>

    <h2>Capacity</h2>
    <ul>
      <li>Pixel cap · <strong>8.3 M @ 60 Hz</strong> (4 × 10GbE)</li>
      <li>Frame rate · 23.98 / 24 / 25 / 29.97 / 30 / 50 / 59.94 / 60 / 120 Hz</li>
      <li>Bit depth · 12-bit HDR (PQ, HLG)</li>
      <li>Sync · genlock in/out, PTP v2 slave</li>
    </ul>

    <h2>Ports</h2>
    <ul>
      <li>4× SFP+ 10GbE data out</li>
      <li>2× 12G-SDI in (loop-through)</li>
      <li>2× HDMI 2.0 in</li>
      <li>1× DisplayPort 1.4 in (4K)</li>
    </ul>

    <h2>Fleet</h2>
    <ul>
      <li><RefChip kind="asset" id="BMD-S40-001" /> — primary, allocated to Helios Auditorium</li>
      <li><RefChip kind="asset" id="BMD-S40-002" /> — secondary, allocated to Helios Auditorium</li>
      <li><RefChip kind="asset" id="BMD-S40-003" /> — in maintenance · fan replacement Apr 30</li>
    </ul>

    <h2>Calibration</h2>
    <p>
      Per-cabinet calibration profiles are stored on the processor and loaded at boot. See{" "}
      <RefChip kind="doc" id="d-sop-cal">SOP · Wall Calibration</RefChip> for the field procedure.
    </p>
  </>
);

const RubyRBSpecBody = () => (
  <>
    <h1>ROE Ruby RB2.6 — Spec</h1>
    <div className="meta-row">
      <span>REV v1.2</span>
      <span>EDITED Apr 04, 11:22 by S. Larsson</span>
      <span>● VENDOR REFERENCE</span>
    </div>

    <p>
      The ROE Ruby RB2.6 is the standard 2.6 mm-pitch fine-pitch cabinet for indoor presentation walls.
      Used for the <RefChip kind="wall" id="W1">Main Lobby Wall</RefChip> (P2.6, 18×8, 9000×2080 native).
    </p>

    <h2>Cabinet</h2>
    <ul>
      <li>Pitch · 2.604 mm</li>
      <li>Cabinet · 500 × 500 mm · 192 × 192 px</li>
      <li>Weight · 7.4 kg</li>
      <li>Depth · 75 mm</li>
      <li>Refresh · 3840 Hz</li>
      <li>Peak brightness · 1500 nits (typ 800)</li>
    </ul>

    <h2>Power</h2>
    <ul>
      <li>Typical · 75 W / cabinet</li>
      <li>Peak · 180 W / cabinet</li>
      <li>Input · 100–240 V AC, 50/60 Hz</li>
      <li>Daisy chain · up to 8 cabinets per drop (16A)</li>
    </ul>

    <h2>Fleet</h2>
    <ul>
      <li><RefChip kind="asset" id="ROE-RB2.6-A1" /> — 24-pack on show</li>
      <li><RefChip kind="asset" id="ROE-RB2.6-A2" /> — 24-pack in warehouse</li>
    </ul>

    <h2>Notes</h2>
    <p>
      Pair only with calibrated <RefChip kind="asset" id="BMD-S40-001">SX40</RefChip> processors. Avoid
      stacking more than 16 vertical cabinets without a sub-truss; weight load exceeds rigging tolerance
      past row 16.
    </p>
  </>
);

const LA12XSpecBody = () => (
  <>
    <h1>L-Acoustics LA12X — Spec</h1>
    <div className="meta-row">
      <span>REV v1.1</span>
      <span>EDITED Mar 22, 14:08 by K. Tanaka</span>
      <span>● VENDOR REFERENCE</span>
    </div>

    <p>
      The LA12X is the standard 4-channel touring amplified controller. Drives FOH arrays for both Helios
      and KCR through the in-house <RefChip kind="node" id="n8">amplifier node</RefChip>.
    </p>

    <h2>Output</h2>
    <ul>
      <li>4 channels · 2600 W @ 8 Ω / 3300 W @ 4 Ω each</li>
      <li>Total peak · 12.8 kW</li>
      <li>L-DRIVE · current/thermal protection per channel</li>
    </ul>

    <h2>I/O</h2>
    <ul>
      <li>Analog · 4× XLR + 4× XLR thru</li>
      <li>Digital · 4× AES/EBU pair (8 channels)</li>
      <li>Network · AVB + L-NET</li>
    </ul>

    <h2>Fleet</h2>
    <ul>
      <li><RefChip kind="asset" id="LA-12X-001" /> — primary, deployed to Helios</li>
      <li><RefChip kind="asset" id="LA-12X-002" /> — in maintenance · fan cleanup May 04</li>
    </ul>

    <h2>Pairing</h2>
    <p>
      Always patch via <RefChip kind="asset" id="DGC-SD12-001">SD12</RefChip> AES out — do not run analog
      from console to amp for arena/auditorium FOH; the analog domain is reserved for stage monitors.
    </p>
  </>
);

const StrikeBody = () => (
  <>
    <h1>SOP · Strike &amp; Pack-Out</h1>
    <div className="meta-row">
      <span>REV v1.3</span>
      <span>EDITED Apr 21, 16:55 by S. Larsson</span>
    </div>

    <p>
      Strike runs in reverse order of <RefChip kind="doc" id="d-sop-load">SOP · Load-In</RefChip>. Owner
      is Stage; FOH releases the system after the final cue (
      <RefChip kind="doc" id="d-prj-cue">Q14</RefChip>).
    </p>

    <h2>§1 · System Down</h2>
    <ol>
      <li>
        Mute output on <RefChip kind="asset" id="LA-12X-001">LA12X</RefChip>; standby on console
      </li>
      <li>
        Hold <code>SHIFT</code> + <code>BYPASS</code> on the master{" "}
        <RefChip kind="asset" id="BMD-S40-001">SX40</RefChip>; both halves to black
      </li>
      <li>Power off processors; confirm green-to-amber LEDs on both units</li>
    </ol>

    <h2>§2 · Panels</h2>
    <ol>
      <li>Crew of 4 minimum at deck; one safety on truss</li>
      <li>De-rig right half first (reverse of load); pack in original numbered crates</li>
      <li>QC each cabinet · log faults · flag any exceeding ΔE 1.5 on last cal pass</li>
    </ol>

    <h2>§3 · Truss &amp; Cable</h2>
    <ol>
      <li>Lower truss to deck on motor only after all panels are crated</li>
      <li>Coil cable in figure-8; tag any with shield/jacket damage</li>
      <li>
        Distro <RefChip kind="asset" id="DST-200A-01">200A</RefChip> last out — verify all breakers
        tripped open
      </li>
    </ol>

    <h2>§4 · Inventory Return</h2>
    <p>
      All assets back to Inventory with QC pass. Maintenance flags go to the asset record at check-in —
      anything QC-failed gets <code>maint</code> status before the truck rolls.
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
        Strike is not complete until the truck manifest is signed by both Stage and FOH leads.
      </div>
    </div>
  </>
);

export const DOC_BODIES: Record<string, ReactNode> = {
  "d-prj-ros": <RunOfShowBody />,
  "d-prj-cue": <CueSheetBody />,
  "d-prj-pat": <PatchListBody />,
  "d-prj-ho": <HandoffBody />,
  "d-spec-sx40": <SX40SpecBody />,
  "d-spec-rb": <RubyRBSpecBody />,
  "d-spec-la": <LA12XSpecBody />,
  "d-sop-cal": <WallCalibrationBody />,
  "d-sop-load": <LoadInBody />,
  "d-sop-strk": <StrikeBody />,
};
