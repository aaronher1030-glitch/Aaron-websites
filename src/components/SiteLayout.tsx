import { NavLink, Outlet } from "react-router-dom";
import { APP_NAME, FACEBOOK_URL } from "../config";

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
  return (
    <div className="site">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="masthead">
        <div className="masthead-top">
          <span>S.Y. 2026–2027</span>
          <span>Benigno S. Aquino National High School</span>
        </div>
        <div className="masthead-main">
          <NavLink to="/" className="wordmark">
            <span className="wordmark-mark">SSLG</span>
            <span className="wordmark-sub">Supreme Secondary Learner Government</span>
          </NavLink>
          <nav className="site-nav" aria-label="Primary">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      {/* tabIndex lets the skip link move keyboard focus, not just scroll. */}
      <main id="main" className="site-main" tabIndex={-1}><Outlet /></main>
      <footer className="site-footer">
        <p>Benigno S. Aquino National High School Supreme Secondary Learner Government</p>
        <p><a href={FACEBOOK_URL} rel="noreferrer">facebook.com/bsanhssslg</a></p>
        <p className="footer-note">{APP_NAME} · Public records and activity reports</p>
      </footer>
    </div>
  );
}
