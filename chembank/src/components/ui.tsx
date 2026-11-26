import type { ReactNode } from "react";
import type { Difficulty, Domain, Question, SourceKind } from "../data/types";
import { Icon } from "./Icon";

const SOURCE_LABEL: Record<SourceKind, string> = {
  "supplied-paper": "Supplied paper",
  textbook: "Textbook",
  mixed: "Merged source",
  "gap-fill": "Gap fill",
};

export function DomainBadge({ domain }: { domain: Domain }) {
  return (
    <span className="badge badge-domain" data-domain={domain.toLowerCase()}>
      {domain}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="badge badge-difficulty" data-difficulty={difficulty.toLowerCase()}>
      {difficulty}
    </span>
  );
}

export function SourceBadge({ source }: { source: SourceKind }) {
  return (
    <span className="badge badge-source" data-source={source}>
      {SOURCE_LABEL[source]}
    </span>
  );
}

export function VerificationBadge({ verified }: { verified: Question["verified"] }) {
  const flagged = verified.status === "flagged";
  return (
    <span className="badge badge-verified" data-status={verified.status}>
      <Icon name={flagged ? "flag" : "check"} size={13} />
      {flagged ? "Flagged" : "Blind-verified"}
    </span>
  );
}

export function SectionHead({ eyebrow, title, lede, actions, id }: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <header className="section-head">
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      {lede ? <p className="section-lede">{lede}</p> : null}
      {actions ? <div className="section-actions">{actions}</div> : null}
    </header>
  );
}

type MeterTone = "cobalt" | "acid" | "copper" | "hazard";

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), Math.max(max, 0));
}

export function Bar({ value, max = 100, label, tone = "cobalt" }: {
  value: number;
  max?: number;
  label?: string;
  tone?: MeterTone;
}) {
  const clamped = clamp(value, max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;
  return (
    <div
      className="bar"
      data-tone={tone}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-label={label}
    >
      <span className="bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function ProgressRing({ value, max = 100, size = 72, label, tone = "cobalt" }: {
  value: number;
  max?: number;
  size?: number;
  label: string;
  tone?: MeterTone;
}) {
  const clamped = clamp(value, max);
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;
  const stroke = Math.max(4, Math.round(size / 12));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = (percent / 100) * circumference;
  const center = size / 2;
  return (
    <div className="progress-ring" data-tone={tone} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label}, ${percent}%`}
        focusable="false"
      >
        <circle
          className="progress-ring-track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="progress-ring-fill"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference - arc}`}
        />
      </svg>
      <span className="progress-ring-value" aria-hidden="true">
        {percent}%
      </span>
    </div>
  );
}
