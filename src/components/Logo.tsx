import { APP_NAME } from "../config";

export function Logo() {
  return (
    <span className="brand">
      <svg
        className="brand-mark"
        viewBox="0 0 36 38"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className="brand-mark-ring"
          d="M18 2.5 32.5 11v17L18 36.5 3.5 28V11Z"
        />
        <circle className="brand-mark-core" cx="18" cy="19" r="6.25" />
        <path className="brand-mark-tick" d="M18 2.5v4.2M18 33.5v4.2" />
      </svg>
      <span className="brand-text">
        <span className="brand-name">{APP_NAME}</span>
        <span className="brand-sub">PNCO · ACho reviewer</span>
      </span>
    </span>
  );
}
