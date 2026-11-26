import { Link } from "react-router-dom";
import { PageMeta } from "../components/PageMeta";
import { REPORT_ISSUE_BASE_URL } from "../config";
import audit from "../../content/audit.json";
import { QUESTION_COUNT } from "../data/questions";

const COUNTS = [
  { label: "Candidate items", value: audit.candidates },
  { label: "Published", value: audit.published },
  { label: "Blind-verified", value: audit.verified },
  { label: "Corrections logged", value: audit.corrections },
  { label: "Withheld after review", value: audit.excludedIds.length },
  { label: "Adjudicated conflicts", value: audit.adjudicated },
];

export default function About() {
  return (
    <div className="ref-page about-page">
      <PageMeta
        title="Methodology and corrections"
        description="How ChemBank verifies questions, what the audit counts mean, how corrections are logged, and the privacy and licensing rules behind the site."
        path="/about"
      />

      <header className="ref-head">
        <p className="page-eyebrow">About</p>
        <h1>Methodology and corrections</h1>
        <p className="ref-lede">
          ChemBank publishes only items that an independent solver has re-worked
          and reconciled with the supplied key. When the key and the solution
          disagree, the item is corrected, adjudicated, or withheld. Nothing in
          this bank is copied from an official paper.
        </p>
      </header>

      <div className="guide-banner" role="note">
        <p>
          <strong>Free, independent, and unofficial.</strong> ChemBank has no
          ads, no accounts, no subscriptions, and no payment flow. It is not
          affiliated with PFCS, PNCO, DepEd, ACheS, or Ateneo.
        </p>
        <p className="guide-banner-date">
          Audit snapshot: {QUESTION_COUNT} published items
        </p>
      </div>

      <section className="ref-section" aria-labelledby="ledger">
        <h2 id="ledger">Verification ledger</h2>
        <div className="audit-grid">
          {COUNTS.map((count) => (
            <div className="audit-stat" key={count.label}>
              <span className="audit-value">{count.value}</span>
              <span className="audit-label">{count.label}</span>
            </div>
          ))}
        </div>
        <p className="ref-prose">
          The source papers arrived with draft keys and self-contradictions, so
          the source answer was treated as a claim rather than truth. Every
          candidate was solved blind, then compared with the key. Disagreements
          went to a second adjudicator with both solutions visible. Items that
          still could not be resolved were withheld from the published bank.
        </p>
      </section>

      <section className="ref-section" aria-labelledby="method">
        <h2 id="method">Method</h2>
        <ol className="ref-list ref-list-steps">
          <li>
            <strong>Extract.</strong> Convert the supplied documents and prototype
            data without changing the wording of a question stem.
          </li>
          <li>
            <strong>Re-solve blind.</strong> An independent solver answers without
            seeing the source key, recording the reasoning and the final choice.
          </li>
          <li>
            <strong>Compare and adjudicate.</strong> Agreement is a candidate for
            publication. Disagreement goes to a second solver with both answers
            visible. An unresolved item is flagged and withheld.
          </li>
          <li>
            <strong>Rewrite the explanation.</strong> Clean worked solutions replace
            source commentary and meta-notes. Corrected items keep a record of the
            original key and the reason for the change.
          </li>
          <li>
            <strong>Validate at build time.</strong> The content scripts check
            counts, required fields, answer letters, and the published set before
            the JSON is bundled.
          </li>
        </ol>
      </section>

      <section className="ref-section" id="corrections" aria-labelledby="corrections-title">
        <h2 id="corrections-title">Corrections</h2>
        <p className="ref-prose">
          {audit.corrections} published items carry a documented correction:
          the supplied key differed from the answer reached by independent
          re-solving. The correction is part of the item&apos;s verification
          record, not a silent edit. If a new error is found, the item is
          re-opened rather than patched without a note.
        </p>
        <div className="correction-list">
          {audit.excludedIds.map((id) => (
            <div className="correction-row" key={id}>
              <code>{id}</code>
              <span>
                Withheld from publication: the available solutions did not
                converge on a defensible answer.
              </span>
            </div>
          ))}
        </div>
        <p className="ref-note">
          Withheld items are never served in a practice or timed paper. They are
          listed here so the gap in the source paper is visible.
        </p>
      </section>

      <section className="ref-section" aria-labelledby="privacy">
        <h2 id="privacy">Privacy and local data</h2>
        <p className="ref-prose">
          Progress is stored in your browser under the key{" "}
          <code>chembank:v1</code>. There is no account, no server-side profile,
          and no analytics script. The site does not send your answers anywhere.
          Clearing site data or using a different browser starts a fresh
          notebook; export a backup first if the history matters.
        </p>
        <p className="ref-prose">
          ChemBank never collects payment information. If a page or a message
          asks you to pay for ChemBank, it is not from this site.
        </p>
      </section>

      <section className="ref-section" aria-labelledby="license">
        <h2 id="license">Licence and provenance</h2>
        <p className="ref-prose">
          The application code is released under the MIT licence. Original site
          copy and newly written explanations are shared under CC BY-NC-SA 4.0.
          Supplied and textbook-derived question text remains the property of its
          respective owners and is included for study, not for resale.
        </p>
        <p className="ref-prose">
          Names and marks such as PNCO, PFCS, DepEd, ACho, and Ateneo belong to
          their owners. They are used only to describe the competitions this
          independent reviewer prepares students for.
        </p>
      </section>

      <section className="ref-section" aria-labelledby="report">
        <h2 id="report">Report a problem</h2>
        <p className="ref-prose">
          Found a wrong answer, a broken formula, or a factual error in the PNCO
          guide? Open the question from the bank and use its report action so the
          item ID, your answer, and the local diagnostics travel with the report.
        </p>
        <div className="ref-actions">
          <Link className="home-button home-button-primary" to="/bank">
            Open the question bank
          </Link>
          {REPORT_ISSUE_BASE_URL ? (
            <a
              className="home-button home-button-secondary"
              href={`${REPORT_ISSUE_BASE_URL}/issues/new`}
              target="_blank"
              rel="noreferrer"
            >
              Open an issue
            </a>
          ) : (
            <Link className="home-button home-button-secondary" to="/guide#last-verified">
              Check the guide&apos;s sources
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
