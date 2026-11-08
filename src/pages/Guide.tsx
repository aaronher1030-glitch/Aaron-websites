import { PageMeta } from "../components/PageMeta";
import { GUIDE_LAST_VERIFIED, PNCO_GUIDE } from "../data/guide";

export default function Guide() {
  return (
    <div className="ref-page guide-page">
      <PageMeta
        title="PNCO guide"
        description="A dated, source-linked guide to the Philippine National Chemistry Olympiad: structure, eligibility, awards, IChO pathway, and the ACho distinction."
        path="/guide"
      />

      <header className="ref-head">
        <p className="page-eyebrow">PNCO guide</p>
        <h1>PNCO guide</h1>
        <p className="ref-lede">
          How the Philippine National Chemistry Olympiad is structured, how it
          relates to the IChO, and where it differs from ACho. Every section is
          source-linked and dated because the rules change between cycles.
        </p>
      </header>

      <div className="guide-banner" role="note">
        <p>
          <strong>Independent and unofficial.</strong> ChemBank is not affiliated
          with PFCS, the PNCO National Committee, DepEd, ACheS, or Ateneo. This
          guide summarises public sources; the current official circular always
          wins.
        </p>
        <p className="guide-banner-date">
          Last verified <time dateTime={GUIDE_LAST_VERIFIED}>{GUIDE_LAST_VERIFIED}</time>
        </p>
      </div>

      <nav className="guide-toc" aria-label="Guide sections">
        {PNCO_GUIDE.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.title}
          </a>
        ))}
      </nav>

      {PNCO_GUIDE.map((section) => (
        <section className="ref-section guide-section" id={section.id} key={section.id}>
          <div className="guide-section-head">
            <h2>{section.title}</h2>
            {section.lastVerified ? (
              <span className="badge">Checked {section.lastVerified}</span>
            ) : null}
          </div>
          {section.summary ? <p className="guide-summary">{section.summary}</p> : null}
          {section.body.map((paragraph) => (
            <p className="ref-prose" key={paragraph}>
              {paragraph}
            </p>
          ))}
          {section.points ? (
            <ul className="ref-list guide-points">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          {section.sources ? (
            <div className="guide-sources">
              <h3>Sources</h3>
              <ul>
                {section.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.label}
                    </a>
                    {source.note ? <span> — {source.note}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
