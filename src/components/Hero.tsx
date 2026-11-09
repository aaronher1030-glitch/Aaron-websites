import type { ReactNode } from "react";

export function Beams() {
  return (
    <div className="beams" aria-hidden="true">
      <span className="beam beam--a" />
      <span className="beam beam--b" />
      <span className="beam-glow beam-glow--a" />
      <span className="beam-glow beam-glow--b" />
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="hero hero--home" aria-labelledby="hero-title">
      <Beams />
      <div className="hero__lockup">
        <div className="hero__seals">
          <img src="/brand/seal-school.png" alt="" width="84" height="87" />
          <img src="/brand/seal-sslg.png" alt="" width="84" height="84" />
        </div>
        <span className="hero__rule" aria-hidden="true" />
        <div className="hero__type">
          <p className="hero__school">Benigno S. Aquino National High School</p>
          <h1 id="hero-title" className="hero__wordmark" aria-label="Supreme Secondary Learner Government">
            Supreme<br />Secondary<br />Learner<br />Government
          </h1>
          <p className="hero__year">School Year 2026–2027</p>
        </div>
      </div>
      <a className="hero__scroll" href="#latest" aria-label="Skip to the latest news">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}

export function PageHero({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="hero hero--page" aria-labelledby="page-title">
      <Beams />
      <div className="hero__page-inner">
        <h1 id="page-title">{title}</h1>
        {lead ? <p className="hero__lead">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
