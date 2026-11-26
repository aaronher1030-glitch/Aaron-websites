import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";
import type { Difficulty, Domain } from "../data/types";

export function domainSlug(domain: Domain): string {
  return domain.toLowerCase().replace(/\s+/g, "-");
}

export function DomainBadge({ domain }: { domain: Domain }) {
  return (
    <span className={`domain-badge domain-${domainSlug(domain)}`}>
      <span className="domain-dot" aria-hidden="true" />
      {domain}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`difficulty difficulty-${difficulty.toLowerCase()}`}>{difficulty}</span>;
}

const TYPE_META: Record<string, { label: string; icon: IconName }> = {
  int: { label: "Short answer", icon: "pencil" },
  mc: { label: "Multiple choice", icon: "list" },
  proof: { label: "Proof", icon: "book" },
};

export function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? { label: type, icon: "pencil" as IconName };
  return (
    <span className="type-badge">
      <Icon name={meta.icon} size={13} />
      {meta.label}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo ${className}`.trim()}>
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="32" height="32">
          <rect width="32" height="32" rx="8" fill="currentColor" />
          <path
            d="M9.5 23.5 16 8.5l6.5 15M12.8 18.8h6.4"
            fill="none"
            stroke="#f7f2e7"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="23.5" cy="8.5" r="2.4" fill="#e8663a" />
        </svg>
      </span>
      <span className="logo-word">Lemma</span>
    </span>
  );
}

export function ProgressRing({
  value,
  size = 104,
  label,
  sublabel,
  tone = "brand",
}: {
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
  tone?: "brand" | "orange";
}) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (safe / 100) * circumference;
  return (
    <div className={`ring ring-${tone}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="ring-value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="ring-center">
        <span className="ring-label">{label ?? `${safe}%`}</span>
        {sublabel ? <span className="ring-sub">{sublabel}</span> : null}
      </div>
    </div>
  );
}

export function Bar({ value, tone = "brand" }: { value: number | null; tone?: "brand" | "orange" | "muted" }) {
  const width = value === null ? 0 : Math.max(2, Math.min(100, value));
  return (
    <div className="bar" role="presentation">
      <span className={`bar-fill bar-${tone}`} style={{ width: `${value === null ? 0 : width}%` }} />
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        {text ? <p className="section-text">{text}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
