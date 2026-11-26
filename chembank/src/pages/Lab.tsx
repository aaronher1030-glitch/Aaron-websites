import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import { LAB_TECHNIQUES } from "../data/lab";

export default function Lab() {
  return (
    <div className="ref-page">
      <PageMeta
        title="Lab bench"
        description="Bench briefings for PNCO laboratory work: purpose, procedure, honest precision, the errors that ruin a result, and the exam traps."
        path="/lab"
      />

      <header className="ref-head">
        <p className="page-eyebrow">Lab bench</p>
        <h1>Lab bench</h1>
        <p className="ref-lede">
          The practical paper rewards technique as much as arithmetic. These
          briefings cover the glassware, instruments, and procedures that decide
          whether a number is trustworthy — plus the errors examiners expect you
          to notice.
        </p>
        <p className="ref-note">
          Always follow your school's safety rules and the reagent labels in
          front of you. These notes describe technique; they do not replace a
          teacher's supervision.
        </p>
      </header>

      <div className="ref-grid ref-grid-lab">
        {LAB_TECHNIQUES.map((technique, index) => (
          <Link
            className="ref-card lab-card"
            key={technique.slug}
            to={`/lab/${technique.slug}`}
          >
            <span className="ref-card-kicker">
              Technique {String(index + 1).padStart(2, "0")}
            </span>
            <h2>{technique.title}</h2>
            <p>{technique.purpose}</p>
            <span className="ref-card-meta">
              {technique.steps.length} steps · {technique.errors.length} failure
              modes
            </span>
            <span className="ref-card-go">
              Open briefing <Icon name="chevron-right" size={15} />
            </span>
          </Link>
        ))}
      </div>

      <div className="ref-cta">
        <div>
          <h2>Test the bench</h2>
          <p>Drill the full Laboratory domain, then read the explanations.</p>
        </div>
        <Link className="home-button home-button-primary" to="/practice?preset=lab">
          <Icon name="flask" size={16} /> Start lab drill
        </Link>
      </div>
    </div>
  );
}
