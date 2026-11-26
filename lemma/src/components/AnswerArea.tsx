import { useEffect, useRef } from "react";
import { answerLabel, choiceLetter } from "../data/problems";
import type { Problem } from "../data/types";
import { Icon } from "./Icon";
import { RichText } from "./Tex";

interface ChoiceListProps {
  problem: Problem;
  value: string;
  onChange: (value: string) => void;
  checked: boolean;
}

export function ChoiceList({ problem, value, onChange, checked }: ChoiceListProps) {
  if (!problem.choices) return null;
  return (
    <div className="choice-list" role="radiogroup" aria-label="Answer choices">
      {problem.choices.map((choice, index) => {
        const letter = choiceLetter(index);
        const picked = value === letter;
        const right = checked && problem.answer === letter;
        const wrong = checked && picked && !right;
        return (
          <button
            type="button"
            key={letter}
            role="radio"
            aria-checked={picked}
            disabled={checked}
            className={`choice ${picked ? "choice-picked" : ""} ${right ? "choice-right" : ""} ${
              wrong ? "choice-wrong" : ""
            }`}
            onClick={() => onChange(letter)}
          >
            <span className="choice-letter">{letter}</span>
            <span className="choice-body">
              <RichText text={choice} />
            </span>
            {right ? <Icon name="check" size={16} /> : null}
            {wrong ? <Icon name="close" size={16} /> : null}
          </button>
        );
      })}
    </div>
  );
}

export type ProofGrade = "got" | "partial" | "miss";

interface AnswerAreaProps {
  problem: Problem;
  value: string;
  onChange: (value: string) => void;
  checked: boolean;
  correct: boolean;
  solutionOpen: boolean;
  onCheck: () => void;
  onToggleSolution: () => void;
  onRetry?: () => void;
  grade?: ProofGrade;
  onGrade?: (grade: ProofGrade) => void;
  compact?: boolean;
  allowSolutionBeforeCheck?: boolean;
}

const GRADE_LABELS: Record<ProofGrade, string> = {
  got: "I got it",
  partial: "Partial",
  miss: "Missed it",
};

export function AnswerArea({
  problem,
  value,
  onChange,
  checked,
  correct,
  solutionOpen,
  onCheck,
  onToggleSolution,
  onRetry,
  grade,
  onGrade,
  compact = false,
  allowSolutionBeforeCheck = true,
}: AnswerAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (problem.type !== "int" || checked) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Enter" && document.activeElement === inputRef.current) {
        event.preventDefault();
        onCheck();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [problem.type, checked, onCheck]);

  const canCheck = value.trim().length > 0 && !checked;
  const isProof = problem.type === "proof";
  const proofLabel = problem.collection === "official" ? "outline" : "model proof";

  return (
    <div className={`answer-area ${compact ? "answer-compact" : ""}`}>
      {isProof ? (
        <>
          <label className="field-label" htmlFor={`proof-${problem.id}`}>
            Your proof outline
          </label>
          <textarea
            id={`proof-${problem.id}`}
            className="proof-input"
            rows={compact ? 4 : 6}
            placeholder="Write the key claim, the main move, and how the argument closes. You will mark it yourself against the rubric."
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={Boolean(grade)}
          />
          <div className="answer-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onToggleSolution}>
              <Icon name="eye" size={16} />
              {solutionOpen ? `Hide ${proofLabel}` : `Reveal ${proofLabel}`}
            </button>
            <span className="self-note">Self-assessed — no fake auto-grading.</span>
          </div>
          {solutionOpen && onGrade ? (
            <div className="grade-row">
              <span className="grade-prompt">How did you do?</span>
              {(Object.keys(GRADE_LABELS) as ProofGrade[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  className={`grade-btn grade-${key} ${grade === key ? "grade-active" : ""}`}
                  onClick={() => onGrade(key)}
                >
                  {GRADE_LABELS[key]}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : problem.type === "mc" ? (
        <ChoiceList problem={problem} value={value} onChange={onChange} checked={checked} />
      ) : (
        <div className="int-row">
          <label className="sr-only" htmlFor={`int-${problem.id}`}>
            Your answer
          </label>
          <input
            ref={inputRef}
            id={`int-${problem.id}`}
            className="int-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Type a number"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={checked}
          />
          <button type="button" className="btn btn-primary" onClick={onCheck} disabled={!canCheck}>
            Check
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      )}

      {!isProof ? (
        <div className="answer-actions">
          {!checked ? (
            problem.type === "mc" ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={onCheck} disabled={!canCheck}>
                Check answer
                <Icon name="arrow-right" size={16} />
              </button>
            ) : null
          ) : null}
          {allowSolutionBeforeCheck || checked ? (
            <button type="button" className="text-button" onClick={onToggleSolution}>
              <Icon name="eye" size={15} />
              {solutionOpen ? "Hide solution" : "Show solution"}
            </button>
          ) : null}
          {checked && !correct && onRetry ? (
            <button type="button" className="text-button" onClick={onRetry}>
              <Icon name="refresh" size={15} />
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {checked ? (
        <div className={`feedback ${correct ? "feedback-correct" : "feedback-wrong"}`} role="status">
          <span className="feedback-icon">
            <Icon name={correct ? "check" : "alert"} size={18} />
          </span>
          <div>
            <strong>
              {isProof
                ? grade === "got"
                  ? "Marked as solved"
                  : grade === "partial"
                    ? "Partial credit"
                    : "Not yet — read the outline, then try a fresh one"
                : correct
                  ? "Correct"
                  : "Not quite"}
            </strong>
            {!isProof && !correct ? (
              <span className="feedback-answer">
                Answer: <RichText text={answerLabel(problem)} />
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {solutionOpen ? (
        <div className="solution">
          <div className="solution-head">
            <span className="solution-label">
              <Icon name={isProof ? "book" : "spark"} size={16} />
              {isProof ? (problem.collection === "official" ? "Lemma outline" : "Model proof") : "Worked solution"}
            </span>
            {problem.source ? <span className="solution-source">{problem.source}</span> : null}
          </div>
          {!isProof ? (
            <p className="solution-answer">
              Answer: <strong><RichText text={answerLabel(problem)} /></strong>
            </p>
          ) : null}
          <p className="solution-body">
            <RichText text={problem.explanation} />
          </p>
          {problem.rubric ? (
            <div className="rubric">
              <p className="rubric-title">Mark yourself against this rubric</p>
              <ol>
                {problem.rubric.map((item) => (
                  <li key={item}>
                    <RichText text={item} />
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
