import { useRef, useState } from "react";

interface NumFieldProps {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
}

// A number input that reports its value when the edit is finished, not on every
// keystroke. Committing per keystroke meant an emptied field parsed as the
// field's floor: clearing "12" to retype collapsed the wall to one column
// mid-edit, and in the rack it teleported the device to U1.
//
// Same draft/commit shape as the patch sheet's PatchCell — Enter commits, Escape
// reverts. Callers clamp inside onCommit (or let their store do it); a rejected
// or clamped value simply reappears from `value`, which is the feedback that a
// collided rack slot was refused.
export function NumField({ value, onCommit, min, max }: NumFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  // Mirrored in a ref because Escape clears the draft and then blurs in the same
  // tick: reading state in the blur handler would still see the pre-clear value
  // and commit the edit the user just abandoned.
  const draftRef = useRef<string | null>(null);
  const setBoth = (v: string | null) => {
    draftRef.current = v;
    setDraft(v);
  };

  const commit = () => {
    const raw = draftRef.current;
    setBoth(null);
    if (raw == null) return;
    // An empty or unparseable field means "never mind", not zero.
    const trimmed = raw.trim();
    if (trimmed === "") return;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;
    onCommit(n);
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={draft ?? String(value)}
      onChange={(e) => setBoth(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setBoth(null);
          e.currentTarget.blur();
        }
      }}
    />
  );
}
