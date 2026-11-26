import { useState } from "react";
import { Link } from "react-router-dom";
import { DOMAIN_COUNTS, QUESTION_COUNT, SKILL_COUNTS } from "../data/problems";
import { SKILLS } from "../data/skills";
import { DOMAINS, type Domain } from "../data/types";
import { usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";
import { Tex } from "../components/Tex";
import { domainSlug } from "../components/ui";

export function TechniquesPage() {
  usePageMeta({
    title: "Techniques",
    description:
      "Sixteen olympiad technique guides: the big idea, when to reach for it, the traps that cost marks, and a four-step checklist for each.",
    path: "/techniques",
  });
  const [domain, setDomain] = useState<Domain | "All">("All");
  const visible = domain === "All" ? SKILLS : SKILLS.filter((skill) => skill.domain === domain);

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Techniques · sixteen guides
          </p>
          <div className="page-hero-row">
            <div>
              <h1>Learn the move, not the trick.</h1>
              <p className="page-lede">
                A technique guide is a decision aid: the big idea, when to reach for it, the traps that cost marks, and
                a four-step checklist. Each one links to every problem that uses it.
              </p>
            </div>
            <div className="page-hero-stats">
              <div>
                <span>16</span>
                <small>guides</small>
              </div>
              <div>
                <span>{QUESTION_COUNT}</span>
                <small>problems</small>
              </div>
              <div>
                <span>4</span>
                <small>domains</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="technique-filter">
            <button
              type="button"
              className={`chip ${domain === "All" ? "chip-active" : ""}`}
              aria-pressed={domain === "All"}
              onClick={() => setDomain("All")}
            >
              All domains
              <span className="chip-count">{SKILLS.length}</span>
            </button>
            {DOMAINS.map((item) => (
              <button
                type="button"
                key={item}
                className={`chip ${domain === item ? "chip-active" : ""}`}
                aria-pressed={domain === item}
                onClick={() => setDomain(item)}
              >
                {item}
                <span className="chip-count">{DOMAIN_COUNTS[item]}</span>
              </button>
            ))}
          </div>

          {DOMAINS.filter((item) => domain === "All" || item === domain).map((group) => {
            const skills = visible.filter((skill) => skill.domain === group);
            if (skills.length === 0) return null;
            return (
              <div className="technique-group" key={group}>
                <div className="technique-group-head">
                  <h2 className={`group-title domain-${domainSlug(group)}`}>{group}</h2>
                  <span>{skills.length} techniques · {DOMAIN_COUNTS[group]} problems</span>
                </div>
                <div className="technique-grid">
                  {skills.map((skill) => (
                    <Link to={`/techniques/${skill.slug}`} className="technique-card" key={skill.slug}>
                      <div className="technique-card-top">
                        <span className={`tech-code domain-${domainSlug(skill.domain)}`}>{skill.code}</span>
                        <span className="technique-count">{SKILL_COUNTS[skill.name] ?? 0} problems</span>
                      </div>
                      <h3>{skill.name}</h3>
                      <p>{skill.blurb}</p>
                      <div className="technique-formula">
                        <Tex>{skill.formula}</Tex>
                      </div>
                      <span className="technique-link">
                        Open the guide
                        <Icon name="arrow-right" size={14} />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="home-cta technique-cta">
            <div>
              <h2>Turn a guide into a set.</h2>
              <p>Pick a technique, choose a length, and let the builder draw from every problem tagged to it.</p>
            </div>
            <Link to="/practice" className="btn btn-primary btn-lg">
              Build a drill
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
