import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PROBLEMS, PROBLEM_BY_ID, SKILL_BY_NAME, isCorrect, relatedProblems } from "../data/problems";
import { useStore } from "../store";
import { plainMath, usePageMeta } from "../lib/meta";
import { AnswerArea, type ProofGrade } from "../components/AnswerArea";
import { Icon } from "../components/Icon";
import { RichText } from "../components/Tex";
import { DifficultyBadge, DomainBadge, TypeBadge } from "../components/ui";
import { ProblemCard } from "../components/ProblemCard";
import { NotFoundPage } from "./NotFound";

export function ProblemPage() {
  const { id } = useParams();
  const problem = id ? PROBLEM_BY_ID.get(id) : undefined;
  usePageMeta({
    title: problem ? problem.skill : "Problem not found",
    description: problem ? plainMath(problem.stem) : "That problem does not exist in the Lemma bank.",
    path: id ? `/problem/${id}` : undefined,
    noindex: !problem,
  });

  const { state, recordAttempt, toggleStash } = useStore();
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [grade, setGrade] = useState<ProofGrade | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setValue("");
    setChecked(false);
    setCorrect(false);
    setSolutionOpen(false);
    setGrade(undefined);
    setCopied(false);
    startRef.current = Date.now();
  }, [id]);

  if (!problem) return <NotFoundPage />;

  const stashed = state.stashed.includes(problem.id);
  const skill = SKILL_BY_NAME.get(problem.skill);
  const related = relatedProblems(problem, 3);
  const index = PROBLEMS.findIndex((item) => item.id === problem.id);
  const next = PROBLEMS[(index + 1) % PROBLEMS.length];

  const check = () => {
    if (checked || !value.trim()) return;
    const ok = isCorrect(problem, value);
    setCorrect(ok);
    setChecked(true);
    setSolutionOpen(true);
    recordAttempt({
      qid: problem.id,
      correct: ok,
      answer: value,
      elapsedSec: Math.max(1, Math.round((Date.now() - startRef.current) / 1000)),
      mode: "single",
    });
  };

  const onGrade = (nextGrade: ProofGrade) => {
    setGrade(nextGrade);
    setChecked(true);
    setSolutionOpen(true);
    recordAttempt({
      qid: problem.id,
      correct: nextGrade === "got",
      answer: nextGrade,
      elapsedSec: Math.max(1, Math.round((Date.now() - startRef.current) / 1000)),
      mode: "proof",
    });
  };

  const retry = () => {
    setValue("");
    setChecked(false);
    setCorrect(false);
    setSolutionOpen(false);
    setGrade(undefined);
    startRef.current = Date.now();
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/problem/${problem.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this problem link:", url);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/bank">Problem bank</Link>
          <Icon name="chevron-right" size={13} />
          <Link to={`/bank?domain=${encodeURIComponent(problem.domain)}`}>{problem.domain}</Link>
          <Icon name="chevron-right" size={13} />
          <span>{problem.skill}</span>
        </nav>
      </div>

      <div className="container problem-layout">
        <article className="problem-main">
          <h1 className="sr-only">{problem.skill}</h1>
          <header className="problem-head">
            <div className="problem-badges">
              <DomainBadge domain={problem.domain} />
              <DifficultyBadge difficulty={problem.difficulty} />
              <TypeBadge type={problem.type} />
              {problem.collection === "official" ? <span className="official-badge">Official</span> : null}
            </div>
            <span className="problem-id">{problem.id}</span>
          </header>

          {problem.collection === "official" && problem.paper ? (
            <aside className="official-source">
              <div className="official-source-head">
                <span className="official-badge">Official paper</span>
                <span>
                  {problem.paper.year} AMO · Day {problem.paper.day} · Problem {problem.paper.number}
                </span>
              </div>
              <p>
                Transcribed from the Australian Mathematics Trust paper. The question is © Australian Mathematics
                Trust; the outline and rubric below are Lemma's own, not the official solution.
              </p>
              <a href={problem.paper.url} target="_blank" rel="noreferrer">
                Open the official paper and solutions (PDF)
                <Icon name="external" size={14} />
              </a>
            </aside>
          ) : null}

          <div className="problem-stem">
            <RichText text={problem.stem} />
          </div>

          <AnswerArea
            problem={problem}
            value={value}
            onChange={setValue}
            checked={checked}
            correct={correct}
            solutionOpen={solutionOpen}
            onCheck={check}
            onToggleSolution={() => setSolutionOpen((open) => !open)}
            onRetry={retry}
            grade={grade}
            onGrade={onGrade}
          />

          <footer className="problem-footer">
            <div className="problem-footer-actions">
              <button
                type="button"
                className={`stash-button ${stashed ? "is-stashed" : ""}`}
                onClick={() => toggleStash(problem.id)}
              >
                <Icon name="bookmark" size={17} filled={stashed} />
                {stashed ? "Stashed for review" : "Stash for review"}
              </button>
              <button type="button" className="stash-button" onClick={copyLink} aria-live="polite">
                <Icon name={copied ? "check" : "link"} size={17} />
                {copied ? "Link copied" : "Copy link"}
              </button>
            </div>
            <Link to={`/problem/${next.id}`} className="btn btn-secondary btn-sm">
              Next problem
              <Icon name="arrow-right" size={15} />
            </Link>
          </footer>
        </article>

        <aside className="problem-side">
          <div className="side-card">
            <p className="side-label">At a glance</p>
            <dl className="meta-list">
              <div>
                <dt>Domain</dt>
                <dd>{problem.domain}</dd>
              </div>
              <div>
                <dt>Technique</dt>
                <dd>
                  {skill ? <Link to={`/techniques/${skill.slug}`}>{problem.skill}</Link> : problem.skill}
                </dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>{problem.difficulty}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>
                  {problem.type === "proof" ? "Written proof" : problem.type === "mc" ? "Multiple choice" : "Short answer"}
                </dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  {problem.collection === "official" && problem.paper ? (
                    <a href={problem.paper.url} target="_blank" rel="noreferrer">
                      AMT · {problem.paper.year} AMO
                    </a>
                  ) : (
                    problem.source ?? "Lemma original bank"
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {skill ? (
            <div className="side-card side-technique">
              <p className="side-label">Technique</p>
              <h3>{skill.name}</h3>
              <p>{skill.blurb}</p>
              <div className="side-actions">
                <Link to={`/techniques/${skill.slug}`} className="btn btn-secondary btn-sm">
                  Open guide
                  <Icon name="arrow-right" size={14} />
                </Link>
                <Link to={`/practice?skill=${skill.slug}`} className="btn btn-primary btn-sm">
                  Drill this skill
                  <Icon name="play" size={14} />
                </Link>
              </div>
            </div>
          ) : null}

          <div className="side-card side-note">
            <p className="side-label">
              <Icon name="info" size={14} /> How marking works
            </p>
            <p>
              {problem.type === "proof"
                ? "Proofs are self-assessed against the rubric. Mark yourself honestly — the analytics are only as useful as the marking."
                : "Your answer is checked in the browser. A wrong first attempt stays in Review so you can re-solve it later."}
            </p>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="section section-tight">
          <div className="container">
            <div className="related-head">
              <h2>Keep the thread</h2>
              <Link to={`/bank?domain=${encodeURIComponent(problem.domain)}`} className="text-button">
                More {problem.domain}
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            <div className="problem-grid">
              {related.map((item) => (
                <ProblemCard key={item.id} problem={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
