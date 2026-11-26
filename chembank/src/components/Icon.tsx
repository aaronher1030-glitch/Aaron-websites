import type { ReactNode } from "react";

export type IconName =
  | "book"
  | "flask"
  | "target"
  | "timer"
  | "chart"
  | "repeat"
  | "search"
  | "check"
  | "close"
  | "flag"
  | "chevron-right"
  | "arrow-left"
  | "arrow-right"
  | "sun"
  | "moon"
  | "strike";

/* Hand-drawn line geometry on a 24px grid; no external assets. */
const GEOMETRY: Record<IconName, ReactNode> = {
  book: (
    <>
      <path d="M12 6.6C10.8 5.3 8.9 4.7 6.4 4.7H3.8v13.6h2.6c2.5 0 4.4.6 5.6 1.7 1.2-1.1 3.1-1.7 5.6-1.7h2.6V4.7h-2.6c-2.5 0-4.4.6-5.6 1.9Z" />
      <path d="M12 6.6V20" />
    </>
  ),
  flask: (
    <>
      <path d="M9.4 3h5.2" />
      <path d="M10.4 3v5.3L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3l-4.9-8.7V3" />
      <path d="M7.6 14.6h8.8" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.1" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  timer: (
    <>
      <path d="M9.6 2.9h4.8" />
      <path d="M12 2.9v2.3" />
      <circle cx="12" cy="13.3" r="7.2" />
      <path d="M12 9.8v3.5l2.3 1.4" />
    </>
  ),
  chart: (
    <>
      <path d="M4.6 4.4v15.2h15" />
      <path d="M8.4 16.2v-4.4" />
      <path d="M12.4 16.2V7.8" />
      <path d="M16.4 16.2v-6.4" />
    </>
  ),
  repeat: (
    <>
      <path d="M4.5 9.6A3.6 3.6 0 0 1 8.1 6h11" />
      <path d="m16 3 3 3-3 3" />
      <path d="M19.5 14.4a3.6 3.6 0 0 1-3.6 3.6h-11" />
      <path d="m8 15-3 3 3 3" />
    </>
  ),
  search: (
    <>
      <circle cx="10.7" cy="10.7" r="6.2" />
      <path d="m15.3 15.3 4.2 4.2" />
    </>
  ),
  check: <path d="m5 12.6 4.5 4.4L19 6.6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  flag: (
    <>
      <path d="M6.2 21V3.4" />
      <path d="M6.2 5.2c1.8-1.1 3.7-1.1 5.5 0s3.7 1.1 5.5 0v7.6c-1.8 1.1-3.7 1.1-5.5 0s-3.7-1.1-5.5 0Z" />
    </>
  ),
  "chevron-right": <path d="m9.6 5.4 6.6 6.6-6.6 6.6" />,
  "arrow-left": (
    <>
      <path d="M19.2 12H5" />
      <path d="m10.5 6.4-5.5 5.6 5.5 5.6" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M4.8 12h14.2" />
      <path d="m13.5 6.4 5.5 5.6-5.5 5.6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.1" />
      <path d="M12 2.7v2.2M12 19.1v2.2M2.7 12h2.2M19.1 12h2.2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5" />
    </>
  ),
  moon: <path d="M20.2 14.3A8.4 8.4 0 0 1 9.7 3.8 8.4 8.4 0 1 0 20.2 14.3Z" />,
  strike: (
    <>
      <path d="M4.6 12h14.8" />
      <path d="M8.1 7.7c.5-1.6 1.9-2.6 4-2.6 2.4 0 4 1.2 4.3 2.9" />
      <path d="M15.9 16c-.6 1.4-1.9 2.2-3.9 2.2-2.3 0-4-1.1-4.3-2.8" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  title,
  className,
}: {
  name: IconName;
  size?: number;
  title?: string;
  className?: string;
}) {
  const labelled = Boolean(title);
  return (
    <svg
      className={`icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : "true"}
      focusable={labelled ? undefined : "false"}
    >
      {labelled ? <title>{title}</title> : null}
      {GEOMETRY[name]}
    </svg>
  );
}
