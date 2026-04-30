// icons.jsx — minimalist line icons for the AV/Production app

const Icon = ({ d, size = 16, stroke = 1.5, fill = "none", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Wall: ({ size }) => (
    <Icon size={size}>
      <rect x="3" y="4" width="18" height="14" rx="0.5" />
      <line x1="9" y1="4" x2="9" y2="18" />
      <line x1="15" y1="4" x2="15" y2="18" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </Icon>
  ),
  System: ({ size }) => (
    <Icon size={size}>
      <rect x="3" y="3" width="6" height="6" />
      <rect x="15" y="3" width="6" height="6" />
      <rect x="9" y="15" width="6" height="6" />
      <path d="M6 9v3h12V9" />
      <path d="M12 12v3" />
    </Icon>
  ),
  Inventory: ({ size }) => (
    <Icon size={size}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4" />
      <path d="M3 17l9 4 9-4" />
    </Icon>
  ),
  Rack: ({ size }) => (
    <Icon size={size}>
      <rect x="4" y="3" width="16" height="18" rx="0.5" />
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="11" x2="20" y2="11" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="4" y1="19" x2="20" y2="19" />
    </Icon>
  ),
  Docs: ({ size }) => (
    <Icon size={size}>
      <path d="M5 3h9l5 5v13H5z" />
      <path d="M14 3v5h5" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </Icon>
  ),
  Search: ({ size }) => (
    <Icon size={size}>
      <circle cx="11" cy="11" r="6" />
      <line x1="20" y1="20" x2="16" y2="16" />
    </Icon>
  ),
  Plus: ({ size = 14 }) => <Icon size={size} d="M12 5v14M5 12h14" />,
  Cross: ({ size = 14 }) => <Icon size={size} d="M6 6l12 12M18 6L6 18" />,
  Chev: ({ size = 12, dir = "right" }) => {
    const r = { right: 0, down: 90, left: 180, up: 270 }[dir];
    return <Icon size={size}><path d="M9 6l6 6-6 6" transform={`rotate(${r} 12 12)`} /></Icon>;
  },
  Layers: ({ size }) => (
    <Icon size={size}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </Icon>
  ),
  Bolt: ({ size }) => <Icon size={size} d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  Folder: ({ size = 14 }) => <Icon size={size} d="M3 5h6l2 2h10v12H3z" />,
  File: ({ size = 14 }) => (
    <Icon size={size}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
    </Icon>
  ),
  Pin: ({ size }) => <Icon size={size} d="M12 2L9 9l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z" />,
  Grid: ({ size }) => (
    <Icon size={size}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </Icon>
  ),
  Move: ({ size = 14 }) => <Icon size={size} d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" />,
  Eye: ({ size = 14 }) => (
    <Icon size={size}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  Lock: ({ size = 14 }) => (
    <Icon size={size}>
      <rect x="5" y="11" width="14" height="10" rx="1" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </Icon>
  ),
  Export: ({ size = 14 }) => <Icon size={size} d="M12 3v12M7 8l5-5 5 5M5 21h14" />,
  Settings: ({ size = 14 }) => (
    <Icon size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8L7 17M17 7l2.8-2.8" />
    </Icon>
  ),
};

window.I = I;
window.Icon = Icon;
