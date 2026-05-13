import type { DocComment } from "@/types";

export const INITIAL_COMMENTS: Record<string, DocComment[]> = {
  "d-prj-ros": [
    { who: "K. Tanaka", t: "12m", c: "Shifted cue 14 by +2s — confirmed with director." },
    { who: "S. Larsson", t: "1h", c: "Need a hot spare staged stage-left for SX40 #1." },
  ],
  "d-prj-cue": [
    { who: "M. Reyes", t: "20m", c: "Locking — confirmed Q14 hot with FOH." },
  ],
  "d-prj-ho": [
    { who: "S. Larsson", t: "1h", c: "P1 cabinet swap is staged — RB2.6 hot spare deck-right." },
    { who: "K. Tanaka", t: "55m", c: "P2 thermal: pulling SX40 #1 logs at 07:30 walk-through." },
  ],
};
