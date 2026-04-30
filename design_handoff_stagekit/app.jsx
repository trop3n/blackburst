// app.jsx — main app entry

const { Rail, Tabs, Topbar, StatusBar, LedWallModule, SystemDesignerModule, RackBuilderModule, InventoryModule, DocsModule } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "normal",
  "accent": "acid-green",
  "shell": "rail",
  "canvasStyle": "grid"
}/*EDITMODE-END*/;

const ACCENTS = {
  "acid-green":  { c: "oklch(0.86 0.19 145)", dim: "oklch(0.86 0.19 145 / 0.18)", faint: "oklch(0.86 0.19 145 / 0.08)" },
  "amber":       { c: "oklch(0.82 0.17 70)",  dim: "oklch(0.82 0.17 70 / 0.18)",  faint: "oklch(0.82 0.17 70 / 0.08)" },
  "cyan":        { c: "oklch(0.82 0.13 220)", dim: "oklch(0.82 0.13 220 / 0.18)", faint: "oklch(0.82 0.13 220 / 0.08)" },
  "magenta":     { c: "oklch(0.78 0.22 330)", dim: "oklch(0.78 0.22 330 / 0.18)", faint: "oklch(0.78 0.22 330 / 0.08)" },
  "white":       { c: "oklch(0.96 0 0)",      dim: "oklch(0.96 0 0 / 0.18)",      faint: "oklch(0.96 0 0 / 0.06)" },
};

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [module, setModule] = React.useState("wall");
  const project = { id: "PRJ-2451", name: "Atrium Lobby Wall", client: "Northwind HQ" };

  // Apply tweaks to root data attributes + accent CSS vars
  React.useEffect(() => {
    document.documentElement.dataset.density = tw.density;
    document.documentElement.dataset.shell = tw.shell;
    const a = ACCENTS[tw.accent] || ACCENTS["acid-green"];
    document.documentElement.style.setProperty("--accent", a.c);
    document.documentElement.style.setProperty("--accent-dim", a.dim);
    document.documentElement.style.setProperty("--accent-faint", a.faint);
  }, [tw]);

  return (
    <div className="app">
      <Rail module={module} setModule={setModule} />
      <Topbar module={module} project={project} />
      {tw.shell === "tabs" && <Tabs module={module} setModule={setModule} />}
      <main className="main">
        {module === "wall"   && <LedWallModule canvasStyle={tw.canvasStyle} />}
        {module === "system" && <SystemDesignerModule />}
        {module === "rack"   && <RackBuilderModule />}
        {module === "inv"    && <InventoryModule />}
        {module === "docs"   && <DocsModule />}
      </main>
      <StatusBar module={module} project={project} />

      <TweaksPanel title="STAGEKIT · Tweaks">
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={tw.density}
          options={["compact", "normal", "cozy"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Shell" value={tw.shell}
          options={[
            { value: "rail", label: "Rail" },
            { value: "tabs", label: "Tabs" },
            { value: "palette", label: "⌘K" },
          ]}
          onChange={(v) => setTweak("shell", v)} />
        <TweakSection label="Theme" />
        <TweakSelect label="Accent" value={tw.accent}
          options={[
            { value: "acid-green", label: "Acid green (oscilloscope)" },
            { value: "amber",      label: "Amber (broadcast)" },
            { value: "cyan",       label: "Cyan (signal)" },
            { value: "magenta",    label: "Magenta (video)" },
            { value: "white",      label: "Mono (no accent)" },
          ]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="LED Canvas" />
        <TweakRadio label="Canvas style" value={tw.canvasStyle}
          options={[
            { value: "grid",      label: "Grid" },
            { value: "blueprint", label: "Blueprint" },
            { value: "schematic", label: "Schem." },
          ]}
          onChange={(v) => setTweak("canvasStyle", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
