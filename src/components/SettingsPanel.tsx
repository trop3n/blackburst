import { useEffect } from "react";
import { I } from "@/components/Icon";
import { ACCENTS, useApp, type Tweaks } from "@/store/useApp";
import { useSettings } from "@/store/useSettings";
import type { AccentName, CanvasStyle, Density, Shell } from "@/types";

const DEFAULT_TWEAKS: Tweaks = {
  density: "normal",
  accent: "acid-green",
  shell: "rail",
  canvasStyle: "grid",
};

const DENSITIES: { id: Density; label: string; sub: string }[] = [
  { id: "compact", label: "Compact", sub: "Tight rows" },
  { id: "normal", label: "Normal", sub: "Default" },
  { id: "cozy", label: "Cozy", sub: "Spacious" },
];

const SHELLS: { id: Shell; label: string; sub: string }[] = [
  { id: "rail", label: "Rail", sub: "Icon sidebar" },
  { id: "tabs", label: "Tabs", sub: "Top tab strip" },
  { id: "palette", label: "Palette", sub: "⌘K only" },
];

const CANVASES: { id: CanvasStyle; label: string; sub: string }[] = [
  { id: "grid", label: "Grid", sub: "Dot grid" },
  { id: "blueprint", label: "Blueprint", sub: "Drafting lines" },
  { id: "schematic", label: "Schematic", sub: "Flat field" },
];

const ACCENT_NAMES: AccentName[] = ["acid-green", "amber", "cyan", "magenta", "white"];

export function SettingsPanel() {
  const open = useSettings((s) => s.open);
  const setOpen = useSettings((s) => s.setOpen);
  const tweaks = useApp((s) => s.tweaks);
  const setTweak = useApp((s) => s.setTweak);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  function reset() {
    (Object.keys(DEFAULT_TWEAKS) as (keyof Tweaks)[]).forEach((k) =>
      setTweak(k, DEFAULT_TWEAKS[k]),
    );
  }

  return (
    <div className="set-overlay" onMouseDown={() => setOpen(false)}>
      <div className="set-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="set-hd">
          <span className="set-hd-title">Workspace Settings</span>
          <button
            className="set-close"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close settings"
          >
            <I.Cross size={12} />
          </button>
        </div>

        <div className="set-body">
          <SettingsRow
            label="Density"
            sub="Row height & padding"
            options={DENSITIES}
            value={tweaks.density}
            onChange={(v) => setTweak("density", v)}
          />
          <SettingsRow
            label="Shell"
            sub="Navigation layout"
            options={SHELLS}
            value={tweaks.shell}
            onChange={(v) => setTweak("shell", v)}
          />
          <SettingsRow
            label="Canvas Style"
            sub="Background pattern on builders"
            options={CANVASES}
            value={tweaks.canvasStyle}
            onChange={(v) => setTweak("canvasStyle", v)}
          />

          <div className="set-row">
            <div className="set-row-meta">
              <span className="set-row-label">Accent</span>
              <span className="set-row-sub">UI highlight color</span>
            </div>
            <div className="set-swatches">
              {ACCENT_NAMES.map((name) => {
                const active = tweaks.accent === name;
                return (
                  <button
                    key={name}
                    type="button"
                    className="set-swatch"
                    data-active={active ? "1" : "0"}
                    onClick={() => setTweak("accent", name)}
                    aria-label={name}
                    title={name}
                    style={{ background: ACCENTS[name].c }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="set-foot">
          <button className="tb-btn" type="button" onClick={reset}>
            Reset to defaults
          </button>
          <span className="set-foot-spacer" />
          <button className="tb-btn" type="button" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface SettingsRowProps<T extends string> {
  label: string;
  sub: string;
  options: { id: T; label: string; sub: string }[];
  value: T;
  onChange: (v: T) => void;
}

function SettingsRow<T extends string>({ label, sub, options, value, onChange }: SettingsRowProps<T>) {
  return (
    <div className="set-row">
      <div className="set-row-meta">
        <span className="set-row-label">{label}</span>
        <span className="set-row-sub">{sub}</span>
      </div>
      <div className="set-seg">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="set-seg-btn"
            data-active={value === o.id ? "1" : "0"}
            onClick={() => onChange(o.id)}
            title={o.sub}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
