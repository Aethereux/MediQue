/* MediQue.ph — icon set (Lucide-style outline, consistent 2px stroke) */

import type { CSSProperties, ReactElement, ReactNode } from 'react';

export interface IconProps {
  size?: number;
  sw?: number;
  style?: CSSProperties;
  className?: string;
}

interface IconFullProps extends IconProps {
  d?: string;
  paths?: ReactNode;
  fill?: string;
}

export const Icon = ({ d, paths, size = 22, fill = 'none', sw = 2, style, ...rest }: IconFullProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0, ...style }} {...rest}>
    {d ? <path d={d} /> : paths}
  </svg>
);

export const I: Record<string, (p?: IconProps) => ReactElement> = {
  // brand mark glyph (cross + clock) handled separately
  heart: (p) => <Icon {...p} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3 5.5 5.5 0 0 0 12 5.5 5.5 5.5 0 0 0 7.5 3 5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />,
  baby: (p) => <Icon {...p} paths={<><path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></>} />,
  bone: (p) => <Icon {...p} d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />,
  stethoscope: (p) => <Icon {...p} paths={<><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></>} />,
  sparkle: (p) => <Icon {...p} d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />,
  flower: (p) => <Icon {...p} paths={<><circle cx="12" cy="12" r="3"/><path d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm3-9a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm-12 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"/></>} />,
  activity: (p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  ear: (p) => <Icon {...p} d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0M6.5 12.5a3.5 3.5 0 0 1 4-3.5" />,
  brain: (p) => <Icon {...p} d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Zm0 0a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" sw={1.7} />,
  users: (p) => <Icon {...p} paths={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>} />,
  search: (p) => <Icon {...p} paths={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>} />,
  calendar: (p) => <Icon {...p} paths={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>} />,
  calendarCheck: (p) => <Icon {...p} paths={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></>} />,
  clock: (p) => <Icon {...p} paths={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />,
  mapPin: (p) => <Icon {...p} paths={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>} />,
  video: (p) => <Icon {...p} paths={<><path d="m16 10 4.6-2.3A1 1 0 0 1 22 8.6v6.8a1 1 0 0 1-1.4.9L16 14"/><rect x="2" y="6" width="14" height="12" rx="2"/></>} />,
  building: (p) => <Icon {...p} paths={<><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></>} />,
  check: (p) => <Icon {...p} d="M20 6 9 17l-5-5" />,
  checkCircle: (p) => <Icon {...p} paths={<><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></>} />,
  chevronLeft: (p) => <Icon {...p} d="m15 18-6-6 6-6" />,
  chevronRight: (p) => <Icon {...p} d="m9 18 6-6-6-6" />,
  chevronDown: (p) => <Icon {...p} d="m6 9 6 6 6-6" />,
  arrowRight: (p) => <Icon {...p} d="M5 12h14m-7-7 7 7-7 7" />,
  arrowLeft: (p) => <Icon {...p} d="M19 12H5m7 7-7-7 7-7" />,
  menu: (p) => <Icon {...p} d="M4 6h16M4 12h16M4 18h16" />,
  x: (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" />,
  home: (p) => <Icon {...p} paths={<><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 21v-7h6v7"/></>} />,
  user: (p) => <Icon {...p} paths={<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>} />,
  list: (p) => <Icon {...p} paths={<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>} />,
  bell: (p) => <Icon {...p} paths={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>} />,
  mail: (p) => <Icon {...p} paths={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></>} />,
  phone: (p) => <Icon {...p} d="M13.8 10.2a8 8 0 0 0 3.5 3.5l1.2-1.6a1 1 0 0 1 1.1-.35 9.5 9.5 0 0 0 2.3.5 1 1 0 0 1 .9 1v3a1 1 0 0 1-1 1A17 17 0 0 1 5.3 4 1 1 0 0 1 6.3 3h3a1 1 0 0 1 1 .9 9.5 9.5 0 0 0 .5 2.3 1 1 0 0 1-.35 1.1Z" />,
  lock: (p) => <Icon {...p} paths={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>} />,
  eye: (p) => <Icon {...p} paths={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>} />,
  eyeOff: (p) => <Icon {...p} d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.1 2.9M6.6 6.6A13.3 13.3 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 4.4-1.1M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  alertTriangle: (p) => <Icon {...p} paths={<><path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>} />,
  info: (p) => <Icon {...p} paths={<><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></>} />,
  alertCircle: (p) => <Icon {...p} paths={<><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></>} />,
  star: (p) => <Icon {...p} fill="currentColor" sw={0} d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.5l1.2-6.5-4.8-4.6 6.6-.9Z" />,
  plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  logOut: (p) => <Icon {...p} paths={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>} />,
  shield: (p) => <Icon {...p} paths={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>} />,
  edit: (p) => <Icon {...p} paths={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></>} />,
  external: (p) => <Icon {...p} paths={<><path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>} />,
  sliders: (p) => <Icon {...p} paths={<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></>} />,
  zap: (p) => <Icon {...p} d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />,
  layers: (p) => <Icon {...p} paths={<><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>} />,
  calendarPlus: (p) => <Icon {...p} paths={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></>} />,
  arrowUpRight: (p) => <Icon {...p} d="M7 17 17 7M7 7h10v10" />,
  send: (p) => <Icon {...p} d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />,
  trash: (p) => <Icon {...p} paths={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></>} />,
  refresh: (p) => <Icon {...p} d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16m0 5v-5h5" />,
  pin: (p) => <Icon {...p} paths={<><path d="M12 17v5M9 10.8V7a3 3 0 0 1 6 0v3.8c0 1 .6 2 1.5 2.4L18 14H6l1.5-.8c.9-.4 1.5-1.4 1.5-2.4Z"/></>} />,
};

// Logo mark: rounded medical cross fused with a clock tick
export const LogoMark = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="36" height="36" rx="11" fill="var(--c-primary)"/>
    <path d="M20 10v8.5M20 18.5h8.5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"/>
    <path d="M20 18.5v8a8 8 0 0 1-8-8V14a8 8 0 0 1 8-4" stroke="rgba(255,255,255,.55)" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="18.5" r="2.4" fill="var(--c-accent)"/>
  </svg>
);

export const SpecIcon = ({ name, ...p }: { name: string } & IconProps) => {
  const fn = I[name];
  return fn ? fn(p) : I.stethoscope(p);
};
