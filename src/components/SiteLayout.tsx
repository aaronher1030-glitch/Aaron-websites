import { useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  ["/bank", "Bank"],
  ["/practice", "Practice"],
  ["/review", "Review"],
  ["/notes", "Notes"],
  ["/lab", "Lab"],
  ["/progress", "Progress"],
] as const;

const MORE = [
  ["/formulas", "Formulas"],
  ["/periodic-table", "Periodic table"],
  ["/guide", "PNCO guide"],
  ["/about", "About"],
] as const;

export function SiteLayout() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }

  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <NavLink className="brand-link" to="/" aria-label="ChemBank home">
          <Logo />
        </NavLink>
        <nav className="site-nav" aria-label="Primary">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-tools">
          <details className="nav-more-menu" ref={menuRef}>
            <summary className="nav-more">More</summary>
            <nav className="nav-more-panel" aria-label="Reference">
              {MORE.map(([to, label]) => (
                <NavLink key={to} to={to} onClick={closeMenu}>
                  {label}
                </NavLink>
              ))}
            </nav>
          </details>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-copy">
            <p>
              Independent reviewer. Not affiliated with PFCS, PNCO, DepEd, ACheS,
              or Ateneo.
            </p>
            <p>
              <NavLink to="/about">Methodology and corrections</NavLink>
              {" · "}
              <NavLink to="/guide">PNCO guide</NavLink>
              {" · "}
              <NavLink to="/formulas">Formula sheet</NavLink>
            </p>
            <p>Free forever. No ads, accounts, or payment.</p>
          </div>
          <p className="footer-stamp" aria-hidden="true">
            Unofficial
            <span>student-built</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
