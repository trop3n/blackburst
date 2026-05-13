import type { DocVersion } from "@/types";

export const INITIAL_VERSIONS: Record<string, DocVersion[]> = {
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
  "d-prj-cue": [
    { v: "v3.2", who: "M. Reyes", when: "Apr 28, 14:22", note: "Locked for show" },
    { v: "v3.1", who: "M. Reyes", when: "Apr 27, 17:50", note: "Added Q08 audio scene B" },
    { v: "v3.0", who: "K. Tanaka", when: "Apr 25, 11:08", note: "Cue numbering re-aligned to ROS v3.0" },
  ],
  "d-prj-pat": [
    { v: "v2.1", who: "K. Tanaka", when: "Apr 27, 17:40", note: "Swapped PWR-02/03 labeling" },
    { v: "v2.0", who: "K. Tanaka", when: "Apr 24, 09:40", note: "Initial tech-week patch" },
  ],
  "d-prj-ho": [
    { v: "v1.0", who: "S. Larsson", when: "Apr 28, 19:14", note: "Handed to show ops" },
  ],
  "d-spec-sx40": [
    { v: "v4.2.6", who: "K. Tanaka", when: "Apr 10, 09:30", note: "Firmware reference updated" },
    { v: "v4.2.4", who: "K. Tanaka", when: "Feb 18, 13:11", note: "Initial vendor doc import" },
  ],
  "d-spec-rb": [
    { v: "v1.2", who: "S. Larsson", when: "Apr 04, 11:22", note: "Added rigging tolerance note" },
    { v: "v1.1", who: "S. Larsson", when: "Mar 18, 10:00", note: "Power figures from vendor data sheet" },
  ],
  "d-spec-la": [
    { v: "v1.1", who: "K. Tanaka", when: "Mar 22, 14:08", note: "Added AVB / L-NET note" },
  ],
  "d-sop-strk": [
    { v: "v1.3", who: "S. Larsson", when: "Apr 21, 16:55", note: "QC log step expanded" },
    { v: "v1.2", who: "S. Larsson", when: "Feb 12, 08:30", note: "Initial draft" },
  ],
};

export function bumpVersion(prev: string | undefined): string {
  if (!prev) return "v1.0";
  const stripped = prev.replace(/^v/i, "");
  const parts = stripped.split(".");
  if (parts.length === 0) return "v1.0";
  const last = parseInt(parts[parts.length - 1], 10);
  if (Number.isNaN(last)) return "v1.0";
  parts[parts.length - 1] = String(last + 1);
  return "v" + parts.join(".");
}

export function nowStamp(d: Date = new Date()): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hh}:${mm}`;
}
