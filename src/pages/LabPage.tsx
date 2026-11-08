import { Link, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import { LAB_TECHNIQUES } from "../data/lab";
import NotFound from "./NotFound";

function LabBody({ slug }: { slug: string }) {
  const technique = LAB_TECHNIQUES.find((entry) => entry.slug === slug);
  if (!technique) return <NotFound />;

  const index = LAB_TECHNIQUES.findIndex((entry) => entry.slug === slug);
  const previous = index > 0 ? LAB_TECHNIQUES[index - 1] : null;
  const next = index < LAB_TECHNIQUES.length - 1 ? LAB_TECHNIQUES[index + 1] : null;

  return (
    <article className="ref-detail lab-detail">
      <PageMeta
        title={technique.title}
        description={technique.purpose}
        path={`/lab/${technique.slug}`}
      />

      <Link className="ref-back" to="/lab">
        <Icon name="arrow-left" size={15} /> All lab techniques
      </Link>

      <header className="ref-head">
        <p className="page-eyebrow">Lab bench</p>
        <h1>{technique.title}</h1>
        <p className="ref-lede">{technique.purpose}</p>
      </header>

      <section className="ref-section" aria-labelledby="procedure">
        <h2 id="procedure">Procedure</h2>
        <ol className="ref-list ref-list-steps">
          {technique.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="ref-section" aria-labelledby="precision">
        <h2 id="precision">What precision can you claim?</h2>
        <p className="ref-prose">{technique.precision}</p>
      </section>

      <div className="ref-two-col">
        <section className="ref-section" aria-labelledby="errors">
          <h2 id="errors">Failure modes</h2>
          <ul className="ref-list ref-list-traps">
            {technique.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>

        <section className="ref-section" aria-labelledby="exam-traps">
          <h2 id="exam-traps">Exam traps</h2>
          <ul className="ref-list ref-list-check">
            {technique.examTraps.map((trap) => (
              <li key={trap}>{trap}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ref-cta">
        <div>
          <h2>Practise under time</h2>
          <p>The Laboratory domain mixes technique, safety, and calculation.</p>
        </div>
        <Link className="home-button home-button-primary" to="/practice?preset=lab">
          <Icon name="flask" size={16} /> Start lab drill
        </Link>
      </div>

      <nav className="ref-pager" aria-label="Lab techniques">
        {previous ? (
          <Link className="ref-pager-link" to={`/lab/${previous.slug}`}>
            <span className="ref-pager-label">Previous technique</span>
            <span>
              <Icon name="arrow-left" size={14} /> {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="ref-pager-link ref-pager-next" to={`/lab/${next.slug}`}>
            <span className="ref-pager-label">Next technique</span>
            <span>
              {next.title} <Icon name="arrow-right" size={14} />
            </span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

export default function LabPage() {
  const { slug = "" } = useParams();
  return <LabBody key={slug} slug={slug} />;
}
