import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChoiceList } from "../components/ChoiceList";
import { Icon } from "../components/Icon";
import { QuestionMap } from "../components/QuestionMap";
import { RichText } from "../components/RichText";
import { Bar, DifficultyBadge, DomainBadge, SourceBadge } from "../components/ui";
import { QUESTION_BY_ID } from "../data/questions";
import type { Drill as DrillRecord } from "../data/types";
import { choiceLetter, correctLetter, isCorrect } from "../lib/answer";
import { answeredCount, remainingSeconds } from "../lib/drill";
import { formatDuration } from "../lib/format";
import { useStore } from "../store";

export default function Drill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { store, recordAttempt, updateDrill } = useStore();
  const drill = store.drills.find((entry) => entry.id === id);
  const qid = drill ? drill.qids[drill.index] : undefined;
  const question = qid ? QUESTION_BY_ID.get(qid) : undefined;
  const checked = Boolean(drill && qid && drill.checked[qid]);
  const picked = (drill && qid ? drill.answers[qid] : "") ?? "";

  const [confirmOpen, setConfirmOpen] = useState(false);

  const drillRef = useRef(drill);
  drillRef.current = drill;
  const finishRef = useRef<(next: DrillRecord) => void>(() => {});
  const startedAt = useRef(Date.now());
  const prevConfirmOpen = useRef(false);
  const verdictRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  /* Every mutation flows through the ref first so rapid interactions (and
     bursts of timer ticks before React re-renders) compose instead of
     overwriting each other with a stale snapshot. */
  function mutate(patch: Partial<DrillRecord>) {
    const live = drillRef.current;
    if (!live || live.done) return;
    const next = { ...live, ...patch };
    drillRef.current = next;
    updateDrill(next);
  }

  function pick(letter: string) {
    const live = drillRef.current;
    if (!live || live.done) return;
    const currentQid = live.qids[live.index];
    if (!currentQid) return;
    if (live.mode === "practice" && live.checked[currentQid]) return;
    mutate({ answers: { ...live.answers, [currentQid]: letter } });
  }

  function strike(letter: string) {
    const live = drillRef.current;
    if (!live || live.done) return;
    const currentQid = live.qids[live.index];
    if (!currentQid) return;
    if (live.mode === "practice" && live.checked[currentQid]) return;
    const current = live.strikes[currentQid] ?? [];
    const next = current.includes(letter)
      ? current.filter((entry) => entry !== letter)
      : [...current, letter];
    mutate({ strikes: { ...live.strikes, [currentQid]: next } });
  }

  function toggleFlag() {
    const live = drillRef.current;
    if (!live || live.done) return;
    const currentQid = live.qids[live.index];
    if (!currentQid) return;
    mutate({ flagged: { ...live.flagged, [currentQid]: !live.flagged[currentQid] } });
  }

  function goTo(index: number) {
    const live = drillRef.current;
    if (!live || live.done) return;
    const clamped = Math.min(Math.max(index, 0), live.qids.length - 1);
    if (clamped === live.index) return;
    mutate({ index: clamped });
  }

  function check() {
    const live = drillRef.current;
    if (!live || live.done || live.mode !== "practice") return;
    const currentQid = live.qids[live.index];
    const currentQuestion = currentQid ? QUESTION_BY_ID.get(currentQid) : undefined;
    // The checked map is the double-record guard: a question scores once.
    if (!currentQuestion || !currentQid || live.checked[currentQid]) return;
    const answer = live.answers[currentQid]?.trim();
    if (!answer) return;
    const now = Date.now();
    recordAttempt({
      qid: currentQid,
      correct: isCorrect(currentQuestion, answer),
      answer,
      ts: now,
      elapsedSec: Math.max(0, Math.round((now - startedAt.current) / 1000)),
      mode: "practice",
    });
    mutate({ checked: { ...live.checked, [currentQid]: true } });
  }

  function finish(current: DrillRecord) {
    if (current.done) return;
    const finished: DrillRecord = { ...current, done: true, finishedAt: Date.now() };
    drillRef.current = finished;
    if (finished.mode === "timed") {
      // Timed drills score once, at submit: one attempt per answered item,
      // all stamped with the drill's final elapsed time.
      for (const entry of finished.qids) {
        const answer = finished.answers[entry]?.trim();
        const item = QUESTION_BY_ID.get(entry);
        if (!answer || !item) continue;
        recordAttempt({
          qid: entry,
          correct: isCorrect(item, answer),
          answer,
          ts: Date.now(),
          elapsedSec: finished.elapsedSec,
          mode: "timed",
        });
      }
    }
    updateDrill(finished);
    navigate(`/drill/${finished.id}/results`);
  }
  finishRef.current = finish;

  function confirmSubmit() {
    setConfirmOpen(false);
    const live = drillRef.current;
    if (live) finish(live);
  }

  const drillId = drill?.id;
  const drillDone = drill?.done ?? false;
  const drillMode = drill?.mode;

  useEffect(() => {
    if (!drillId || drillDone || drillMode !== "timed") return;
    const current = drillRef.current;
    if (current && remainingSeconds(current) === 0) {
      finishRef.current(current);
      return;
    }
    const timer = window.setInterval(() => {
      const live = drillRef.current;
      if (!live || live.done) return;
      const elapsedSec = live.elapsedSec + 1;
      const next = { ...live, elapsedSec };
      if (live.limitSec > 0 && elapsedSec >= live.limitSec) {
        finishRef.current(next);
        return;
      }
      drillRef.current = next;
      updateDrill(next);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [drillId, drillDone, drillMode, updateDrill]);

  /* React effects do not run during unload, so merge the live drill into
     storage synchronously on the way out. */
  useEffect(() => {
    function flush() {
      const live = drillRef.current;
      if (!live) return;
      try {
        const raw = window.localStorage.getItem("chembank:v1");
        const parsed = raw ? (JSON.parse(raw) as { version?: number; drills?: DrillRecord[] }) : null;
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.drills)) return;
        const exists = parsed.drills.some((entry) => entry.id === live.id);
        const drills = exists
          ? parsed.drills.map((entry) => (entry.id === live.id ? live : entry))
          : [...parsed.drills, live];
        window.localStorage.setItem("chembank:v1", JSON.stringify({ ...parsed, drills }));
      } catch {
        // Blocked storage: nothing to flush.
      }
    }
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  useEffect(() => {
    startedAt.current = Date.now();
    // jsdom reports scrollY 0 and lacks a real scrollTo; only scroll when the
    // reader is actually down the page (e.g. after clicking Next at the foot).
    if (window.scrollY > 0) window.scrollTo(0, 0);
  }, [qid]);

  useEffect(() => {
    if (checked) verdictRef.current?.focus();
  }, [checked, qid]);

  useEffect(() => {
    if (confirmOpen) {
      cancelRef.current?.focus();
    } else if (prevConfirmOpen.current) {
      submitRef.current?.focus();
    }
    prevConfirmOpen.current = confirmOpen;
  }, [confirmOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || confirmOpen) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        // jsdom leaves isContentEditable undefined, so also match the attribute.
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable ||
          target.closest('[contenteditable="true"]')
        ) {
          return;
        }
      }
      const live = drillRef.current;
      if (!live || live.done) return;
      const key = event.key;
      if (key === "Enter") {
        // A focused button or link already handles its own Enter click.
        if (target instanceof HTMLElement && target.closest("button, a")) return;
        const currentQid = live.qids[live.index];
        const answer = currentQid ? live.answers[currentQid]?.trim() : "";
        event.preventDefault();
        if (live.mode === "practice" && answer && !live.checked[currentQid]) check();
        else goTo(live.index + 1);
        return;
      }
      if (key === "ArrowLeft") {
        event.preventDefault();
        goTo(live.index - 1);
        return;
      }
      if (key === "ArrowRight") {
        event.preventDefault();
        goTo(live.index + 1);
        return;
      }
      if (key.length !== 1) return;
      const lower = key.toLowerCase();
      if (lower >= "a" && lower <= "d") {
        const currentQid = live.qids[live.index];
        const locked = live.mode === "practice" && Boolean(currentQid && live.checked[currentQid]);
        if (!locked) {
          event.preventDefault();
          pick(choiceLetter(lower.charCodeAt(0) - 97));
        }
        return;
      }
      if (lower === "f") {
        event.preventDefault();
        toggleFlag();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drill, confirmOpen, recordAttempt, updateDrill]);

  function onModalKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setConfirmOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = modalRef.current?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons || buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!drill || !question || !qid) {
    return (
      <section className="page drill-missing">
        <p className="page-eyebrow">Drill</p>
        <h1>Drill not found</h1>
        <p className="page-lede">
          No playable drill with the id <code>{id}</code> is saved on this
          device. Drills live in your local notebook — start a new one from the
          builder.
        </p>
        <Link className="home-button home-button-primary drill-missing-back" to="/practice">
          <Icon name="arrow-left" size={15} />
          Back to practice
        </Link>
      </section>
    );
  }

  if (drill.done) {
    return (
      <section className="page drill-missing">
        <p className="page-eyebrow">Drill</p>
        <h1>Drill finished</h1>
        <p className="page-lede">
          {drill.name} is already submitted. Its answers are locked; the results
          sheet has the breakdown.
        </p>
        <div className="drill-finished-actions">
          <Link className="home-button home-button-primary" to={`/drill/${drill.id}/results`}>
            <Icon name="chart" size={15} />
            View results
          </Link>
          <Link className="home-button home-button-secondary" to="/practice">
            <Icon name="arrow-left" size={15} />
            Back to practice
          </Link>
        </div>
      </section>
    );
  }

  const total = drill.qids.length;
  const answered = answeredCount(drill);
  const flaggedCount = drill.qids.filter((entry) => drill.flagged[entry]).length;
  const practice = drill.mode === "practice";
  const flagged = Boolean(drill.flagged[qid]);
  const right = checked && isCorrect(question, picked);
  const remaining = remainingSeconds(drill);
  const paragraphs = question.explanation
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="drill">
      <header className="drill-head">
        <div className="drill-head-copy">
          <p className="drill-eyebrow">Drill · {practice ? "Practice" : "Timed"}</p>
          <h1>{drill.name}</h1>
        </div>
        <button
          ref={submitRef}
          type="button"
          className="home-button home-button-secondary drill-submit"
          onClick={() => setConfirmOpen(true)}
        >
          <Icon name="check" size={15} />
          Submit drill
        </button>
      </header>

      <div className="drill-meta">
        <p className="drill-position">Question {drill.index + 1} of {total}</p>
        <p className="drill-meta-item">{answered} answered</p>
        <p className="drill-meta-item">{flaggedCount} flagged</p>
        {practice ? (
          <p className="drill-timer">Untimed</p>
        ) : (
          <p
            className="drill-timer"
            role="timer"
            aria-label="Time remaining"
            data-tone={remaining <= 60 ? "hazard" : "cobalt"}
          >
            <Icon name="timer" size={14} />
            {formatDuration(remaining)}
          </p>
        )}
      </div>
      <Bar value={answered} max={total} label="Drill progress" tone={practice ? "cobalt" : "copper"} />

      <div className="drill-layout">
        <div className="drill-main">
          <article className="drill-sheet" aria-labelledby="drill-stem-label">
            <p className="question-stem-label" id="drill-stem-label">
              Problem · {question.topic}
            </p>
            <div className="question-badges">
              <DomainBadge domain={question.domain} />
              <DifficultyBadge difficulty={question.difficulty} />
              <SourceBadge source={question.source} />
            </div>
            <div className="question-stem">
              <RichText text={question.stem} />
            </div>
            <ChoiceList
              question={question}
              value={picked}
              onChange={pick}
              checked={practice && checked}
              strikes={drill.strikes[qid] ?? []}
              onStrike={strike}
            />
            <div className="question-actions">
              {practice ? (
                <button
                  type="button"
                  className="home-button home-button-primary question-check"
                  disabled={!picked.trim() || checked}
                  onClick={check}
                >
                  Check
                </button>
              ) : (
                <p className="drill-note">Answers stay editable until you submit.</p>
              )}
              <button
                type="button"
                className="home-button home-button-secondary drill-flag"
                aria-pressed={flagged}
                onClick={toggleFlag}
              >
                <Icon name="flag" size={15} />
                {flagged ? "Flagged" : "Flag"}
              </button>
            </div>

            {practice && checked ? (
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
                  Correct answer: <strong>{correctLetter(question)}</strong>
                </p>
              </div>
            ) : null}

            {practice && checked ? (
              <section className="question-solution" aria-labelledby="drill-solution-label">
                <p className="question-solution-label" id="drill-solution-label">
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
            <button
              type="button"
              className="question-nav-link"
              aria-label="Previous"
              disabled={drill.index === 0}
              onClick={() => goTo(drill.index - 1)}
            >
              <Icon name="arrow-left" size={15} />
              <span className="question-nav-text">
                Previous
                <span className="question-nav-id">
                  {drill.index === 0 ? "Start of drill" : `Question ${drill.index}`}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="question-nav-link question-nav-next"
              aria-label="Next"
              disabled={drill.index === total - 1}
              onClick={() => goTo(drill.index + 1)}
            >
              <span className="question-nav-text">
                Next
                <span className="question-nav-id">
                  {drill.index === total - 1 ? "End of drill" : `Question ${drill.index + 2}`}
                </span>
              </span>
              <Icon name="arrow-right" size={15} />
            </button>
          </nav>
        </div>

        <aside className="drill-rail" aria-label="Drill progress">
          <p className="bank-rail-title">Question map</p>
          <QuestionMap drill={drill} onJump={goTo} />
          <ul className="drill-legend">
            <li><span className="drill-swatch" data-state="answered" />Answered</li>
            <li><span className="drill-swatch" data-state="flagged" />Flagged</li>
            <li><span className="drill-swatch" data-state="current" />Current</li>
          </ul>
          <div className="drill-stats">
            <p>{answered} of {total} answered</p>
            <p>{flaggedCount} flagged</p>
            <p>{practice ? "Instant feedback" : `${formatDuration(remaining)} left`}</p>
          </div>
        </aside>
      </div>

      {confirmOpen ? (
        <div
          className="drill-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            ref={modalRef}
            className="drill-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drill-submit-title"
            onKeyDown={onModalKeyDown}
          >
            <h2 id="drill-submit-title">Submit drill?</h2>
            <p className="drill-modal-counts">
              {total - answered} unanswered · {flaggedCount} flagged
            </p>
            <p className="drill-modal-copy">
              {practice
                ? "Checked answers are already saved. Submitting closes the drill and opens its results."
                : "The clock stops and every answered item is scored as it stands. Unanswered items earn no credit."}
            </p>
            <div className="drill-modal-actions">
              <button
                ref={cancelRef}
                type="button"
                className="home-button home-button-secondary"
                onClick={() => setConfirmOpen(false)}
              >
                Keep working
              </button>
              <button
                type="button"
                className="home-button home-button-primary"
                onClick={confirmSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}