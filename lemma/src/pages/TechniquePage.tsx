import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PROBLEMS } from "../data/problems";
import { SKILL_BY_SLUG, SKILLS } from "../data/skills";
import { plainMath, usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";
import { RichText, Tex } from "../components/Tex";
import { ProblemCard } from "../components/ProblemCard";
import { DomainBadge, domainSlug } from "../components/ui";
import { NotFoundPage } from "./NotFound";

export function TechniquePage() {
  const { slug } = useParams();
  const skill = slug ? SKILL_BY_SLUG.get(slug) : undefined;
  usePageMeta({
    title: skill ? skill.name : "Technique not found",
    description: skill
      ? plainMath(`${skill.blurb} ${skill.bigIdea}`)
      : "That technique guide does not exist in the Lemma bank.",
    path: slug ? `/techniques/${slug}` : undefined,
    noindex: !skill,
  });
  const [showAll, setShowAll] = useState(false);

  if (!skill) return <NotFoundPage />;

  const problems = PROBLEMS.filter((problem) => problem.skill === skill.name);
  const visible = showAll ? problems : problems.slice(0, 6);
  const sameDomain = SKILLS.filter((item) => item.domain === skill.domain && item.slug !== skill.slug);
  const next = sameDomain[0];

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/techniques">Techniques</Link>
          <Icon name="chevron-right" size={13} />
          <Link to={`/bank?domain=${encodeURIComponent(skill.domain)}`}>{skill.domain}</Link>
          <Icon name="chevron-right" size={13} />
          <span>{skill.name}</span>
        </nav>
      </div>

      <section className="technique-hero">
        <div className="container technique-hero-grid">
          <div>
            <div className="technique-hero-badges">
              <DomainBadge domain={skill.domain} />
              <span className={`tech-code domain-${domainSlug(skill.domain)}`}>{skill.code}</span>
            </div>
            <h1>{skill.name}</h1>
            <p className="page-lede">{skill.blurb}</p>
            <div className="hero-actions">
              <Link to={`/practice?skill=${skill.slug}`} className="btn btn-primary">
                <Icon name="play" size={16} />
                Drill this technique
              </Link>
              <Link to={`/bank?domain=${encodeURIComponent(skill.domain)}`} className="btn btn-secondary">
                Browse {skill.domain}
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </div>
          <div className="formula-card">
            <p className="side-label">The formula to keep close</p>
            <div className="formula-display">
              <Tex display>{skill.formula}</Tex>
            </div>
            <span className="formula-count">{problems.length} problems in the bank</span>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container technique-content">
          <div className="big-idea">
            <p className="eyebrow">The big idea</p>
            <p className="big-idea-text">
              <RichText text={skill.bigIdea} />
            </p>
          </div>

          <div className="guide-grid">
            <div className="guide-card">
              <div className="guide-head">
                <span className="guide-icon"><Icon name="target" size={18} /></span>
                <h2>When to reach for it</h2>
              </div>
              <ul className="guide-list">
                {skill.whenToUse.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="guide-card guide-traps">
              <div className="guide-head">
                <span className="guide-icon"><Icon name="alert" size={18} /></span>
                <h2>Traps that cost marks</h2>
              </div>
              <ul className="guide-list">
                {skill.traps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="guide-card">
              <div className="guide-head">
                <span className="guide-icon"><Icon name="check" size={18} /></span>
                <h2>Four-step checklist</h2>
              </div>
              <ol className="guide-list guide-checklist">
                {skill.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="related-head technique-problems-head">
            <div>
              <p className="eyebrow">Practice the move</p>
              <h2>{problems.length} problems tagged {skill.name}</h2>
            </div>
            <Link to={`/practice?skill=${skill.slug}`} className="text-button">
              Make a drill
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <div className="problem-grid">
            {visible.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
          {problems.length > 6 ? (
            <div className="load-more">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Show fewer" : `Show all ${problems.length}`}
                <Icon name={showAll ? "minus" : "plus"} size={16} />
              </button>
            </div>
          ) : null}

          {next ? (
            <Link to={`/techniques/${next.slug}`} className="next-technique">
              <span>
                <small>Next in {skill.domain}</small>
                <strong>{next.name}</strong>
              </span>
              <Icon name="arrow-right" size={20} />
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
