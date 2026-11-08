import type { ReactNode } from "react";

type Variant = "navy" | "mint" | "deep" | "paper";

export function Band({
  variant = "navy",
  className = "",
  id,
  children,
}: {
  variant?: Variant;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`band band--${variant} ${className}`.trim()}>
      <div className="band__inner">{children}</div>
    </section>
  );
}

export function SectionTitle({
  title,
  lead,
  as: Heading = "h2",
}: {
  title: string;
  lead?: string;
  as?: "h2" | "h3";
}) {
  return (
    <header className="section-title">
      <Heading>{title}</Heading>
      {lead ? <p>{lead}</p> : null}
    </header>
  );
}

export function CtaBar({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      className="cta-bar"
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span>{children}</span>
    </a>
  );
}
