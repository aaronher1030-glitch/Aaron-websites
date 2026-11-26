import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PROBLEM_BY_ID, formatDuration, isCorrect } from "../data/problems";
import type { Drill } from "../data/types";
import { useStore } from "../store";
import { answeredCount, isQuestionCorrect } from "../lib/drill";
import { clamp } from "../lib/format";
import { usePageMeta } from "../lib/meta";
import { AnswerArea, type ProofGrade } from "../components/AnswerArea";
import { Icon } from "../components/Icon";
import { RichText } from "../components/Tex";
import { DifficultyBadge, DomainBadge, EmptyState, Modal, TypeBadge } from "../components/ui";

export function DrillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, saveDrill, recordAttempt, toggleStash } = useStore();
  const drill = state.drills.find((item) => item.id === id);

  const [elapsed, setElapsed] = useState(drill?.elapsedSec ?? 0);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  const drillRef = useRef<Drill | undefined>(drill);
  drillRef.current = drill;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const endedRef = useRef(false);
  const questionStartRef = useRef(Date.now());

  const currentIndex = drill ? clamp(drill.index, 0, drill.qids.length - 1) : 0;
  const currentId = drill?.qids[currentIndex] ?? "";
  const problem = currentId ? PROBLEM_BY_ID.get(currentId) : undefined;

  usePageMeta({ title: drill ? drill.name : "Drill", noindex: true });

  const finish = useCallback(
    (auto: boolean) => {
      const current = drillRef.current;
      if (!current || current.done) return;
      endedRef.current = true;
      saveDrill({
        ...current,
        elapsedSec: elapsedRef.current,
        done: true,
        finishedAt: Date.now(),
      });
      navigate(`/drill/${current.id}/results`, { replace: auto });
    },
    [navigate, saveDrill],
  );

  useEffect(() => {
    setElapsed(drill?.elapsedSec ?? 0);
    setSolutionOpen(false);
    setFinishOpen(false);
    endedRef.current = false;
  }, [drill?.id]);

  useEffect(() => {
    if (!drill || drill.done) return;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [drill?.id, drill?.done]);

  useEffect(() => {
    if (!drill || drill.done) return;
    if (elapsed === 0 || elapsed % 15 !== 0 || drill.elapsedSec === elapsed) return;
    saveDrill({ ...drill, elapsedSec: elapsed });
  }, [elapsed, drill, saveDrill]);

  useEffect(() => {
    questionStartRef.current = Date.now();
    const current = drillRef.current;
    setSolutionOpen(current ? Boolean(current.checked[currentId]) : false);
  }, [currentId]);

  useEffect(() => {
    if (!drill || drill.done || !drill.limitSec || endedRef.current) return;
    if (elapsed >= drill.limitSec) finish(true);
  }, [elapsed, drill, finish]);

  useEffect(() => {
    return () => {
      const current = drillRef.current;
      if (endedRef.current || !current || current.done) return;
      if (elapsedRef.current !== current.elapsedSec) {
        saveDrill({ ...current, elapsedSec: elapsedRef.current });
      }
    };
  }, [saveDrill]);

  useEffect(() => {
    if (!drill || drill.done) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        saveDrill({ ...drillRef.current!, index: clamp(currentIndex + 1, 0, drill.qids.length - 1) });
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        saveDrill({ ...drillRef.current!, index: clamp(currentIndex - 1, 0, drill.qids.length - 1) });
      } else if (event.key.toLowerCase() === "f") {
        saveDrill({
          ...drillRef.current!,
          flagged: { ...drill.flagged, [currentId]: !drill.flagged[currentId] },
        });
      } else if (problem?.type === "mc" && !drill.checked[currentId]) {
        const key = event.key.toUpperCase();
        const letter = /^[1-4]$/.test(key)
          ? String.fromCharCode(64 + Number(key))
          : /^[A-D]$/.test(key)
            ? key
            : "";
        const choiceIndex = letter ? letter.charCodeAt(0) - 65 : -1;
        if (letter && problem.choices && choiceIndex >= 0 && choiceIndex < problem.choices.length) {
          event.preventDefault();
          saveDrill({
            ...drillRef.current!,
            answers: { ...drill.answers, [currentId]: letter },
          });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drill, currentId, currentIndex, problem, saveDrill]);

  if (!drill) {
    return (
      <div className="page">
        <div className="container narrow section">
          <EmptyState
            icon="search"
            title="That drill no longer exists."
            action={
              <Link to="/practice" className="btn btn-primary btn-sm">
                Build a new drill
                <Icon name="arrow-right" size={15} />
              </Link>
            }
          >
            It may have been deleted from this browser's storage.
          </EmptyState>
        </div>
      </div>
    );
  }

  if (drill.done) {
    return <Navigate to={`/drill/${drill.id}/results`} replace />;
  }

  const answered = answeredCount(drill);
  const total = drill.qids.length;
  const checked = Boolean(drill.checked[currentId]);
  const grade = drill.grades?.[currentId];
  const correct = checked ? isQuestionCorrect(drill, currentId) : false;
  const value = drill.answers[currentId] ?? "";
  const flagged = Boolean(drill.flagged[currentId]);
  const stashed = state.stashed.includes(currentId);
  const position = currentIndex + 1;
  const remaining = drill.limitSec ? Math.max(0, drill.limitSec - elapsed) : elapsed;
  const warning = Boolean(drill.limitSec) && remaining <= 60;

  const update = (patch: Partial<Drill>) => saveDrill({ ...drill, ...patch, elapsedSec: elapsed });

  const questionElapsed = () => Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));

  const check = () => {
    if (!problem || checked || !value.trim() || problem.type === "proof") return;
    const ok = isCorrect(problem, value);
    update({ checked: { ...drill.checked, [currentId]: true } });
    setSolutionOpen(true);
    recordAttempt({
      qid: currentId,
      correct: ok,
      answer: value,
      elapsedSec: questionElapsed(),
      mode: drill.mode,
    });
  };

  const onGrade = (nextGrade: ProofGrade) => {
    update({
      checked: { ...drill.checked, [currentId]: true },
      grades: { ...drill.grades, [currentId]: nextGrade },
    });
    setSolutionOpen(true);
    recordAttempt({
      qid: currentId,
      correct: nextGrade === "got",
      answer: nextGrade,
      elapsedSec: questionElapsed(),
      mode: "proof",
    });
  };

  const goTo = (nextIndex: number) => {
    update({ index: clamp(nextIndex, 0, total - 1) });
  };

  return (
    <div className="page drill-page">
      <div className="container">
        <div className="drill-top">
          <Link to="/practice" className="drill-back">
            <Icon name="arrow-left" size={15} />
            Practice
          </Link>
          <div className="drill-title">
            <span className={`mode-chip ${drill.mode === "timed" ? "mode-timed" : ""}`}>
              <Icon name={drill.mode === "timed" ? "clock" : "play"} size={12} />
              {drill.mode === "timed" ? "Timed" : "Practice"}
            </span>
            <h1>{drill.name}</h1>
          </div>
          <div className={`drill-timer ${warning ? "timer-warning" : ""}`}>
            <Icon name="clock" size={18} />
            <div>
              <span>{formatDuration(remaining)}</span>
              <small>{drill.limitSec ? "remaining" : "elapsed"}</small>
            </div>
          </div>
        </div>

        <div className="drill-progress">
          <div className="drill-progress-track">
            <span style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
          </div>
          <span>
            {answered} / {total} answered
          </span>
        </div>

        <div className="drill-layout">
          <main className="drill-main">
            {problem ? (
              <article className="drill-card">
                <div className="drill-card-head">
                  <div className="drill-qnum">
                    <span>Question</span>
                    <strong>
                      {position}
                      <small> / {total}</small>
                    </strong>
                  </div>
                  <div className="problem-badges">
                    <DomainBadge domain={problem.domain} />
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <TypeBadge type={problem.type} />
                  </div>
                </div>

                <p className="drill-skill">{problem.skill}</p>

                <div className="problem-stem drill-stem">
                  <RichText text={problem.stem} />
                </div>

                <AnswerArea
                  problem={problem}
                  value={value}
                  onChange={(next) => update({ answers: { ...drill.answers, [currentId]: next } })}
                  checked={checked}
                  correct={correct}
                  solutionOpen={solutionOpen}
                  onCheck={check}
                  onToggleSolution={() => setSolutionOpen((open) => !open)}
                  grade={grade}
                  onGrade={onGrade}
                  allowSolutionBeforeCheck={false}
                />
              </article>
            ) : (
              <EmptyState icon="alert" title="This question is missing from the bank." />
            )}

            <div className="drill-nav">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <Icon name="arrow-left" size={15} />
                Previous
              </button>
              <button
                type="button"
                className={`flag-button ${flagged ? "is-flagged" : ""}`}
                onClick={() => update({ flagged: { ...drill.flagged, [currentId]: !flagged } })}
              >
                <Icon name="flag" size={16} filled={flagged} />
                {flagged ? "Flagged" : "Flag"}
              </button>
              {currentIndex < total - 1 ? (
                <button type="button" className="btn btn-primary" onClick={() => goTo(currentIndex + 1)}>
                  Next
                  <Icon name="arrow-right" size={15} />
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setFinishOpen(true)}>
                  Finish drill
                  <Icon name="check" size={15} />
                </button>
              )}
            </div>
          </main>

          <aside className="drill-side">
            <div className="side-card">
              <div className="side-card-head">
                <p className="side-label">Question map</p>
                <span>{answered}/{total}</span>
              </div>
              <div className="navigator">
                {drill.qids.map((qid, index) => {
                  const isChecked = Boolean(drill.checked[qid]);
                  const isCorrectAnswer = isChecked && isQuestionCorrect(drill, qid);
                  return (
                    <button
                      type="button"
                      key={qid}
                      className={[
                        "nav-dot",
                        index === currentIndex ? "nav-current" : "",
                        isChecked ? (isCorrectAnswer ? "nav-right" : "nav-wrong") : "",
                        drill.flagged[qid] ? "nav-flagged" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => goTo(index)}
                      aria-label={`Question ${index + 1}${isChecked ? (isCorrectAnswer ? ", correct" : ", answered") : ", unanswered"}`}
                      aria-current={index === currentIndex ? "step" : undefined}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="nav-legend">
                <span>
                  <i className="dot dot-current" /> Current
                </span>
                <span>
                  <i className="dot dot-right" /> Correct
                </span>
                <span>
                  <i className="dot dot-wrong" /> Missed
                </span>
              </div>
            </div>

            <div className="side-card">
              <p className="side-label">Actions</p>
              <div className="side-action-list">
                <button
                  type="button"
                  className={`side-action ${stashed ? "is-active" : ""}`}
                  onClick={() => toggleStash(currentId)}
                >
                  <Icon name="bookmark" size={16} filled={stashed} />
                  {stashed ? "Stashed" : "Stash for review"}
                </button>
                <button
                  type="button"
                  className={`side-action ${flagged ? "is-active" : ""}`}
                  onClick={() => update({ flagged: { ...drill.flagged, [currentId]: !flagged } })}
                >
                  <Icon name="flag" size={16} filled={flagged} />
                  {flagged ? "Flagged" : "Flag to revisit"}
                </button>
                <button type="button" className="side-action" onClick={() => setFinishOpen(true)}>
                  <Icon name="check" size={16} />
                  Finish and mark
                </button>
              </div>
            </div>

            <div className="side-card side-note">
              <p className="side-label">
                <Icon name="info" size={14} /> Keys
              </p>
              <p>
                <kbd>←</kbd> <kbd>→</kbd> move between questions. <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–
                <kbd>4</kbd> pick a choice. <kbd>F</kbd> flags. Progress saves after every answer.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Finish this drill?"
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFinishOpen(false)}>
              Keep working
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => finish(false)}>
              Finish &amp; see results
              <Icon name="arrow-right" size={15} />
            </button>
          </>
        }
      >
        <p>
          You have answered <strong>{answered}</strong> of <strong>{total}</strong>. Unanswered questions stay
          unanswered in your accuracy, so a low score here is honest — not a penalty.
        </p>
        <p className="modal-note">
          The clock {drill.limitSec ? `stops at ${formatDuration(remaining)} remaining` : "is untimed"}. You can review
          every question on the results page.
        </p>
      </Modal>
    </div>
  );
}
