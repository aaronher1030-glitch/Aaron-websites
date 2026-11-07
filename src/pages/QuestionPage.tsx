import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChoiceList } from "../components/ChoiceList";
import { Icon } from "../components/Icon";
import { RichText } from "../components/RichText";
import {
  DifficultyBadge,
  DomainBadge,
  SourceBadge,
  VerificationBadge,
} from "../components/ui";
import { REPORT_ISSUE_BASE_URL } from "../config";
import { QUESTIONS, QUESTION_BY_ID, QUESTION_COUNT } from "../data/questions";
import { correctLetter, isCorrect } from "../lib/answer";
import { useStore } from "../store";

export default function QuestionPage() {
  const { id } = useParams();
  const question = id ? QUESTION_BY_ID.get(id) : undefined;
  const index = QUESTIONS.findIndex((q) => q.id === id);
  const prev = QUESTIONS[index - 1];
  const next = QUESTIONS[index + 1];

  const { store, recordAttempt, toggleStash } = useStore();
  const [picked, setPicked] = useState("");
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [lastId, setLastId] = useState(id);

  const startedAt = useRef(Date.now());
  const verdictRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* Navigating prev/next reuses this component instance; reset the answer
     state during render so the new question never paints a stale verdict. */
  if (id !== lastId) {
    setLastId(id);
    setPicked("");
    setChecked(false);
    setRevealed(false);
    setCopied(false);
    setCopyFailed(false);
  }

  const right = checked && question ? isCorrect(question, picked) : false;
  const answerLetter = question ? correctLetter(question) : "";
  const stashed = question ? store.stashed.includes(question.id) : false;
  const paragraphs = question
    ? question.explanation.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
    : [];
  const diagnostics = question
    ? [
        "ChemBank question diagnostics",
        `id: ${question.id}`,
        `topic: ${question.topic}`,
        `source: ${question.source}`,
        `your answer: ${picked || "(none)"}`,
        `correct answer: ${answerLetter}`,
      ].join("\n")
    : "";

  useEffect(() => {
    startedAt.current = Date.now();
    // jsdom reports scrollY 0 and lacks a real scrollTo; only scroll when the
    // reader is actually down the page (e.g. after clicking Next at the foot).
    if (window.scrollY > 0) window.scrollTo(0, 0);
    if (document.activeElement === document.body) headingRef.current?.focus();
  }, [id]);

  useEffect(() => {
    if (checked) verdictRef.current?.focus();
  }, [checked]);

  useEffect(() => {
    if (revealed && !checked) solutionRef.current?.focus();
  }, [revealed, checked]);

  function check() {
    if (!question || !picked || checked) return;
    const now = Date.now();
    recordAttempt({
      qid: question.id,
      correct: isCorrect(question, picked),
      answer: picked,
      ts: now,
      elapsedSec: Math.max(0, Math.round((now - startedAt.current) / 1000)),
      mode: "single",
    });
    setChecked(true);
    setRevealed(true);
  }

  function revealSolution() {
    setRevealed(true);
  }

  async function copyDiagnostics() {
    if (!question) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(diagnostics);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  if (!question) {
    return (
      <section className="page question-missing">
        <p className="page-eyebrow">Question</p>
        <h1 ref={headingRef} tabIndex={-1}>
          Question not found
        </h1>
        <p className="page-lede">
          No item with the id <code>{id}</code> is in the verified bank. It may
          have been withheld during verification, or the link is mistyped.
        </p>
        <Link className="home-button home-button-primary question-missing-back" to="/bank">
          <Icon name="arrow-left" size={15} />
          Back to the bank
        </Link>
      </section>
    );
  }

  return (
    <div className="question">
      <nav className="question-crumbs" aria-label="Breadcrumb">
        <Link to="/bank">
          <Icon name="arrow-left" size={14} />
          Bank
        </Link>
        <Icon name="chevron-right" size={13} />
        <span>{question.id}</span>
      </nav>

      <header className="question-head">
        <p className="question-eyebrow">
          Question {index + 1} of {QUESTION_COUNT}
          {question.chapter !== undefined ? ` · Chapter ${question.chapter}` : ""}
        </p>
        <h1 ref={headingRef} tabIndex={-1}>
          {question.topic}
        </h1>
        <div className="question-badges">
          <DomainBadge domain={question.domain} />
          <DifficultyBadge difficulty={question.difficulty} />
          <SourceBadge source={question.source} />
          <VerificationBadge verified={question.verified} />
        </div>
      </header>

      <article className="question-sheet" aria-labelledby="question-stem-label">
        <p className="question-stem-label" id="question-stem-label">
          Problem
        </p>
        <div className="question-stem">
          <RichText text={question.stem} />
        </div>
        <ChoiceList
          question={question}
          value={picked}
          onChange={setPicked}
          checked={checked}
        />
        <div className="question-actions">
          <button
            type="button"
            className="home-button home-button-primary question-check"
            disabled={!picked || checked}
            onClick={check}
          >
            Check
          </button>
          {!revealed ? (
            <button
              type="button"
              className="home-button home-button-secondary"
              onClick={revealSolution}
            >
              Show solution
            </button>
          ) : null}
          <button
            type="button"
            className="home-button home-button-secondary question-stash"
            aria-pressed={stashed}
            onClick={() => toggleStash(question.id)}
          >
            <Icon name="flag" size={15} />
            {stashed ? "Stashed" : "Stash"}
          </button>
        </div>

        {checked ? (
          <div
            ref={verdictRef}
            className="question-verdict"
            data-verdict={right ? "correct" : "wrong"}
            role="status"
            aria-live="polite"
            tabIndex={-1}
          >
            <p className="question-verdict-line">
              {right ? "Correct." : "Not quite."} You picked {picked}.
            </p>
            <p className="question-verdict-answer">
              Correct answer: <strong>{answerLetter}</strong>
            </p>
          </div>
        ) : null}

        {revealed ? (
          <section
            ref={solutionRef}
            className="question-solution"
            aria-labelledby="question-solution-label"
            tabIndex={-1}
          >
            <p className="question-solution-label" id="question-solution-label">
              Solution
            </p>
            {paragraphs.map((paragraph, i) => (
              <p className="solution-paragraph" key={i}>
                <RichText text={paragraph} />
              </p>
            ))}
            {question.verified.note ? (
              <p className="question-verified-note">
                Verification: {question.verified.note}
              </p>
            ) : null}
          </section>
        ) : null}
      </article>

      <nav className="question-nav" aria-label="Question navigation">
        {prev ? (
          <Link className="question-nav-link" rel="prev" to={`/q/${prev.id}`}>
            <Icon name="arrow-left" size={15} />
            <span className="question-nav-text">
              Previous
              <span className="question-nav-id">{prev.id}</span>
            </span>
          </Link>
        ) : (
          <span className="question-nav-link is-disabled" aria-disabled="true">
            <Icon name="arrow-left" size={15} />
            <span className="question-nav-text">
              Previous
              <span className="question-nav-id">Start of bank</span>
            </span>
          </span>
        )}
        {next ? (
          <Link
            className="question-nav-link question-nav-next"
            rel="next"
            to={`/q/${next.id}`}
          >
            <span className="question-nav-text">
              Next
              <span className="question-nav-id">{next.id}</span>
            </span>
            <Icon name="arrow-right" size={15} />
          </Link>
        ) : (
          <span
            className="question-nav-link question-nav-next is-disabled"
            aria-disabled="true"
          >
            <span className="question-nav-text">
              Next
              <span className="question-nav-id">End of bank</span>
            </span>
            <Icon name="arrow-right" size={15} />
          </span>
        )}
      </nav>

      <section className="question-report" aria-labelledby="question-report-label">
        <p className="question-report-label" id="question-report-label">
          Spot a problem?
        </p>
        <p className="question-report-copy">
          Every item was blind-verified, but mistakes survive. Copy the
          diagnostics and send them with your correction — no account needed.
        </p>
        <div className="question-report-actions">
          <button
            type="button"
            className="home-button home-button-secondary"
            onClick={copyDiagnostics}
          >
            Copy diagnostics
          </button>
          <Link className="home-button home-button-secondary" to="/about#corrections">
            Corrections log
          </Link>
          {REPORT_ISSUE_BASE_URL ? (
            <a
              className="home-button home-button-secondary"
              href={`${REPORT_ISSUE_BASE_URL}/issues/new?template=question.yml&title=Question%20${question.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Report on GitHub
            </a>
          ) : null}
        </div>
        {copied ? (
          <p className="question-copy-note" aria-live="polite">
            Diagnostics copied.
          </p>
        ) : null}
        {copyFailed ? (
          <>
            <p className="question-copy-note" data-tone="hazard" aria-live="polite">
              Clipboard unavailable — copy the diagnostics below.
            </p>
            <pre className="question-diagnostics">{diagnostics}</pre>
          </>
        ) : null}
      </section>
    </div>
  );
}
