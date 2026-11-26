import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useStore } from "../store";
import { SITE } from "../config";
import { Icon } from "./Icon";
import { Logo } from "./ui";

const NAV = [
  { to: "/bank", label: "Problem bank" },
  { to: "/practice", label: "Practice" },
  { to: "/techniques", label: "Techniques" },
  { to: "/amo-papers", label: "AMO papers" },
  { to: "/amo-guide", label: "AMO guide" },
  { to: "/progress", label: "Progress" },
];

function ThemeToggle() {
  const { state, setTheme } = useStore();
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const compute = () => setResolved(state.theme === "auto" ? (media.matches ? "dark" : "light") : state.theme);
    compute();
    media.addEventListener("change", compute);
    return () => media.removeEventListener("change", compute);
  }, [state.theme]);

  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <Icon name={resolved === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

export function SiteLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={`site-header ${mobileOpen ? "menu-open" : ""}`}>
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Lemma home">
            <Logo />
          </Link>
          <nav className="main-nav" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <Link to="/practice" className="btn btn-primary btn-sm header-cta">
              Start drilling
              <Icon name="arrow-right" size={15} />
            </Link>
            <button
              type="button"
              className="icon-button mobile-menu-button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <Icon name={mobileOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <div className="mobile-nav">
            <nav aria-label="Mobile">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `mobile-nav-link ${isActive ? "nav-active" : ""}`}
                >
                  {item.label}
                  <Icon name="arrow-right" size={16} />
                </NavLink>
              ))}
            </nav>
            <div className="mobile-nav-foot">
              <Link to="/review" className="btn btn-secondary btn-sm">
                Review mistakes
              </Link>
              <Link to="/practice" className="btn btn-primary btn-sm">
                Start a drill
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <Logo />
              <p className="footer-tag">Proof is a muscle. Train it.</p>
              <p className="footer-note">
                An independent problem bank for the AMO family. The official collection transcribes publicly released
                AMT papers with attribution; all other problems are Lemma originals. Not affiliated with AMT, SIMCC,
                ASMO, PAMO, or any olympiad organiser.
              </p>
            </div>
            <div className="footer-col">
              <p className="footer-title">Train</p>
              <Link to="/bank">Problem bank</Link>
              <Link to="/practice">Practice builder</Link>
              <Link to="/techniques">Technique guides</Link>
              <Link to="/review">Mistake review</Link>
            </div>
            <div className="footer-col">
              <p className="footer-title">Reference</p>
              <Link to="/amo-guide">AMO guide</Link>
              <Link to="/amo-papers">AMO papers</Link>
              <Link to="/progress">Your progress</Link>
              <Link to="/about">About &amp; method</Link>
              <Link to="/bank?type=proof">Proof lab</Link>
              {SITE.githubUrl ? (
                <a href={SITE.githubUrl} target="_blank" rel="noreferrer" className="footer-github">
                  Source on GitHub
                  <Icon name="external" size={13} />
                </a>
              ) : null}
            </div>
            <div className="footer-col footer-col-note">
              <p className="footer-title">Your data</p>
              <p>
                Progress lives in this browser's local storage. No account, no tracking, no network calls after the
                page loads.
              </p>
              <Link to="/progress" className="footer-export">
                Export or reset
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Lemma</span>
            <span>AMO facts checked November 2026 · verify with the organiser</span>
          </div>
        </div>
      </footer>
    </>
  );
}
