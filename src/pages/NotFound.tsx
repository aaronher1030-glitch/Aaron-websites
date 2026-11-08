import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";

const LINKS = [
  { to: "/bank", label: "Question bank", copy: "430 verified items with worked solutions." },
  { to: "/practice", label: "Practice builder", copy: "Untimed or timed drills from any scope." },
  { to: "/notes", label: "Chapter notes", copy: "Seven briefings for the supplied chapter papers." },
  { to: "/formulas", label: "Formula sheet", copy: "Constants, equations, and solubility rules." },
];

export default function NotFound() {
  return (
    <div className="ref-page notfound-page">
      <PageMeta
        title="Page not found"
        description="This ChemBank route does not exist. Return to the question bank, practice builder, notes, or formula sheet."
      />

      <header className="ref-head">
        <p className="page-eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="ref-lede">
          The link is stale, mistyped, or points to a page that was renamed. The
          bank is the shortest way back to something useful.
        </p>
        <div className="ref-actions">
          <Link className="home-button home-button-primary" to="/bank">
            <Icon name="search" size={16} /> Back to the bank
          </Link>
          <Link className="home-button home-button-secondary" to="/">
            Home
          </Link>
        </div>
      </header>

      <div className="ref-grid">
        {LINKS.map((link) => (
          <Link className="ref-card" key={link.to} to={link.to}>
            <h2>{link.label}</h2>
            <p>{link.copy}</p>
            <span className="ref-card-go">
              Open <Icon name="chevron-right" size={15} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
