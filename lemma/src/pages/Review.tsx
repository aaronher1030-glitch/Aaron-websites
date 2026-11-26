import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PROBLEMS } from "../data/problems";
import { useStore } from "../store";
import { createDrill } from "../lib/drill";
import { usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";
import { ProblemCard } from "../components/ProblemCard";
import { EmptyState } from "../components/ui";

type Tab = "wrong" | "stashed";

export function ReviewPage() {
  usePageMeta({ title: "Review", noindex: true });
  const navigate = useNavigate();
  const { state, latest, saveDrill } = useStore();
  const [tab, setTab] = useState<Tab>("wrong");

  const wrong = useMemo(
    () =>
      PROBLEMS.filter((problem) => {
        const attempt = latest.get(problem.id);
        return attempt && !attempt.correct;
      }),
    [latest],
  );

  const stashed = useMemo(
    () =>
      state.stashed
        .map((id) => PROBLEMS.find((problem) => problem.id === id))
        .filter((problem): problem is (typeof PROBLEMS)[number] => Boolean(problem)),
    [state.stashed],
  );

  const active = tab === "wrong" ? wrong : stashed;

  const startSet = () => {
    if (active.length === 0) return;
    const drill = createDrill({
      name: tab === "wrong" ? "Mistake repair" : "Stashed problems",
      mode: "practice",
      qids: active.slice(0, 12).map((problem) => problem.id),
      limitSec: 0,
    });
    saveDrill(drill);
    navigate(`/drill/${drill.id}`);
  };

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Review · repair the gaps
          </p>
          <div className="page-hero-row">
            <div>
              <h1>Return to what fought back.</h1>
              <p className="page-lede">
                Wrong answers are held by your latest attempt, not every attempt. Re-solve from a blank page before you
                decide a topic is fixed.
              </p>
            </div>
            <div className="page-hero-stats">
              <div>
                <span>{wrong.length}</span>
                <small>to repair</small>
              </div>
              <div>
                <span>{stashed.length}</span>
                <small>stashed</small>
              </div>
              <div>
                <span>{state.attempts.length}</span>
                <small>attempts logged</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="review-tabs" role="tablist" aria-label="Review list">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "wrong"}
              className={tab === "wrong" ? "is-active" : ""}
              onClick={() => setTab("wrong")}
            >
              <Icon name="refresh" size={16} />
              Wrong answers
              <span>{wrong.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "stashed"}
              className={tab === "stashed" ? "is-active" : ""}
              onClick={() => setTab("stashed")}
            >
              <Icon name="bookmark" size={16} />
              Stashed
              <span>{stashed.length}</span>
            </button>
          </div>

          {active.length > 0 ? (
            <>
              <div className="review-toolbar">
                <p>
                  <strong>{active.length}</strong> problem{active.length === 1 ? "" : "s"} in this list
                </p>
                <div className="review-actions">
                  <Link to="/bank" className="text-button">
                    Add from the bank
                    <Icon name="arrow-right" size={14} />
                  </Link>
                  <button type="button" className="btn btn-primary btn-sm" onClick={startSet}>
                    <Icon name="play" size={15} />
                    Practise {Math.min(active.length, 12)}
                  </button>
                </div>
              </div>
              <div className="problem-grid">
                {active.map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            </>
          ) : tab === "wrong" ? (
            <EmptyState
              icon="check"
              title="No wrong answers on the board."
              action={
                <Link to="/practice" className="btn btn-primary btn-sm">
                  Start a drill
                  <Icon name="arrow-right" size={15} />
                </Link>
              }
            >
              Once you miss a question, it appears here. A correct later attempt removes it from the list.
            </EmptyState>
          ) : (
            <EmptyState
              icon="bookmark"
              title="Nothing stashed yet."
              action={
                <Link to="/bank" className="btn btn-primary btn-sm">
                  Browse the bank
                  <Icon name="arrow-right" size={15} />
                </Link>
              }
            >
              Use the bookmark button on any problem or inside a drill to save it here for later.
            </EmptyState>
          )}
        </div>
      </section>
    </div>
  );
}
