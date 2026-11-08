import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PROBLEM_BY_ID, answerLabel, formatDuration } from "../data/problems";
import { DOMAINS, type Domain } from "../data/types";
import { useStore } from "../store";
import { answeredCount, createDrill, isQuestionCorrect } from "../lib/drill";
import { percent } from "../lib/format";
import { usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";
import { RichText } from "../components/Tex";
import { Bar, EmptyState, ProgressRing } from "../components/ui";

const GRADE_TEXT: Record<string, string> = {
  got: "Solved",
  partial: "Partial",
  miss: "Missed",
};

export function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, saveDrill } = useStore();
  const drill = state.drills.find((item) => item.id === id);
  usePageMeta({ title: drill ? `${drill.name} — results` : "Results", noindex: true });

  const rows = useMemo(() => {
    if (!drill) return [];
    return drill.qids
      .map((qid, index) => {
        const problem = PROBLEM_BY_ID.get(qid);
        if (!problem) return null;
        const checked = Boolean(drill.checked[qid]);
        const grade = drill.grades?.[qid];
        const correct = checked && isQuestionCorrect(drill, qid);
        return { qid, index, problem, checked, grade, correct };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [drill]);

  if (!drill) {
    return (
      <div className="page">
        <div className="container narrow section">
          <EmptyState
            icon="search"
            title="This results page has no drill behind it."
            action={
              <Link to="/practice" className="btn btn-primary btn-sm">
                Build a drill
                <Icon name="arrow-right" size={15} />
              </Link>
            }
          >
            Results are stored with the drill in this browser. It may have been deleted.
          </EmptyState>
        </div>
      </div>
    );
  }

  if (!drill.done) {
    return (
      <div className="page">
        <div className="container narrow section">
          <EmptyState
            icon="clock"
            title="This drill is still open."
            action={
              <Link to={`/drill/${drill.id}`} className="btn btn-primary btn-sm">
                Resume drill
                <Icon name="arrow-right" size={15} />
              </Link>
            }
          >
            Finish it first, then the full question-by-question review appears here.
          </EmptyState>
        </div>
      </div>
    );
  }

  const total = drill.qids.length;
  const answered = answeredCount(drill);
  const correct = rows.filter((row) => row.correct).length;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const missed = rows.filter((row) => !row.correct);
  const wrongOnly = rows.filter((row) => row.checked && !row.correct);

  const domainRows = DOMAINS.map((domain: Domain) => {
    const domainQuestions = rows.filter((row) => row.problem.domain === domain);
    const domainAnswered = domainQuestions.filter((row) => row.checked).length;
    const domainCorrect = domainQuestions.filter((row) => row.correct).length;
    return {
      domain,
      total: domainQuestions.length,
      answered: domainAnswered,
      correct: domainCorrect,
      accuracy: domainAnswered > 0 ? Math.round((domainCorrect / domainAnswered) * 100) : null,
    };
  }).filter((row) => row.total > 0);

  const startRetry = (qids: string[], name: string) => {
    if (qids.length === 0) return;
    const next = createDrill({
      name,
      mode: drill.mode,
      qids,
      limitSec: drill.limitSec,
    });
    saveDrill(next);
    navigate(`/drill/${next.id}`);
  };

  return (
    <div className="page">
      <section className="page-hero results-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Drill complete · {drill.mode === "timed" ? "timed" : "practice"}
          </p>
          <div className="results-hero-grid">
            <div>
              <h1>{drill.name}</h1>
              <p className="page-lede">
                {answered === total
                  ? "Every question answered. Read the misses before you start the next set."
                  : `${total - answered} question${total - answered === 1 ? "" : "s"} left unanswered. Unanswered is not the same as wrong — but both are information.`}
              </p>
              <div className="results-actions">
                {missed.length > 0 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startRetry(missed.map((row) => row.qid), `${drill.name} — retry missed`)}
                  >
                    <Icon name="refresh" size={16} />
                    Retry missed ({missed.length})
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => startRetry(drill.qids, `${drill.name} — retry`)}
                >
                  Retry all
                </button>
                <Link to="/practice" className="text-button results-new">
                  New drill
                  <Icon name="arrow-right" size={15} />
                </Link>
              </div>
            </div>
            <div className="results-score">
              <ProgressRing value={accuracy} label={`${accuracy}%`} sublabel="accuracy" size={136} />
              <div className="results-score-meta">
                <span>
                  <strong>{correct}</strong> correct
                </span>
                <span>
                  <strong>{answered}</strong> answered
                </span>
                <span>
                  <strong>{total}</strong> total
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="metric-row">
            <div className="metric-card">
              <span className="metric-icon"><Icon name="check" size={17} /></span>
              <strong>{correct}/{total}</strong>
              <small>score</small>
            </div>
            <div className="metric-card">
              <span className="metric-icon"><Icon name="target" size={17} /></span>
              <strong>{percent(answered > 0 ? accuracy : null)}</strong>
              <small>accuracy on answered</small>
            </div>
            <div className="metric-card">
              <span className="metric-icon"><Icon name="clock" size={17} /></span>
              <strong>{formatDuration(drill.elapsedSec)}</strong>
              <small>time on drill</small>
            </div>
            <div className="metric-card">
              <span className="metric-icon"><Icon name="flag" size={17} /></span>
              <strong>{Object.values(drill.flagged).filter(Boolean).length}</strong>
              <small>flagged</small>
            </div>
          </div>

          <div className="results-layout">
            <div className="results-review">
              <div className="results-head">
                <h2>Question review</h2>
                <span>{rows.length} questions</span>
              </div>
              <div className="result-list">
                {rows.map((row) => {
                  const yourAnswer =
                    row.problem.type === "proof"
                      ? row.grade
                        ? GRADE_TEXT[row.grade]
                        : "—"
                      : drill.answers[row.qid] || "—";
                  const statusLabel = !row.checked
                    ? "Unanswered"
                    : row.correct
                      ? row.grade === "got"
                        ? "Solved"
                        : "Correct"
                      : row.grade === "partial"
                        ? "Partial"
                        : "Missed";
                  return (
                    <Link to={`/problem/${row.qid}`} className="result-row" key={row.qid}>
                      <span className={`result-num ${row.correct ? "is-correct" : row.checked ? "is-wrong" : ""}`}>
                        {row.index + 1}
                      </span>
                      <div className="result-main">
                        <span className="result-skill">{row.problem.skill}</span>
                        <p className="result-stem">
                          <RichText text={row.problem.stem} />
                        </p>
                      </div>
                      <div className="result-answer">
                        <span>Yours</span>
                        <strong>{yourAnswer}</strong>
                      </div>
                      <div className="result-answer result-correct-answer">
                        <span>Answer</span>
                        <strong>
                          <RichText text={answerLabel(row.problem)} />
                        </strong>
                      </div>
                      <span
                        className={`result-status ${
                          row.correct ? "status-correct" : row.checked ? "status-wrong" : "status-skip"
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <Icon name="arrow-up-right" size={15} />
                    </Link>
                  );
                })}
              </div>
            </div>

            <aside className="results-side">
              <div className="side-card">
                <p className="side-label">By domain</p>
                <div className="domain-breakdown">
                  {domainRows.map((row) => (
                    <div key={row.domain} className="breakdown-row">
                      <div className="breakdown-top">
                        <span>{row.domain}</span>
                        <span>
                          {row.correct}/{row.answered || row.total}
                        </span>
                      </div>
                      <Bar value={row.accuracy} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="side-card">
                <p className="side-label">What next</p>
                <div className="next-list">
                  {wrongOnly.length > 0 ? (
                    <button
                      type="button"
                      className="next-action"
                      onClick={() => startRetry(wrongOnly.map((row) => row.qid), `${drill.name} — wrong only`)}
                    >
                      <span className="next-icon"><Icon name="refresh" size={16} /></span>
                      <span>
                        <strong>Re-solve the wrong ones</strong>
                        <small>{wrongOnly.length} questions from a blank page</small>
                      </span>
                      <Icon name="arrow-right" size={15} />
                    </button>
                  ) : null}
                  <Link to="/review" className="next-action">
                    <span className="next-icon"><Icon name="bookmark" size={16} /></span>
                    <span>
                      <strong>Open mistake review</strong>
                      <small>Wrong answers and stashed problems</small>
                    </span>
                    <Icon name="arrow-right" size={15} />
                  </Link>
                  <Link to="/progress" className="next-action">
                    <span className="next-icon"><Icon name="chart" size={16} /></span>
                    <span>
                      <strong>See your progress</strong>
                      <small>Accuracy by technique and domain</small>
                    </span>
                    <Icon name="arrow-right" size={15} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
