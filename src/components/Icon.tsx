import type { ReactNode } from "react";

const PATHS = {
  "arrow-right": <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />,
  "arrow-left": <path d="M20 12H5m0 0 5.5-5.5M5 12l5.5 5.5" />,
  "arrow-up-right": <path d="M7 17 17 7m0 0H8m9 0v9" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  bookmark: <path d="M6.5 4.5h11v15l-5.5-3.6-5.5 3.6z" />,
  flame: (
    <path d="M12 21c3.6 0 6-2.4 6-5.6 0-4.3-4.2-5.9-4.2-9.4 0-1.1.4-2 1-2.9-3.4.6-6.2 3.3-6.2 6.6 0 1.5.5 2.4 1.4 3.3-.2-1.4.2-2.7 1.2-3.8-.2 3.1 2.8 4.2 2.8 7 0 1.7-1.2 2.9-2 3.4" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  monitor: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M9 21h6M12 17v4" />
    </>
  ),
  shuffle: (
    <>
      <path d="M4 6h3.5c1.4 0 2.7.7 3.5 1.9l5 7.2c.8 1.2 2.1 1.9 3.5 1.9H21" />
      <path d="M18 13.5 21 17l-3 3.5M4 18h3.5c1.4 0 2.7-.7 3.5-1.9l1.2-1.7M13 8.6l1.2-1.7C15 5.7 16.3 5 17.7 5H21M18 1.5 21 5l-3 3.5" />
    </>
  ),
  play: <path d="M8 4.5v15l11-7.5z" />,
  flag: <path d="M5 21V4.5h8l.8 2H20l-2 5 2 5h-7.2l-.8-2H5" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.6 6M20 5v6h-6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 5 7 7-7 7" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5H10" />,
  download: <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 20h16" />,
  upload: <path d="M12 21V9m0 0 4.5 4.5M12 9 7.5 13.5M4 4h16" />,
  spark: <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z" />,
  layers: <path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" />,
  link: (
    <>
      <path d="M10 13.5a4.5 4.5 0 0 0 6.4 0l2.1-2.1a4.5 4.5 0 0 0-6.4-6.4L11 6.1" />
      <path d="M14 10.5a4.5 4.5 0 0 0-6.4 0l-2.1 2.1a4.5 4.5 0 0 0 6.4 6.4L13 17.9" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4.5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M12 13.5V18M8.5 21h7M10 18h4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.8 20h18.4z" />
      <path d="M12 9v5M12 17.2v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  sigma: <path d="M18 4H7l6 8-6 8h11" />,
  shapes: (
    <>
      <circle cx="8" cy="16" r="4" />
      <path d="m15 4 5 9h-10z" />
    </>
  ),
  function: <path d="M15 3h-2.5A2.5 2.5 0 0 0 10 5.5V21M7 9h7M14 13l4 8M18 13l-4 8" />,
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <circle cx="8" cy="8" r="1" />
      <circle cx="16" cy="8" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="8" cy="16" r="1" />
      <circle cx="16" cy="16" r="1" />
    </>
  ),
  pencil: <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM13.5 5.5l3 3" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.1M4 12h.1M4 18h.1" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
}

export function Icon({ name, size = 18, strokeWidth = 1.7, filled = false, className = "" }: IconProps) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
