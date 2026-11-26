import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AMO_FAQ, COMPETITIONS, SOURCES, STUDY_PLAN, VERIFIED } from "../data/amo";
import { usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";
import { SectionHead } from "../components/ui";

export function AmoGuidePage() {
  usePageMeta({
    title: "AMO guide",
    description:
      "Australian AMO, American AMO (SIMCC), Asia AMO, ASMO, and PAMO explained: formats, durations, eligibility, and source-linked comparisons.",
    path: "/amo-guide",
  });

  return (
    <div className="page">
      <section className="page-hero amo-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Reference · the AMO family
          </p>
          <div className="page-hero-row">
            <div>
              <h1>One name. Five different competitions.</h1>
              <p className="page-lede">
                If two students say “I’m training for the AMO”, they may be preparing for a three-hour proof paper, a
                90-minute multiple-choice paper, or a primary-school contest. This guide separates the formats before
                you choose a training plan.
              </p>
              <div className="verified-pill">
                <Icon name="calendar" size={15} />
                Last verified {VERIFIED}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="guide-callout">
            <span className="guide-callout-icon"><Icon name="info" size={19} /></span>
            <div>
              <strong>Read this first.</strong>
              <p>
                Lemma is independent and not affiliated with any organiser. Competition rules change — the Australian
                AMO and Asia AMO both changed structure recently — so treat this as orientation, then confirm details
                with the official source linked beside each competition.
              </p>
            </div>
          </div>

          <div className="comparison-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Competition</th>
                  <th>Organiser</th>
                  <th>Style</th>
                  <th>Paper</th>
                  <th>Duration</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITIONS.map((competition) => (
                  <tr key={competition.slug}>
                    <td>
                      <a href={`#${competition.slug}`} className="table-competition">
                        <span className="amo-mini-dot" style={{ "--accent": competition.accent } as CSSProperties} />
                        {competition.short}
                      </a>
                    </td>
                    <td>{competition.organizer}</td>
                    <td>
                      <span className="style-pill">{competition.style}</span>
                    </td>
                    <td>{competition.format}</td>
                    <td>{competition.duration}</td>
                    <td>{competition.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="competition-list">
            {COMPETITIONS.map((competition) => (
              <article
                className="competition-card"
                id={competition.slug}
                key={competition.slug}
                style={{ "--accent": competition.accent } as CSSProperties}
              >
                <header className="competition-head">
                  <div>
                    <span className="competition-short">{competition.short}</span>
                    <h2>{competition.name}</h2>
                    <p>{competition.region}</p>
                  </div>
                  <span className="style-pill style-pill-lg">{competition.style}</span>
                </header>
                <dl className="competition-facts">
                  <div>
                    <dt>Organiser</dt>
                    <dd>{competition.organizer}</dd>
                  </div>
                  <div>
                    <dt>Format</dt>
                    <dd>{competition.format}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{competition.duration}</dd>
                  </div>
                  <div>
                    <dt>Marks</dt>
                    <dd>{competition.marks}</dd>
                  </div>
                  <div>
                    <dt>Eligibility</dt>
                    <dd>{competition.eligibility}</dd>
                  </div>
                  <div>
                    <dt>Pathway</dt>
                    <dd>{competition.rounds}</dd>
                  </div>
                </dl>
                <div className="competition-topics">
                  <p className="side-label">What the paper rewards</p>
                  <p>{competition.topics}</p>
                </div>
                {competition.note ? (
                  <p className="competition-note">
                    <Icon name="alert" size={15} />
                    {competition.note}
                  </p>
                ) : null}
                <a href={competition.source} target="_blank" rel="noreferrer" className="competition-source">
                  Official source · {competition.sourceLabel}
                  <Icon name="external" size={14} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <SectionHead
            eyebrow="Choose a track"
            title="Match the training to the paper."
            text="The bank trains the same four domains, but the session shape should mirror the contest you are actually sitting."
          />
          <div className="track-grid">
            <div className="track-card track-proof">
              <span className="track-icon"><Icon name="book" size={22} /></span>
              <h3>Proof-based</h3>
              <p className="track-sub">Australian AMO · PAMO · olympiad selection</p>
              <p>
                Train written arguments, not just final answers. Six problems in three hours is a stamina problem as
                much as a knowledge problem.
              </p>
              <ul>
                <li>Start with the 6-problem, 3-hour proof paper.</li>
                <li>Use the Proof Lab rubric to mark structure, not just correctness.</li>
                <li>Re-solve every missed proof from a blank page.</li>
              </ul>
              <div className="track-actions">
                <Link to="/practice" className="btn btn-primary btn-sm">
                  Sit a proof paper
                  <Icon name="arrow-right" size={15} />
                </Link>
                <Link to="/bank?type=proof" className="text-button">
                  Proof prompts
                  <Icon name="arrow-right" size={14} />
                </Link>
              </div>
            </div>

            <div className="track-card track-short">
              <span className="track-icon"><Icon name="target" size={22} /></span>
              <h3>Short-answer</h3>
              <p className="track-sub">American AMO (SIMCC) · Asia AMO · ASMO</p>
              <p>
                Accuracy under time pressure, with no partial credit for a beautiful idea that never becomes a number.
                Pace and triage matter.
              </p>
              <ul>
                <li>Use the 15-question, 25-minute short-answer sprint.</li>
                <li>Track accuracy by technique, not just raw score.</li>
                <li>Practise leaving a question before it eats the paper.</li>
              </ul>
              <div className="track-actions">
                <Link to="/practice" className="btn btn-primary btn-sm">
                  Run a sprint
                  <Icon name="arrow-right" size={15} />
                </Link>
                <Link to="/bank" className="text-button">
                  Browse short answers
                  <Icon name="arrow-right" size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <SectionHead
            eyebrow="An eight-week plan"
            title="A plan that ends in repair, not new topics."
            text="This is a template for a student already comfortable with school algebra and geometry. Compress or stretch the weeks to fit the contest date."
          />
          <div className="study-plan">
            {STUDY_PLAN.map((week, index) => (
              <div className="study-week" key={week.week}>
                <div className="study-marker">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="study-body">
                  <div className="study-head">
                    <span className="study-week-label">{week.week}</span>
                    <h3>{week.focus}</h3>
                  </div>
                  <p>{week.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <SectionHead eyebrow="Questions" title="The honest answers." />
          <div className="faq-list">
            {AMO_FAQ.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>
                  {item.q}
                  <Icon name="chevron-down" size={18} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <SectionHead eyebrow="Sources" title="Where the format facts come from." />
          <div className="source-list">
            {SOURCES.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="source-row">
                <span className="source-icon"><Icon name="external" size={16} /></span>
                <span className="source-main">
                  <strong>{source.label}</strong>
                  <small>{source.note}</small>
                </span>
                <span className="source-url">{new URL(source.url).hostname}</span>
                <Icon name="arrow-up-right" size={15} />
              </a>
            ))}
          </div>
          <div className="independence-note">
            <Icon name="info" size={18} />
            <p>
              Lemma is an independent study project. Competition names and trademarks belong to their respective
              owners. The 40 official Australian AMO questions are transcribed with attribution to AMT; all other
              problems are Lemma originals. All competition facts above were checked in {VERIFIED} and should be
              re-verified with each organiser before an entry deadline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
