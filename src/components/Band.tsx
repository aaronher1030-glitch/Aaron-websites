import type { ReactNode } from "react";
import { Link, useInRouterContext } from "react-router-dom";

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
  // An internal href is a route change, so it goes through the router: a full
  // document load would drop focus (a new page starts at the skip link) and
  // reload the app. `useInRouterContext` keeps the component renderable
  // outside a router (the design tests) by falling back to a plain anchor.
  const inRouter = useInRouterContext();
  if (external) {
    return (
      <a className="cta-bar" href={href} target="_blank" rel="noreferrer">
        <span>{children}</span>
      </a>
    );
  }
  if (inRouter) {
    return (
      <Link className="cta-bar" to={href}>
        <span>{children}</span>
      </Link>
    );
  }
  return (
    <a className="cta-bar" href={href}>
      <span>{children}</span>
    </a>
  );
}
