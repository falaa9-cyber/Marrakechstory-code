// ============================================
// FITNESS APP — icon set (SF Symbols-style line icons)
// All icons are stroke-based, currentColor, 24x24 viewBox.
// ============================================

const FaIcon = ({ size = 22, stroke = 2, children, fill = 'none', ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children}
  </svg>
);

const FaIcons = {
  Today: (p) => <FaIcon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></FaIcon>,
  Dumbbell: (p) => <FaIcon {...p}>
    <rect x="2" y="9" width="3" height="6" rx="1"/>
    <rect x="19" y="9" width="3" height="6" rx="1"/>
    <rect x="6" y="7" width="3" height="10" rx="1"/>
    <rect x="15" y="7" width="3" height="10" rx="1"/>
    <path d="M9 12h6"/>
  </FaIcon>,
  Fork: (p) => <FaIcon {...p}>
    <path d="M7 3v8a2 2 0 0 0 2 2v8"/>
    <path d="M11 3v6"/>
    <path d="M5 3v6"/>
    <path d="M17 3c-2 0-3 2-3 4s1 4 3 4v10"/>
  </FaIcon>,
  Chart: (p) => <FaIcon {...p}>
    <path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/>
  </FaIcon>,
  Profile: (p) => <FaIcon {...p}><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.2 4-5 7-5s5.8 1.8 7 5"/></FaIcon>,

  Play: (p) => <FaIcon fill="currentColor" stroke="none" {...p}><path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5z"/></FaIcon>,
  Check: (p) => <FaIcon stroke={2.4} {...p}><path d="M5 12.5l4.5 4.5L19 7.5"/></FaIcon>,
  ChevR: (p) => <FaIcon stroke={2.4} {...p}><path d="M9 6l6 6-6 6"/></FaIcon>,
  ChevL: (p) => <FaIcon stroke={2.4} {...p}><path d="M15 6l-6 6 6 6"/></FaIcon>,
  ChevDown: (p) => <FaIcon stroke={2.4} {...p}><path d="M6 9l6 6 6-6"/></FaIcon>,
  Plus: (p) => <FaIcon stroke={2.4} {...p}><path d="M12 5v14M5 12h14"/></FaIcon>,
  Minus: (p) => <FaIcon stroke={2.4} {...p}><path d="M5 12h14"/></FaIcon>,
  Settings: (p) => <FaIcon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></FaIcon>,
  Bell: (p) => <FaIcon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></FaIcon>,
  Flame: (p) => <FaIcon {...p}><path d="M12 2.5c1 4 5 5 5 9.5a5 5 0 1 1-10 0c0-2 1-3 2-4 0 1 1 2 2 2 0-3 0-5 1-7.5z"/></FaIcon>,
  Heart: (p) => <FaIcon {...p}><path d="M20.8 6.6a5 5 0 0 0-7-1l-1.8 1.7-1.8-1.7a5 5 0 1 0-7 7L12 21l8.8-8.4a5 5 0 0 0 0-6z"/></FaIcon>,
  Drop: (p) => <FaIcon {...p}><path d="M12 3s6 6 6 11a6 6 0 1 1-12 0c0-5 6-11 6-11z"/></FaIcon>,
  Steps: (p) => <FaIcon {...p}><path d="M9 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M14 4.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M18.5 7a1.7 1.7 0 1 1-3.5 0 1.7 1.7 0 0 1 3.5 0z"/><path d="M21 10a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0z"/><path d="M4 14l3-2 4 3 5-3 4 3"/><path d="M5 20l3-3 4 3 5-3"/></FaIcon>,
  Clock: (p) => <FaIcon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></FaIcon>,
  Camera: (p) => <FaIcon {...p}><path d="M3 8a2 2 0 0 1 2-2h3l1.5-2h5L16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/><circle cx="12" cy="13" r="3.5"/></FaIcon>,
  Scale: (p) => <FaIcon {...p}><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 9a3 3 0 1 1 6 0"/><path d="M12 9v3"/></FaIcon>,
  Ruler: (p) => <FaIcon {...p}><rect x="3" y="9" width="18" height="6" rx="1.5"/><path d="M7 9v3M11 9v4M15 9v3M19 9v4"/></FaIcon>,
  Target: (p) => <FaIcon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></FaIcon>,
  Bolt: (p) => <FaIcon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></FaIcon>,
  Apple: (p) => <FaIcon {...p}><path d="M17 13c0-2.7 2-4 2-4a4.5 4.5 0 0 0-3.5-2c-1.5 0-2.5 1-3.5 1s-2-1-3.5-1A4.5 4.5 0 0 0 5 13c0 3 2 8 4 8 1 0 1.5-.7 3-.7s2 .7 3 .7c2 0 4-5 4-8z"/><path d="M12 7s.5-2.5 2.5-3"/></FaIcon>,
  Edit: (p) => <FaIcon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></FaIcon>,
  Sparkle: (p) => <FaIcon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></FaIcon>,
  Calendar: (p) => <FaIcon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></FaIcon>,
  Logout: (p) => <FaIcon {...p}><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/></FaIcon>,
  Sun: (p) => <FaIcon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></FaIcon>,
  Moon: (p) => <FaIcon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></FaIcon>,
};

window.FaIcons = FaIcons;
window.FaIcon = FaIcon;
