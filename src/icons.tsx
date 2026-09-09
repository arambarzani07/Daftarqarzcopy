import type { SVGProps } from 'react';

type IconName = 'mail' | 'search' | 'refresh' | 'personAdd' | 'calendar' | 'back' | 'person' | 'filter' | 'edit' | 'lock' | 'key' | 'clock' | 'grid' | 'message' | 'logout' | 'eye' | 'sun' | 'moon' | 'close' | 'plus' | 'trash';

const paths: Record<IconName, React.ReactNode> = {
  mail: <><rect x="3" y="5" width="18" height="14" rx="4"/><path d="m5 8 7 5 7-5"/></>,
  search: <><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M19 12a8 8 0 1 1-2.4-5.7L20 9"/></>,
  personAdd: <><circle cx="9" cy="8" r="4"/><path d="M2.5 21c.8-5 12.2-5 13 0M19 7v6M16 10h6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01"/></>,
  back: <><path d="m15 18-6-6 6-6"/></>, person: <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-6 15-6 16 0"/></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/><circle cx="8" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="12" cy="18" r="1"/></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13 7 4 4"/></>, lock: <><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  key: <><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3M14 9l2 2"/></>, clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  message: <><path d="M4 5h16v12H9l-5 4V5Z"/></>, logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M20 16.5A9 9 0 0 1 7.5 4 9 9 0 1 0 20 16.5Z"/>, close: <path d="m6 6 12 12M18 6 6 18"/>, plus: <path d="M12 5v14M5 12h14"/>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
