import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { formatDuration } from "../data/problems";
import { SKILL_BY_NAME } from "../data/problems";
import type { Theme } from "../data/types";
import { useStore } from "../store";
import { relativeTime, percent } from "../lib/format";
import { usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";
import { Bar, EmptyState, Modal, ProgressRing, SectionHead } from "../components/ui";

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: "monitor" | "sun" | "moon" }> = [
  { value: "auto", label: "Auto", icon: "monitor" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

export function ProgressPage() {
  usePageMeta({ title: "Progress", noindex: true });
  const { state, stats, exportData, importData, clearHistory, setTheme } = useStore();
  const [sortWeak, setSortWeak] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const activeDrills = state.drills.filter((drill) => !drill.done);
  const weakest = useMemo(() => {
    const rows = stats.bySkill.slice();
    if (sortWeak) {
      rows.sort((a, b) => {
        if (a.accuracy === null && b.accuracy === null) return a.skill.localeCompare(b.skill);
        if (a.accuracy === null) return 1;
        if (b.accuracy === null) return -1;
        return a.accuracy - b.accuracy;
      });
    }
    return rows;
  }, [stats.bySkill, sortWeak]);

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = importData(text);
    setMessage(ok ? "Progress imported." : "That file is not a valid Lemma export.");
    event.target.value = "";
  };

  const doReset = () => {
    clearHistory();
    setResetOpen(false);
    setMessage("All progress cleared.");
  };

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Progress · stored in this browser
          </p>
          <div className="page-hero-row">
            <div>
              <h1>Your training log.</h1>
              <p className="page-lede">
                Latest attempt per question, accuracy by technique, and the gaps worth repairing next. No account; the
                data lives in this browser until you export or clear it.
              </p>
            </div>
            <div className="page-hero-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={exportData}>
                <Icon name="download" size={15} />
                Export JSON
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                <Icon name="upload" size={15} />
                Import
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          {stats.attempted > 0 ? (
            <>
              <div className="overview-grid">
                <div className="overview-ring-card">
                  <ProgressRing
                    value={stats.accuracy ?? 0}
                    size={142}
                    label={percent(stats.accuracy)}
                    sublabel="accuracy"
                  />
                  <div>
                    <p className="side-label">Overall</p>
                    <h2>
                      {stats.solved} of {stats.totalProblems} solved
                    </h2>
                    <p>
                      {stats.attempted} problem{stats.attempted === 1 ? "" : "s"} attempted across{" "}
                      {state.attempts.length} logged attempt{state.attempts.length === 1 ? "" : "s"}.
                    </p>
                    <div className="overview-ring-foot">
                      <span>
                        <Icon name="flame" size={15} /> {stats.streak}-day streak
                      </span>
                      <span>
                        <Icon name="calendar" size={15} /> {stats.today} checked today
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overview-metrics">
                  <div className="metric-card">
                    <span className="metric-icon"><Icon name="layers" size={17} /></span>
                    <strong>{stats.attempted}</strong>
                    <small>attempted</small>
                  </div>
                  <div className="metric-card">
                    <span className="metric-icon"><Icon name="check" size={17} /></span>
                    <strong>{stats.solved}</strong>
                    <small>solved</small>
                  </div>
                  <div className="metric-card">
                    <span className="metric-icon"><Icon name="flame" size={17} /></span>
                    <strong>{stats.streak}</strong>
                    <small>day streak</small>
                  </div>
                  <div className="metric-card">
                    <span className="metric-icon"><Icon name="clock" size={17} /></span>
                    <strong>{stats.avgTime ? formatDuration(Math.round(stats.avgTime)) : "—"}</strong>
                    <small>avg time / problem</small>
                  </div>
                </div>
              </div>

              <SectionHead eyebrow="By domain" title="Where the marks are." />
              <div className="domain-progress-grid">
                {stats.byDomain.map((row) => (
                  <div className="domain-progress-card" key={row.domain}>
                    <div className="domain-progress-top">
                      <h3>{row.domain}</h3>
                      <span>{percent(row.accuracy)}</span>
                    </div>
                    <Bar value={row.accuracy} />
                    <div className="domain-progress-meta">
                      <span>{row.attempted} of {row.total} attempted</span>
                      <span>{row.correct} correct</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="difficulty-progress">
                {stats.byDifficulty.map((row) => (
                  <div className="difficulty-card" key={row.difficulty}>
                    <span className={`difficulty difficulty-${row.difficulty.toLowerCase()}`}>{row.difficulty}</span>
                    <strong>{percent(row.accuracy)}</strong>
                    <small>{row.attempted} of {row.total} attempted</small>
                    <Bar value={row.accuracy} tone={row.difficulty === "Challenge" ? "orange" : "brand"} />
                  </div>
                ))}
              </div>

              <div className="section-split-head">
                <SectionHead
                  eyebrow="By technique"
                  title="Sixteen dials, not one score."
                  text="A high overall accuracy can hide a dead technique. Sort by weakest to choose the next drill."
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSortWeak((value) => !value)}>
                  <Icon name="shuffle" size={15} />
                  {sortWeak ? "Restore order" : "Weakest first"}
                </button>
              </div>
              <div className="skill-table">
                <div className="skill-table-head">
                  <span>Technique</span>
                  <span>Domain</span>
                  <span>Accuracy</span>
                  <span>Attempted</span>
                  <span>Avg time</span>
                </div>
                {weakest.map((row) => (
                  <div className="skill-table-row" key={row.skill}>
                    <span className="skill-table-name">{row.skill}</span>
                    <span className="skill-table-domain">{SKILL_BY_NAME.get(row.skill)?.domain ?? "—"}</span>
                    <span className="skill-table-acc">
                      <Bar value={row.accuracy} />
                      <em>{percent(row.accuracy)}</em>
                    </span>
                    <span>
                      {row.attempted}/{row.total}
                    </span>
                    <span>{row.avgTime ? formatDuration(Math.round(row.avgTime)) : "—"}</span>
                  </div>
                ))}
              </div>

              <div className="activity-grid">
                <div>
                  <div className="related-head">
                    <h2>Recent attempts</h2>
                    <Link to="/review" className="text-button">
                      Review mistakes
                      <Icon name="arrow-right" size={14} />
                    </Link>
                  </div>
                  <div className="activity-list">
                    {stats.recent.map(({ attempt, problem }) => (
                      <Link to={`/problem/${problem.id}`} className="activity-row" key={`${attempt.qid}-${attempt.ts}`}>
                        <span className={`activity-icon ${attempt.correct ? "is-correct" : "is-wrong"}`}>
                          <Icon name={attempt.correct ? "check" : "close"} size={14} />
                        </span>
                        <span className="activity-main">
                          <strong>{problem.skill}</strong>
                          <small>{problem.domain} · {relativeTime(attempt.ts)}</small>
                        </span>
                        <span className="activity-domain">{attempt.mode}</span>
                        <Icon name="chevron-right" size={15} />
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="related-head">
                    <h2>In progress</h2>
                    <Link to="/practice" className="text-button">
                      New drill
                      <Icon name="arrow-right" size={14} />
                    </Link>
                  </div>
                  {activeDrills.length > 0 ? (
                    <div className="active-drill-list">
                      {activeDrills.map((drill) => (
                        <Link to={`/drill/${drill.id}`} className="active-drill" key={drill.id}>
                          <span className="resume-icon">
                            <Icon name={drill.mode === "timed" ? "clock" : "play"} size={16} />
                          </span>
                          <span className="active-drill-main">
                            <strong>{drill.name}</strong>
                            <small>{drill.qids.length} questions · {drill.mode}</small>
                          </span>
                          <Icon name="arrow-right" size={15} />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="mini-empty">
                      <Icon name="check" size={18} />
                      <p>No open drills. Every set has been finished.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon="chart"
              title="No attempts logged yet."
              action={
                <Link to="/practice" className="btn btn-primary btn-sm">
                  Start with the diagnostic
                  <Icon name="arrow-right" size={15} />
                </Link>
              }
            >
              Answer one question and this page fills in: accuracy, technique gaps, streak, average time, and recent
              activity. Progress is stored locally, so it stays after a refresh.
            </EmptyState>
          )}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="settings-grid">
            <div className="settings-card">
              <div>
                <p className="side-label">Your data</p>
                <h3>Local, portable, deletable.</h3>
                <p>
                  Everything is stored in one localStorage object. Export it before clearing your browser, or move it
                  to another device with Import.
                </p>
              </div>
              <div className="settings-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={exportData}>
                  <Icon name="download" size={15} />
                  Export
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                  <Icon name="upload" size={15} />
                  Import
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setResetOpen(true)}>
                  <Icon name="trash" size={15} />
                  Reset
                </button>
              </div>
              {message ? (
                <p className="settings-message" role="status">
                  {message}
                </p>
              ) : null}
            </div>

            <div className="settings-card">
              <div>
                <p className="side-label">Appearance</p>
                <h3>Paper or ink.</h3>
                <p>Auto follows your system theme. The choice is saved across visits.</p>
              </div>
              <div className="theme-picker" role="group" aria-label="Theme">
                {THEME_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={state.theme === option.value ? "is-active" : ""}
                    aria-pressed={state.theme === option.value}
                    onClick={() => setTheme(option.value)}
                  >
                    <Icon name={option.icon} size={16} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset all progress?"
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setResetOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={doReset}>
              Yes, clear everything
            </button>
          </>
        }
      >
        <p>
          This deletes every attempt, every saved drill, and every stashed problem from this browser. It cannot be
          undone. Export first if you might want the data back.
        </p>
      </Modal>
    </div>
  );
}
