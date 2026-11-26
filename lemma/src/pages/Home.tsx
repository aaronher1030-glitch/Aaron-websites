import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AMO_FAQ, COMPETITIONS, VERIFIED } from "../data/amo";
import { PROBLEM_BY_ID, QUESTION_COUNT, SKILL_COUNTS, isCorrect, answerLabel } from "../data/problems";
import { SKILLS } from "../data/skills";
import { DOMAIN_COUNTS } from "../data/problems";
import { DOMAINS, type Domain } from "../data/types";
import { useStore } from "../store";
import { usePageMeta } from "../lib/meta";
import { RichText } from "../components/Tex";
import { Icon, type IconName } from "../components/Icon";
import { ChoiceList } from "../components/AnswerArea";
import { DifficultyBadge, SectionHead, domainSlug } from "../components/ui";

const DOMAIN_META: Record<Domain, { code: string; blurb: string }> = {
  Algebra: {
    code: "ALG",
    blurb: "Vieta, functional equations, inequalities, and recurrences — the language the other three domains borrow.",
  },
  "Number Theory": {
    code: "NT",
    blurb: "Divisibility, modular arithmetic, Diophantine equations, and gcd. Small statements with deep restrictions.",
  },
  Combinatorics: {
    code: "COMB",
    blurb: "Counting, probability, pigeonhole, invariants, and games. The domain where representation is everything.",
  },
  Geometry: {
    code: "GEO",
    blurb: "Angle chasing, circles, area ratios, coordinates, and trigonometry — from clean facts to hard configurations.",
  },
};

const LOOP: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "layers",
    title: "Build a set",
    text: "Choose a diagnostic, a daily five, a proof paper, or a custom filter set. The builder shows exactly what it can draw from.",
  },
  {
    icon: "target",
    title: "Drill with intent",
    text: "One question at a time, with a timer you can see. Flag, stash, or move on — a real paper never lets you camp on one problem.",
  },
  {
    icon: "check",
    title: "Mark honestly",
    text: "Short answers check instantly. Proofs are self-assessed against a rubric, because a multiple-choice box cannot read a proof.",
  },
  {
    icon: "refresh",
    title: "Repair the gap",
    text: "Every wrong answer and stashed problem lands in Review. Re-solve from a blank page before you touch a new topic.",
  },
];

function SampleProblem() {
  const sample = PROBLEM_BY_ID.get("alg-vieta-2");
  const { recordAttempt } = useStore();
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);

  if (!sample) return null;
  const correct = isCorrect(sample, value);

  const check = () => {
    if (!value || checked) return;
    setChecked(true);
    setSolutionOpen(true);
    recordAttempt({ qid: sample.id, correct, answer: value, elapsedSec: 0, mode: "single" });
  };

  return (
    <article className="sample-card">
      <span className="sample-tape" aria-hidden="true" />
      <div className="sample-head">
        <span className="sample-kicker">Sample · try it</span>
        <DifficultyBadge difficulty={sample.difficulty} />
      </div>
      <p className="sample-stem">
        <RichText text={sample.stem} />
      </p>
      <ChoiceList problem={sample} value={value} onChange={setValue} checked={checked} />
      <div className="sample-actions">
        {!checked ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={check} disabled={!value}>
            Check answer
            <Icon name="arrow-right" size={15} />
          </button>
        ) : (
          <span className={`sample-result ${correct ? "is-correct" : "is-wrong"}`}>
            <Icon name={correct ? "check" : "alert"} size={16} />
            {correct ? "Correct." : <span>Not quite — answer <RichText text={answerLabel(sample)} /></span>}
          </span>
        )}
        <button type="button" className="text-button" onClick={() => setSolutionOpen((open) => !open)}>
          {solutionOpen ? "Hide solution" : "Show solution"}
        </button>
      </div>
      {solutionOpen ? (
        <div className="sample-solution">
          <p className="solution-body">
            <RichText text={sample.explanation} />
          </p>
        </div>
      ) : null}
      <Link to={`/problem/${sample.id}`} className="sample-link">
        Open the full problem
        <Icon name="arrow-up-right" size={15} />
      </Link>
    </article>
  );
}

export function HomePage() {
  usePageMeta({ path: "/" });
  const featured = useMemo(
    () =>
      ["polynomials-vieta", "modular-arithmetic", "pigeonhole", "circles"].map((slug) =>
        SKILLS.find((skill) => skill.slug === slug),
      ),
    [],
  );

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              Independent AMO training · {QUESTION_COUNT} problems
            </p>
            <h1>
              Proof is a muscle.
              <br />
              <em>Train it.</em>
            </h1>
            <p className="hero-lede">
              A problem bank for every competition called AMO. Short answers, multiple choice, proof labs, and all 40
              official Australian AMO questions from 2016–2020 — organized by 16 techniques, with worked solutions and
              honest self-assessment.
            </p>
            <div className="hero-actions">
              <Link to="/practice" className="btn btn-primary btn-lg">
                <Icon name="play" size={17} />
                Start a drill
              </Link>
              <Link to="/bank" className="btn btn-secondary btn-lg">
                Browse the bank
                <Icon name="arrow-right" size={17} />
              </Link>
            </div>
            <ul className="hero-points">
              <li>
                <Icon name="check" size={15} /> No account
              </li>
              <li>
                <Icon name="check" size={15} /> No paywall
              </li>
              <li>
                <Icon name="check" size={15} /> Works offline after load
              </li>
            </ul>
          </div>
          <div className="hero-demo">
            <SampleProblem />
          </div>
        </div>

        <div className="container">
          <div className="stat-strip">
            <div className="stat">
              <span className="stat-num">{QUESTION_COUNT}</span>
              <span className="stat-label">problems</span>
            </div>
            <div className="stat">
              <span className="stat-num">40</span>
              <span className="stat-label">official AMO</span>
            </div>
            <div className="stat">
              <span className="stat-num">16</span>
              <span className="stat-label">technique guides</span>
            </div>
            <div className="stat">
              <span className="stat-num">$0</span>
              <span className="stat-label">forever</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="01 — One name, five contests"
            title={
              <>
                “AMO” is not one exam.
                <br />
                <span className="muted-serif">Train for the one you are sitting.</span>
              </>
            }
            text="Australian AMO is a proof paper. American AMO is a 25-question short-answer paper. Asia AMO is primary. ASMO is multi-subject. PAMO is two days of proofs. The formats barely resemble each other."
            action={
              <Link to="/amo-guide" className="btn btn-secondary btn-sm">
                Compare all five
                <Icon name="arrow-right" size={15} />
              </Link>
            }
          />
          <div className="amo-mini-grid">
            {COMPETITIONS.map((competition) => (
              <Link
                key={competition.slug}
                to={`/amo-guide#${competition.slug}`}
                className="amo-mini-card"
                style={{ "--accent": competition.accent } as CSSProperties}
              >
                <div className="amo-mini-top">
                  <span className="amo-mini-dot" />
                  <span className="amo-mini-style">{competition.style}</span>
                </div>
                <h3>{competition.short}</h3>
                <p>{competition.organizer}</p>
                <span className="amo-mini-meta">{competition.duration}</span>
                <span className="amo-mini-link">
                  Format &amp; syllabus
                  <Icon name="arrow-up-right" size={14} />
                </span>
              </Link>
            ))}
          </div>
          <p className="verified-note">
            <Icon name="info" size={14} /> Formats last checked {VERIFIED}. Always confirm with the official organiser.
          </p>
        </div>
      </section>

      <section className="section section-loop">
        <div className="container">
          <SectionHead
            eyebrow="02 — The training loop"
            title="Practice you can actually close."
            text="Most banks give you questions. Lemma gives you a loop: build, drill, mark, repair. The next set is chosen from what you missed."
          />
          <div className="loop-grid">
            {LOOP.map((step, index) => (
              <div className="loop-card" key={step.title}>
                <div className="loop-top">
                  <span className="loop-icon">
                    <Icon name={step.icon} size={20} />
                  </span>
                  <span className="loop-num">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="03 — The bank"
            title="Four domains. Sixteen techniques."
            text="Every problem is tagged to one technique, so a session has a target — not just a difficulty label."
            action={
              <Link to="/techniques" className="btn btn-secondary btn-sm">
                All techniques
                <Icon name="arrow-right" size={15} />
              </Link>
            }
          />
          <div className="domain-grid">
            {DOMAINS.map((domain) => {
              const skills = SKILLS.filter((skill) => skill.domain === domain);
              return (
                <Link
                  key={domain}
                  to={`/bank?domain=${encodeURIComponent(domain)}`}
                  className={`domain-card domain-${domainSlug(domain)}`}
                >
                  <div className="domain-card-top">
                    <span className="domain-code">{DOMAIN_META[domain].code}</span>
                    <span className="domain-count">{DOMAIN_COUNTS[domain]} problems</span>
                  </div>
                  <h3>{domain}</h3>
                  <p>{DOMAIN_META[domain].blurb}</p>
                  <div className="domain-skill-list">
                    {skills.slice(0, 4).map((skill) => (
                      <span key={skill.slug}>{skill.name}</span>
                    ))}
                  </div>
                  <span className="domain-link">
                    Browse {domain}
                    <Icon name="arrow-right" size={15} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-techniques">
        <div className="container">
          <SectionHead
            eyebrow="04 — Technique first"
            title="Learn the move, then meet it in the wild."
            text="Each guide names the big idea, when to reach for it, the traps that cost marks, and a four-step checklist."
            action={
              <Link to="/techniques" className="btn btn-secondary btn-sm">
                View all 16
                <Icon name="arrow-right" size={15} />
              </Link>
            }
          />
          <div className="featured-tech-grid">
            {featured.map((skill) =>
              skill ? (
                <Link to={`/techniques/${skill.slug}`} className="featured-tech" key={skill.slug}>
                  <div className="featured-tech-top">
                    <span className={`tech-code domain-${domainSlug(skill.domain)}`}>{skill.code}</span>
                    <span className="featured-tech-count">{SKILL_COUNTS[skill.name] ?? 0} problems</span>
                  </div>
                  <h3>{skill.name}</h3>
                  <p>{skill.blurb}</p>
                  <span className="featured-tech-link">
                    Open guide
                    <Icon name="arrow-right" size={14} />
                  </span>
                </Link>
              ) : null,
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="proof-band">
            <div className="proof-band-copy">
              <p className="eyebrow eyebrow-light">
                <span className="eyebrow-dot" />
                The Proof Lab · 16 originals + 40 official
              </p>
              <h2>
                Some answers are a number.
                <br />
                Some are an argument.
              </h2>
              <p>
                Sixteen original proof prompts with model proofs, plus all 40 official Australian AMO questions with
                Lemma outlines and rubrics. Write your solution, reveal the outline, then mark the gaps yourself. No
                fake auto-grading.
              </p>
              <div className="proof-band-actions">
                <Link to="/bank?type=proof" className="btn btn-paper btn-lg">
                  Browse proof prompts
                  <Icon name="arrow-right" size={16} />
                </Link>
                <Link to="/practice" className="btn btn-ghost-light btn-lg">
                  Sit a proof paper
                </Link>
              </div>
            </div>
            <div className="proof-band-aside">
              <div className="proof-stat">
                <span className="proof-stat-num">56</span>
                <span>proof prompts</span>
              </div>
              <div className="proof-stat">
                <span className="proof-stat-num">4</span>
                <span>rubric points each</span>
              </div>
              <div className="proof-stat">
                <span className="proof-stat-num">8</span>
                <span>problems in an AMO paper</span>
              </div>
              <p className="proof-band-note">
                The 16 Proof Lab prompts are original Lemma content. The 40 official questions are transcribed from AMT
                papers with attribution; their outlines and rubrics are Lemma's own.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container faq-wrap">
          <SectionHead eyebrow="05 — Straight answers" title="Questions worth asking." />
          <div className="faq-list">
            {AMO_FAQ.slice(0, 5).map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>
                  {item.q}
                  <Icon name="chevron-down" size={18} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="home-cta">
            <div>
              <h2>Ready for the first set?</h2>
              <p>Five questions, twenty minutes, no account. Start with the daily five.</p>
            </div>
            <Link to="/practice" className="btn btn-primary btn-lg">
              Build a drill
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
