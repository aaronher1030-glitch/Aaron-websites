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

export function SiteLayout() {
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
          <NavLink className="nav-more" to="/formulas">
            Formulas
          </NavLink>
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
            </p>
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
