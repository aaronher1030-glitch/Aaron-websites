import { useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { FACEBOOK_URL } from "../config";

const NAV = [
  ["/", "Home"],
  ["/finance", "Finance"],
  ["/accomplishments", "Accomplishments"],
  ["/photos", "Photos"],
  ["/transparency", "Transparency"],
  ["/about-us", "About us"],
  ["/feedback", "Feedback"],
] as const;

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const sentinel = document.getElementById("top-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="site">
      <a className="skip-link" href="#main">Skip to content</a>
      <div id="top-sentinel" aria-hidden="true" />
      <header className="masthead" data-scrolled={scrolled}>
        <div className="masthead__inner">
          <NavLink to="/" className="brand" aria-label="BSANHS SSLG, home">
            <img src="/brand/seal-sslg.png" alt="" width="40" height="40" />
            <span className="brand__name">BSANHS</span>
          </NavLink>
          <nav className="site-nav" aria-label="Primary" data-open={open} id={menuId}>
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>
            ))}
          </nav>
          <button
            ref={buttonRef}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </header>
      <main id="main" className="site-main" tabIndex={-1}><Outlet /></main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="site-footer__name">
            <img src="/brand/seal-sslg.png" alt="" width="48" height="48" />
            <span>Benigno S. Aquino National High School Supreme Secondary Learner Government</span>
          </p>
          <a className="cta-bar site-footer__fb" href={FACEBOOK_URL} target="_blank" rel="noreferrer">
            <span>facebook.com/SSLGBSANHS</span>
          </a>
          <p className="site-footer__note">S.Y. 2026–2027 · Official website</p>
        </div>
      </footer>
    </div>
  );
}
