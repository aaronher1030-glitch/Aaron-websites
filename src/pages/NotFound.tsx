import { Link } from "react-router-dom";
import { Band } from "../components/Band";
import { PageHero } from "../components/Hero";
import { PageMeta } from "../components/PageMeta";

/**
 * Shared 404 surface, used for unknown activity slugs now and for the
 * catch-all route later. PageMeta carries no `path`, so unknown URLs stay
 * noindex and no canonical is emitted.
 */
export default function NotFound() {
  return (
    <section className="page page--not-found">
      <PageMeta
        title="Page not found"
        description="That page is not part of the SSLG record."
      />
      <PageHero
        title="Page not found"
        lead="That page is not part of the SSLG record."
      />
      <Band variant="deep">
        <div className="not-found__links">
          <Link className="cta-bar" to="/"><span>Back to Home</span></Link>
          <Link className="cta-bar" to="/accomplishments"><span>Browse accomplishments</span></Link>
        </div>
      </Band>
    </section>
  );
}