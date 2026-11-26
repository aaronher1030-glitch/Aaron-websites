import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import { QUESTION_BY_ID } from "../data/questions";
import { latestAttemptMap } from "../lib/drill";
import { normalizeText } from "../lib/format";
import { dueReview } from "../lib/review";
import { useStore } from "../store";

type TabId = "wrong" | "flagged" | "due";

const TABS: { id: TabId; label: string }[] = [
  { id: "wrong", label: "Wrong" },
  { id: "flagged", label: "Flagged" },
  { id: "due", label: "Due" },
];

const EMPTY: Record<TabId, string> = {
  wrong: "No wrong answers right now. Every latest attempt is correct — keep the streak alive.",
  flagged: "Nothing stashed yet. Flag a question from its sheet to park it here for later.",
  due: "Nothing is due yet. The spaced-review queue fills as you miss items; come back tomorrow.",
};

export default function Review() {
  const navigate = useNavigate();
  const { store, createDrill, clearReview, toggleStash } = useStore();
  const [tab, setTab] = useState<TabId>("wrong");

  const latest = latestAttemptMap(store.attempts);
  const wrongItems = [...latest.values()]
    .filter((entry) => !entry.correct && QUESTION_BY_ID.has(entry.qid))
    .map((entry) => entry.qid);
  const flaggedItems = store.stashed.filter((qid) => QUESTION_BY_ID.has(qid));
  const dueItems = dueReview(store)
    .map((item) => item.qid)
    .filter((qid) => QUESTION_BY_ID.has(qid));

  const counts: Record<TabId, number> = {
    wrong: wrongItems.length,
    flagged: flaggedItems.length,
    due: dueItems.length,
  };
  const items = tab === "wrong" ? wrongItems : tab === "flagged" ? flaggedItems : dueItems;

  function remove(qid: string) {
    if (tab === "flagged") toggleStash(qid);
    else clearReview(qid);
  }

  function reviewDue() {
    if (dueItems.length === 0) return;
    const drill = createDrill({ name: "Due review", mode: "practice", qids: dueItems, limitSec: 0 });
    navigate(`/drill/${drill.id}`);
  }

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = TABS.findIndex((entry) => entry.id === tab);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(index + delta + TABS.length) % TABS.length];
    setTab(next.id);
    document.getElementById(`review-tab-${next.id}`)?.focus();
  }

  return (
    <div className="review">
      <PageMeta
        title="Spaced review"
        description="Review mistakes on a spaced schedule. Your queue lives in this browser and is never uploaded."
      />
      <header className="practice-head">
        <p className="practice-eyebrow">Review</p>
        <h1>Review</h1>
        <p className="practice-lede">
          Three queues keep the loop honest: the items you last missed, the ones
          you stashed, and the spaced-review cards that are due today.
        </p>
      </header>

      <div className="review-toolbar">
        <div className="review-tabs" role="tablist" aria-label="Review queues" onKeyDown={onTabKeyDown}>
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              id={`review-tab-${entry.id}`}
              className="review-tab"
              aria-selected={tab === entry.id}
              aria-controls={`review-panel-${entry.id}`}
              tabIndex={tab === entry.id ? 0 : -1}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
              <span className="review-tab-count">{counts[entry.id]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="home-button home-button-primary"
          disabled={dueItems.length === 0}
          onClick={reviewDue}
        >
          <Icon name="timer" size={15} />
          Review due
        </button>
      </div>

      <div
        className="review-panel"
        role="tabpanel"
        id={`review-panel-${tab}`}
        aria-labelledby={`review-tab-${tab}`}
      >
        {items.length === 0 ? (
          <p className="practice-empty">{EMPTY[tab]}</p>
        ) : (
          <ul className="review-list">
            {items.map((qid) => {
              const question = QUESTION_BY_ID.get(qid)!;
              const last = latest.get(qid);
              const preview = normalizeText(question.stem).slice(0, 150);
              const verdict = last ? (last.correct ? "correct" : "wrong") : "unseen";
              return (
                <li className="review-item" data-qid={qid} key={qid}>
                  <div className="review-item-copy">
                    <Link className="review-topic" to={`/q/${qid}`}>{question.topic}</Link>
                    <p className="review-stem">{preview}{preview.length >= 150 ? "…" : ""}</p>
                    <p className="review-last">
                      Last result:{" "}
                      <span className="results-verdict" data-verdict={verdict}>
                        {last ? (last.correct ? "Correct" : "Wrong") : "Not attempted"}
                      </span>
                    </p>
                  </div>
                  <div className="review-item-actions">
                    <Link className="home-button home-button-secondary" to={`/q/${qid}`}>
                      Open
                    </Link>
                    {/* Wrong is derived from latest attempts, so clearReview would
                        be a visible no-op there; only Flagged and Due can remove. */}
                    {tab !== "wrong" ? (
                      <button
                        type="button"
                        className="home-button home-button-secondary"
                        onClick={() => remove(qid)}
                      >
                        <Icon name="close" size={15} />
                        Remove
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
