// shell.jsx — App shell (rail, topbar, statusbar)

const { I, Icon } = window;

function RailButton({ id, label, active, onClick, children }) {
  return (
    <button className="rail-btn" data-active={active ? "1" : "0"} onClick={onClick}>
      <span className="ico">{children}</span>
      <span className="lbl">{label}</span>
    </button>
  );
}

function Rail({ module, setModule }) {
  const items = [
    { id: "wall",   label: "WALL", icon: <I.Wall size={18} /> },
    { id: "system", label: "SYS",  icon: <I.System size={18} /> },
    { id: "rack",   label: "RACK", icon: <I.Rack size={18} /> },
    { id: "inv",    label: "INV",  icon: <I.Inventory size={18} /> },
    { id: "docs",   label: "DOCS", icon: <I.Docs size={18} /> },
  ];
  return (
    <aside className="rail">
      <div className="rail-logo">SK</div>
      <div className="rail-section">
        {items.map((it) => (
          <RailButton key={it.id} id={it.id} label={it.label}
                      active={module === it.id}
                      onClick={() => setModule(it.id)}>
            {it.icon}
          </RailButton>
        ))}
      </div>
      <div className="rail-spacer" />
      <div className="rail-section" style={{ borderBottom: 0, borderTop: "1px solid var(--line)" }}>
        <RailButton label="SET"><I.Settings size={16} /></RailButton>
      </div>
    </aside>
  );
}

function Tabs({ module, setModule }) {
  const items = [
    { id: "wall",   label: "LED Wall Builder", num: "01" },
    { id: "system", label: "System Designer",  num: "02" },
    { id: "rack",   label: "Rack Builder",     num: "03" },
    { id: "inv",    label: "Inventory",        num: "04" },
    { id: "docs",   label: "Documentation",    num: "05" },
  ];
  return (
    <div className="tabs">
      {items.map((it) => (
        <div key={it.id} className="tabs-pill"
             data-active={module === it.id ? "1" : "0"}
             onClick={() => setModule(it.id)}>
          <span className="num-badge">{it.num}</span>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function Topbar({ module, project }) {
  const moduleLabels = {
    wall: "LED Wall Builder",
    system: "System Designer",
    rack: "Rack Builder",
    inv: "Asset & Inventory",
    docs: "Documentation Hub",
  };
  return (
    <header className="topbar">
      <div className="topbar-section">
        <span className="proj-pill mono">{project.id}</span>
        <span style={{ color: "var(--fg)" }}>{project.name}</span>
        <span className="chip">{project.client}</span>
      </div>
      <div className="topbar-section">
        <span className="crumb mono">PROJECTS</span>
        <span className="crumb-sep">/</span>
        <span className="crumb mono">{project.id}</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-curr mono">{moduleLabels[module]}</span>
      </div>
      <div className="spacer" />
      <div className="topbar-section" style={{ borderRight: 0, paddingRight: 0 }}>
        <div className="cmdk">
          <I.Search size={12} />
          <span>Search assets, docs, panels…</span>
          <kbd>⌘K</kbd>
        </div>
        <button className="tb-btn"><I.Export size={13} /> Export</button>
        <button className="tb-btn primary"><I.Plus size={13} /> Save Rev</button>
        <div className="user-chip">
          <div className="avatar">MR</div>
        </div>
      </div>
    </header>
  );
}

function StatusBar({ module, project }) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const tt = now.toTimeString().slice(0, 8);
  return (
    <footer className="statusbar">
      <div className="seg"><span className="dot" /> READY</div>
      <div className="seg">REV 0042</div>
      <div className="seg">SYNC ↑ 14:22:08</div>
      <div className="seg"><span className="dot warn" /> 2 WARNINGS</div>
      <div className="spacer" />
      <div className="seg">{project.id}</div>
      <div className="seg">UTC-{("0" + (new Date()).getTimezoneOffset()/60).toString().replace("-","")}</div>
      <div className="seg" style={{ color: "var(--accent)" }}>{tt}</div>
    </footer>
  );
}

Object.assign(window, { Rail, Tabs, Topbar, StatusBar });
