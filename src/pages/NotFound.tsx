import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";
import { Logo } from "../components/ui";

export function NotFoundPage() {
  usePageMeta({ title: "Page not found", noindex: true });
  return (
    <div className="page not-found">
      <div className="container narrow">
        <Logo />
        <p className="eyebrow">404 — no such lemma</p>
        <h1>This page is outside the domain.</h1>
        <p className="page-lede">
          The route does not exist, or the problem id has a typo. The bank is still where you left it.
        </p>
        <div className="hero-actions">
          <Link to="/bank" className="btn btn-primary">
            Go to the problem bank
            <Icon name="arrow-right" size={16} />
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
