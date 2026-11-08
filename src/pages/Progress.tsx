import { useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Bar, ProgressRing } from "../components/ui";
import { QUESTIONS, QUESTION_BY_ID } from "../data/questions";
import { latestAttemptMap } from "../lib/drill";
import { percent } from "../lib/format";
import { dueReview } from "../lib/review";
import { statsByChapter, statsByDomain, statsByTopic, streakDays, type GroupStat } from "../lib/stats";
import { useStore } from "../store";

function StatPanel({ title, rows }: { title: string; rows: GroupStat[] }) {
  return (
    <section className="home-coverage-panel" aria-label={title}>
      <h3>{title}</h3>
      <ul className="home-coverage-list">
        {rows.map((row) => (
          <li className="home-coverage-row" key={row.key}>
            <span className="home-coverage-label">{row.key}</span>
            <span className="home-coverage-meter">
              <Bar
                value={row.accuracy ?? 0}
                max={100}
                label={`${row.key} accuracy`}
                tone={row.accuracy === null ? "cobalt" : row.accuracy >= 60 ? "acid" : "hazard"}
              />
              <span className="home-coverage-count">
                {row.attempted === 0 ? "—" : `${row.correct}/${row.attempted}`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Progress() {
  const navigate = useNavigate();
  const { store, createDrill, exportData, importData, reset } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [status, setStatus] = useState("");

  const latest = latestAttemptMap(store.attempts);
  const attempted = latest.size;
  const correct = [...latest.values()].filter((entry) => entry.correct).length;
  const accuracy = percent(correct, attempted);
  const streak = streakDays(store.attempts);
  const due = dueReview(store);

  const weak = statsByTopic(store.attempts)
    .filter((row) => row.attempted >= 2 && row.accuracy !== null && row.accuracy < 60)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  const recent = store.attempts.slice(-10).reverse();

  function drillTopic(topic: string) {
    const qids = QUESTIONS.filter((q) => q.topic === topic).map((q) => q.id);
    if (qids.length === 0) return;
    const drill = createDrill({ name: `${topic} drill`, mode: "practice", qids, limitSec: 0 });
    navigate(`/drill/${drill.id}`);
  }

  function download() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chembank-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function onImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const ok = importData(await file.text());
      setStatus(ok ? "Notebook imported." : "Import failed — the file is not a valid ChemBank export.");
    } catch {
      setStatus("Import failed — the file could not be read.");
    }
  }

  function confirmReset() {
    setResetOpen(false);
    reset();
    setStatus("Notebook reset.");
    resetRef.current?.focus();
  }

  function onModalKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setResetOpen(false);
      resetRef.current?.focus();
    }
  }

  return (
    <div className="progress">
      <header className="practice-head">
        <p className="practice-eyebrow">Progress</p>
        <h1>Progress</h1>
        <p className="practice-lede">
          Your notebook at a glance: accuracy, streaks, and the topics that need
          another pass. Everything here is computed from your latest attempt at
          each question.
        </p>
      </header>

      <div className="progress-kpis">
        <div className="progress-kpi" data-kpi="attempted">
          <p className="progress-kpi-value">{attempted}</p>
          <p className="progress-kpi-label">Attempted</p>
        </div>
        <div className="progress-kpi" data-kpi="accuracy">
          <p className="progress-kpi-value">{accuracy === null ? "—" : `${accuracy}%`}</p>
          <p className="progress-kpi-label">Accuracy</p>
        </div>
        <div className="progress-kpi" data-kpi="streak">
          <p className="progress-kpi-value">{streak}</p>
          <p className="progress-kpi-label">Day streak</p>
        </div>
        <div className="progress-kpi" data-kpi="due">
          <p className="progress-kpi-value">{due.length}</p>
          <p className="progress-kpi-label">Due now</p>
        </div>
        <div className="progress-ring-wrap">
          <ProgressRing
            value={accuracy ?? 0}
            max={100}
            size={96}
            label="Overall accuracy"
            tone={accuracy === null ? "cobalt" : accuracy >= 60 ? "acid" : "copper"}
          />
        </div>
      </div>

      <div className="results-breakdown">
        <StatPanel title="By domain" rows={statsByDomain(store.attempts)} />
        <StatPanel title="By chapter" rows={statsByChapter(store.attempts)} />
        <StatPanel title="By topic" rows={statsByTopic(store.attempts)} />
      </div>

      <section className="progress-weak" aria-label="Weakest topics">
        <h2 className="results-review-title">Weakest topics</h2>
        {weak.length === 0 ? (
          <p className="practice-empty">
            No weak topics yet. A topic appears here once you have attempted at
            least two of its questions and your latest-attempt accuracy is under
            60%.
          </p>
        ) : (
          <ul className="progress-weak-list">
            {weak.map((row) => (
              <li className="progress-weak-item" key={row.key}>
                <span className="progress-weak-copy">
                  <span className="progress-weak-topic">{row.key}</span>
                  <span className="home-coverage-count">{row.correct}/{row.attempted} · {row.accuracy}%</span>
                </span>
                <button
                  type="button"
                  className="home-button home-button-secondary"
                  onClick={() => drillTopic(row.key)}
                >
                  <Icon name="target" size={15} />
                  Drill this
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="progress-recent-wrap" aria-label="Recent activity">
        <h2 className="results-review-title">Recent attempts</h2>
        {recent.length === 0 ? (
          <p className="practice-empty">No attempts yet. Play a drill or check a question to start the ledger.</p>
        ) : (
          <ul className="progress-recent" aria-label="Recent attempts">
            {recent.map((entry, index) => {
              const question = QUESTION_BY_ID.get(entry.qid);
              return (
                <li className="progress-recent-item" key={`${entry.qid}-${entry.ts}-${index}`}>
                  <span className="progress-recent-topic">{question?.topic ?? entry.qid}</span>
                  <span className="results-verdict" data-verdict={entry.correct ? "correct" : "wrong"}>
                    {entry.correct ? "Correct" : "Wrong"}
                  </span>
                  <span className="progress-recent-meta">{entry.mode}</span>
                  <span className="progress-recent-meta">{new Date(entry.ts).toLocaleDateString()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="progress-data" aria-label="Notebook data">
        <h2 className="results-review-title">Your data</h2>
        <p className="progress-sync">Local only — sync arrives in a later build</p>
        <div className="progress-data-actions">
          <button type="button" className="home-button home-button-secondary" onClick={download}>
            <Icon name="arrow-right" size={15} />
            Export
          </button>
          <button type="button" className="home-button home-button-secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="arrow-left" size={15} />
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onImport}
          />
          <button
            ref={resetRef}
            type="button"
            className="home-button home-button-secondary progress-reset"
            onClick={() => setResetOpen(true)}
          >
            <Icon name="close" size={15} />
            Reset
          </button>
        </div>
        {status ? (
          <p className="question-copy-note" role="status" aria-live="polite">{status}</p>
        ) : null}
      </section>

      {resetOpen ? (
        <div
          className="drill-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setResetOpen(false);
              resetRef.current?.focus();
            }
          }}
        >
          <div
            className="drill-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-reset-title"
            onKeyDown={onModalKeyDown}
          >
            <h2 id="progress-reset-title">Reset notebook?</h2>
            <p className="drill-modal-copy">
              This clears every attempt, drill, review item, and stash on this
              device and starts a fresh notebook. Export first if you want a
              backup.
            </p>
            <div className="drill-modal-actions">
              <button
                ref={cancelRef}
                type="button"
                className="home-button home-button-secondary"
                autoFocus
                onClick={() => {
                  setResetOpen(false);
                  resetRef.current?.focus();
                }}
              >
                Keep my data
              </button>
              <button type="button" className="home-button home-button-primary" onClick={confirmReset}>
                Reset everything
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}