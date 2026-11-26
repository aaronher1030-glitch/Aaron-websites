import { Link } from "react-router-dom";
import { PROBLEMS } from "../data/problems";
import { SKILLS } from "../data/skills";
import { usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";

export function AboutPage() {
  usePageMeta({
    title: "About & method",
    description:
      "How Lemma is built: 208 original olympiad problems plus all 40 official Australian AMO questions from 2016–2020, rubric-based proof marking, and local-only progress.",
    path: "/about",
  });
  const officialCount = PROBLEMS.filter((problem) => problem.collection === "official").length;
  const originalCount = PROBLEMS.length - officialCount;

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            About Lemma
          </p>
          <h1>A small, honest training tool.</h1>
          <p className="page-lede about-lede">
            Lemma is an independent problem bank and proof-training studio for students preparing for the AMO family of
            competitions. It is deliberately not an LMS, not a course, and not affiliated with any organiser.
          </p>
          <div className="about-stats">
            <div>
              <span>{PROBLEMS.length}</span>
              <small>problems</small>
            </div>
            <div>
              <span>{originalCount}</span>
              <small>original for Lemma</small>
            </div>
            <div>
              <span>{officialCount}</span>
              <small>official AMO questions</small>
            </div>
            <div>
              <span>{SKILLS.length}</span>
              <small>technique guides</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container about-grid">
          <div className="about-main">
            <div className="about-block">
              <p className="eyebrow">What it is</p>
              <h2>Practice with a target.</h2>
              <p>
                Every problem is tagged to one of {SKILLS.length} techniques. Every technique has a guide that explains
                the big idea, the situations that call for it, and the traps. A drill is assembled from those tags, so
                a session has a purpose beyond “ten random questions”.
              </p>
              <p>
                The training loop is the product: build a set, sit it one question at a time, mark it honestly, then
                repair what broke. Progress and mistake review close the loop without an account.
              </p>
            </div>

            <div className="about-block">
              <p className="eyebrow">What it is not</p>
              <h2>Attribution, not affiliation.</h2>
              <p>
                The official collection transcribes all 40 Australian AMO questions from 2016–2020, with attribution
                to the Australian Mathematics Trust and a link to each paper. The outlines and rubrics beside those
                questions are Lemma's own, not official solutions. Everything else in the bank was written for this
                project or supplied for it.
              </p>
              <p>
                Lemma is not endorsed by AMT, SIMCC, the Asia AMO organisation, ASMO, PAMO, or any national olympiad
                body. Competition names are used descriptively, and trademarks belong to their owners.
              </p>
            </div>

            <div className="about-block">
              <p className="eyebrow">How marking works</p>
              <h2>Instant where it can be. Honest where it cannot.</h2>
              <ul className="about-list">
                <li>
                  <strong>Short answers</strong> are compared numerically after normalising spaces, commas, signs,
                  fractions, and decimals. Equivalent forms such as <code>1/2</code> and <code>0.5</code> are accepted.
                </li>
                <li>
                  <strong>Multiple choice</strong> is exact. The worked solution always explains the reasoning, not just
                  the letter.
                </li>
                <li>
                  <strong>Proofs</strong> are self-assessed against a short rubric after revealing a model proof or a
                  Lemma outline. There is no fake automatic proof grader. Analytics treat “I got it” as correct;
                  partial and missed proofs remain in Review.
                </li>
                <li>
                  <strong>Analytics</strong> use your latest attempt per question, so a corrected problem stops dragging
                  down your accuracy. Attempt history is still kept locally.
                </li>
              </ul>
            </div>

            <div className="about-block">
              <p className="eyebrow">Data &amp; privacy</p>
              <h2>Your browser is the database.</h2>
              <p>
                There is no account, no analytics script, and no server-side profile. Attempts, drills, stashed
                problems, and theme choice live in one localStorage entry. Export a JSON file to move them; import it on
                another device. Clearing browser data deletes them, so export first if they matter.
              </p>
            </div>

            <div className="about-block">
              <p className="eyebrow">Sources &amp; verification</p>
              <h2>Facts with a date on them.</h2>
              <p>
                The AMO Guide distinguishes five competitions that share the name. Formats were checked against the
                organisers' public pages in November 2026, including the Australian AMO restructuring and the Asia AMO
                preliminary. Rules change; the guide links every source and labels the verification date.
              </p>
              <Link to="/amo-guide" className="text-button about-link">
                Read the AMO guide and sources
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          </div>

          <aside className="about-side">
            <div className="side-card">
              <p className="side-label">Principles</p>
              <ol className="principle-list">
                <li>
                  <strong>Clear provenance.</strong> Official AMO questions are attributed; everything else is written
                  for Lemma.
                </li>
                <li>
                  <strong>No dark patterns.</strong> No paywall, no streak guilt, no account wall.
                </li>
                <li>
                  <strong>Mark honestly.</strong> Self-assessment is a skill; fake certainty is not.
                </li>
                <li>
                  <strong>Name the uncertainty.</strong> Competition formats change, so every fact has a date and a
                  source.
                </li>
                <li>
                  <strong>Fast by default.</strong> Static pages, system fonts where possible, math rendered locally.
                </li>
              </ol>
            </div>

            <div className="side-card">
              <p className="side-label">Built with</p>
              <ul className="tech-list">
                <li>React + TypeScript</li>
                <li>Vite</li>
                <li>KaTeX for mathematics</li>
                <li>React Router</li>
                <li>Cloudflare Pages</li>
              </ul>
              <p className="side-note-text">
                The site is a static build. No application server, no database, no third-party tracking.
              </p>
            </div>

            <div className="side-card side-note">
              <p className="side-label">
                <Icon name="alert" size={14} /> Independence
              </p>
              <p>
                Lemma is not affiliated with AMT, SIMCC, ASMO, PAMO, or any olympiad organiser. If you are entering a
                competition, the official organiser's rules always override anything here.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="home-cta">
            <div>
              <h2>Try the loop once.</h2>
              <p>One question is enough to see whether the format suits you.</p>
            </div>
            <Link to="/practice" className="btn btn-primary btn-lg">
              Start a diagnostic
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
