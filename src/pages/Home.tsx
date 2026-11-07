import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChoiceList } from "../components/ChoiceList";
import { Icon, type IconName } from "../components/Icon";
import { RichText } from "../components/RichText";
import { Bar, DifficultyBadge, DomainBadge } from "../components/ui";
import {
  DOMAIN_COUNTS,
  QUESTIONS,
  QUESTION_COUNT,
  questionsForPaper,
} from "../data/questions";
import {
  DOMAINS,
  type Domain,
  type PaperId,
  type Question,
} from "../data/types";
import { correctLetter, isCorrect } from "../lib/answer";

/* The hero sample is drawn from Standard items only: long enough to be real,
   short enough to finish over coffee. */
const STANDARD_QUESTIONS = QUESTIONS.filter((q) => q.difficulty === "Standard");

/* The bank is a prototype set plus the supplied papers; the lede must not
   imply all 430 items came from the four papers. */
const SUPPLIED_COUNT = QUESTIONS.filter((q) => q.source === "supplied-paper").length;
const PROTOTYPE_COUNT = QUESTION_COUNT - SUPPLIED_COUNT;

function pickSample(currentId?: string): Question {
  const pool =
    currentId && STANDARD_QUESTIONS.length > 1
      ? STANDARD_QUESTIONS.filter((q) => q.id !== currentId)
      : STANDARD_QUESTIONS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? QUESTIONS[0];
}

const CHAPTER_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

const CHAPTER_COUNTS = QUESTIONS.reduce<Record<number, number>>((acc, q) => {
  if (q.chapter !== undefined) {
    acc[q.chapter] = (acc[q.chapter] ?? 0) + 1;
  }
  return acc;
}, {});

const UNASSIGNED_CHAPTER_COUNT = QUESTIONS.filter(
  (q) => q.chapter === undefined,
).length;

const DOMAIN_TONE: Record<Domain, "cobalt" | "copper" | "acid" | "hazard"> = {
  General: "cobalt",
  Physical: "copper",
  Analytical: "acid",
  Organic: "hazard",
  Laboratory: "cobalt",
};

interface PaperCard {
  id: PaperId;
  title: string;
  copy: string;
  icon: IconName;
  kind: "theory" | "lab";
}

const PAPER_CARDS: PaperCard[] = [
  {
    id: "ch1-3-theory",
    title: "Chapters 1–3 Theory",
    copy: "Measurement, stoichiometry, atomic structure, and bonding.",
    icon: "book",
    kind: "theory",
  },
  {
    id: "ch1-3-lab",
    title: "Chapters 1–3 Lab",
    copy: "Safety, glassware, weighing, and the first bench techniques.",
    icon: "flask",
    kind: "lab",
  },
  {
    id: "ch4-7-theory",
    title: "Chapters 4–7 Theory",
    copy: "Gases, equilibrium, kinetics, organic families, and analysis.",
    icon: "book",
    kind: "theory",
  },
  {
    id: "ch4-7-lab",
    title: "Chapters 4–7 Lab",
    copy: "Titration, calorimetry, separation, and instrumental work.",
    icon: "flask",
    kind: "lab",
  },
];

/* Counts are derived from the bank, never typed in twice. */
const PAPER_ROWS = PAPER_CARDS.map((paper) => ({
  ...paper,
  count: questionsForPaper(paper.id).length,
}));

const STEPS = [
  {
    title: "Bank",
    copy: "Filter the questions by domain, chapter, topic, and difficulty until the set matches what you need to fix.",
  },
  {
    title: "Build",
    copy: "Start from a supplied paper or hand-pick items into a drill you can leave and resume.",
  },
  {
    title: "Drill",
    copy: "Work untimed or against the clock; answers and progress stay on your device.",
  },
  {
    title: "Review",
    copy: "Mistakes come back on a spaced schedule until the reasoning holds.",
  },
] as const;

/* SectionHead renders a <header>, which screen-reader role maps treat as a
   second banner landmark. Home needs a unique banner, so reuse its exact
   classes on a plain wrapper instead. */
function HomeSectionHead({
  eyebrow,
  title,
  lede,
  id,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  id: string;
}) {
  return (
    <div className="section-head">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      <p className="section-lede">{lede}</p>
    </div>
  );
}

export default function Home() {
  const [sample, setSample] = useState<Question>(() => pickSample());
  const [picked, setPicked] = useState("");
  const [checked, setChecked] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const refocusChoicesRef = useRef(false);

  const right = checked && isCorrect(sample, picked);
  const answerLetter = correctLetter(sample);

  useEffect(() => {
    if (checked) {
      resultRef.current?.focus();
    } else if (refocusChoicesRef.current) {
      /* Try another unmounts the focused result; hand focus to the new
         question's first choice instead of dropping it on the body. */
      refocusChoicesRef.current = false;
      cardRef.current?.querySelector<HTMLButtonElement>('[role="radio"]')?.focus();
    }
  }, [checked, sample]);

  function checkSample() {
    if (!picked) return;
    setChecked(true);
  }

  function tryAnother() {
    refocusChoicesRef.current = true;
    setPicked("");
    setChecked(false);
    setSample((current) => pickSample(current.id));
  }

  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow">
            Philippine National Chemistry Olympiad · reviewer
          </p>
          <h1 id="home-hero-title">
            The exam is a reaction.{" "}
            <span className="home-hero-accent">Train the conditions.</span>
          </h1>
          <p className="home-lede">
            A free reviewer built from {PROTOTYPE_COUNT} prototype questions and{" "}
            {SUPPLIED_COUNT} items across four supplied PNCO papers. Every item
            was independently re-solved and corrections are logged. Drill on a
            phone, on the bus, with the Wi-Fi off.
          </p>
          <ul className="home-trust" aria-label="What you get">
            <li>Free</li>
            <li>No account required</li>
            <li>{QUESTION_COUNT} verified questions</li>
            <li>Works offline</li>
          </ul>
          <div className="home-ctas">
            <Link
              className="home-button home-button-primary"
              to="/practice?preset=diagnostic-20"
            >
              Start the 20-question diagnostic
              <Icon name="arrow-right" size={16} />
            </Link>
            <Link className="home-button home-button-secondary" to="/bank">
              Browse the bank
            </Link>
            <Link className="home-button home-button-secondary" to="/guide">
              Read the PNCO guide
            </Link>
          </div>
        </div>

        <div className="home-hero-sample">
          <article
            className="sample-card"
            ref={cardRef}
            aria-labelledby="sample-card-label"
          >
            <p className="sample-card-label" id="sample-card-label">
              Sample question
            </p>
            <div className="sample-meta">
              <p className="sample-topic">{sample.topic}</p>
              <div className="sample-badges">
                <DomainBadge domain={sample.domain} />
                <DifficultyBadge difficulty={sample.difficulty} />
              </div>
            </div>
            <div className="sample-stem">
              <RichText text={sample.stem} />
            </div>
            <ChoiceList
              question={sample}
              value={picked}
              onChange={setPicked}
              checked={checked}
            />
            <button
              type="button"
              className="home-button home-button-primary sample-check"
              disabled={!picked}
              onClick={checkSample}
            >
              Check
            </button>
            {checked ? (
              <div
                ref={resultRef}
                className="sample-result"
                data-verdict={right ? "correct" : "wrong"}
                role="status"
                aria-live="polite"
                tabIndex={-1}
              >
                <p className="sample-verdict">
                  {right ? "Correct." : "Not quite."} You picked {picked}.
                </p>
                <p className="sample-answer">
                  Correct answer: <strong>{answerLetter}</strong>
                </p>
                <p className="sample-explanation-label">Explanation</p>
                <div className="sample-explanation">
                  <RichText text={sample.explanation} />
                </div>
                <button
                  type="button"
                  className="home-button home-button-secondary sample-another"
                  onClick={tryAnother}
                >
                  Try another
                  <Icon name="repeat" size={15} />
                </button>
              </div>
            ) : null}
          </article>
        </div>
      </section>

      <section className="home-start" aria-labelledby="home-start-title">
        <HomeSectionHead
          eyebrow="First moves"
          title="Start here"
          lede="Three ways in. Pick the one that matches the time you have right now."
          id="home-start-title"
        />
        <div className="home-start-grid">
          <Link
            className="home-start-card"
            to="/practice?preset=diagnostic-20"
          >
            <span className="home-start-icon">
              <Icon name="target" size={24} />
            </span>
            <h3>Start a 20-question diagnostic</h3>
            <p>
              Twenty mixed items, about half an hour, to map what you already
              know.
            </p>
            <span className="home-start-go">
              Begin <Icon name="arrow-right" size={14} />
            </span>
          </Link>
          <Link className="home-start-card" to="/bank">
            <span className="home-start-icon">
              <Icon name="book" size={24} />
            </span>
            <h3>Browse the bank</h3>
            <p>
              Search all {QUESTION_COUNT} items by domain, chapter, topic, and
              difficulty.
            </p>
            <span className="home-start-go">
              Open the bank <Icon name="arrow-right" size={14} />
            </span>
          </Link>
          <Link className="home-start-card" to="/guide">
            <span className="home-start-icon">
              <Icon name="flask" size={24} />
            </span>
            <h3>Read the PNCO guide</h3>
            <p>
              What the olympiad is, how the rounds work, and what to study
              first.
            </p>
            <span className="home-start-go">
              Read the guide <Icon name="arrow-right" size={14} />
            </span>
          </Link>
        </div>
      </section>

      <section className="home-coverage" aria-labelledby="home-coverage-title">
        <HomeSectionHead
          eyebrow="The bank"
          title="What the bank covers"
          lede={`${QUESTION_COUNT} questions across five domains and seven chapters, plus the four supplied papers as ready-made drills.`}
          id="home-coverage-title"
        />
        <div className="home-coverage-panels">
          <div className="home-coverage-panel">
            <h3>By domain</h3>
            <ul className="home-coverage-list">
              {DOMAINS.map((domain) => (
                <li className="home-coverage-row" key={domain}>
                  <span className="home-coverage-label">
                    <DomainBadge domain={domain} />
                  </span>
                  <div className="home-coverage-meter">
                    <Bar
                      value={DOMAIN_COUNTS[domain]}
                      max={QUESTION_COUNT}
                      tone={DOMAIN_TONE[domain]}
                      label={`${domain}: ${DOMAIN_COUNTS[domain]} questions`}
                    />
                    <span className="home-coverage-count">
                      {DOMAIN_COUNTS[domain]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="home-coverage-panel">
            <h3>By chapter</h3>
            <ul className="home-coverage-list">
              {CHAPTER_NUMBERS.map((chapter) => {
                const count = CHAPTER_COUNTS[chapter] ?? 0;
                return (
                  <li className="home-coverage-row" key={chapter}>
                    <span className="home-coverage-label">
                      Chapter {chapter}
                    </span>
                    <div className="home-coverage-meter">
                      <Bar
                        value={count}
                        max={QUESTION_COUNT}
                        tone="copper"
                        label={`Chapter ${chapter}: ${count} questions`}
                      />
                      <span className="home-coverage-count">{count}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="home-coverage-note">
              {UNASSIGNED_CHAPTER_COUNT} items are unassigned to a chapter.
            </p>
          </div>
        </div>

        <div className="home-papers">
          <div className="home-papers-head">
            <h3>Four supplied papers</h3>
            <p className="home-papers-note">Each paper is a fixed drill</p>
          </div>
          <div className="home-papers-grid">
            {PAPER_ROWS.map((paper) => (
              <article
                className="home-paper"
                data-kind={paper.kind}
                key={paper.id}
                aria-labelledby={`paper-${paper.id}`}
              >
                <span className="home-paper-icon">
                  <Icon name={paper.icon} size={22} />
                </span>
                <h3 id={`paper-${paper.id}`}>{paper.title}</h3>
                <p className="home-paper-meta">
                  <span className="home-paper-count">{paper.count}</span> items
                </p>
                <p className="home-paper-copy">{paper.copy}</p>
                <Link
                  className="home-paper-link"
                  to={`/practice?preset=paper&paper=${paper.id}`}
                  aria-label={`Drill this paper: ${paper.title}`}
                >
                  Drill this paper <Icon name="arrow-right" size={14} />
                </Link>
              </article>
            ))}
          </div>
          <p className="home-note">
            Four supplied items are withheld because no choice exactly matches
            the computed answer.{" "}
            <Link to="/about#corrections">Read the corrections log</Link>
          </p>
        </div>
      </section>

      <section className="home-how" aria-labelledby="home-how-title">
        <HomeSectionHead
          eyebrow="The loop"
          title="How it works"
          lede="Bank, build, drill, review. The loop is deliberately short."
          id="home-how-title"
        />
        <ol className="home-steps">
          {STEPS.map((step, index) => (
            <li className="home-step" key={step.title}>
              <span className="home-step-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="home-honesty"
        aria-label="Independence and corrections"
      >
        <p>
          Independent and unofficial. Not affiliated with, endorsed by, or
          produced by PFCS, PNCO, DepEd, ACheS, or Ateneo.
        </p>
        <Link to="/about#corrections">Corrections and methodology</Link>
      </section>
    </div>
  );
}
