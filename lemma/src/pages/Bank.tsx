import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DIFFICULTY_RANK, DOMAIN_COUNTS, PROBLEMS, SKILL_BY_SLUG } from "../data/problems";
import { SKILLS } from "../data/skills";
import {
  DIFFICULTIES,
  DOMAINS,
  type Collection,
  type Difficulty,
  type Domain,
  type ProblemType,
} from "../data/types";
import { usePageMeta } from "../lib/meta";
import { Icon } from "../components/Icon";
import { ProblemCard } from "../components/ProblemCard";
import { EmptyState } from "../components/ui";

type SortKey = "recommended" | "easiest" | "hardest" | "skill" | "random";

const TYPE_OPTIONS: Array<{ value: ProblemType; label: string }> = [
  { value: "int", label: "Short answer" },
  { value: "mc", label: "Multiple choice" },
  { value: "proof", label: "Proof" },
];

const TYPE_COUNTS = PROBLEMS.reduce<Record<ProblemType, number>>(
  (acc, problem) => {
    acc[problem.type] += 1;
    return acc;
  },
  { int: 0, mc: 0, proof: 0 },
);

const COLLECTION_OPTIONS: Array<{ value: Collection; label: string }> = [
  { value: "official", label: "Official AMO papers" },
  { value: "original", label: "Lemma original bank" },
];

const COLLECTION_COUNTS = PROBLEMS.reduce<Record<Collection, number>>(
  (acc, problem) => {
    acc[problem.collection ?? "original"] += 1;
    return acc;
  },
  { original: 0, official: 0 },
);

const DIFFICULTY_COUNTS = PROBLEMS.reduce<Record<Difficulty, number>>(
  (acc, problem) => {
    acc[problem.difficulty] += 1;
    return acc;
  },
  { Easy: 0, Medium: 0, Hard: 0, Challenge: 0 },
);

function hashString(value: string, seed: number): number {
  let hash = seed;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1_000_003;
  }
  return hash;
}

function isDomain(value: string | null): value is Domain {
  return Boolean(value) && (DOMAINS as readonly string[]).includes(value as string);
}

function toggleValue<T>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function BankPage() {
  usePageMeta({
    title: "Problem bank",
    description:
      "Search the full Lemma bank by domain, technique, difficulty, or format: short-answer, multiple-choice, and proof problems with worked solutions.",
    path: "/bank",
  });
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const domainParam = params.get("domain");
  const typeParam = params.get("type");
  const collectionParam = params.get("collection");
  const skillParam = params.get("skill");
  const initialSkill = skillParam ? SKILL_BY_SLUG.get(skillParam) : undefined;

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [domains, setDomains] = useState<Domain[]>(isDomain(domainParam) ? [domainParam] : []);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [collections, setCollections] = useState<Collection[]>(
    collectionParam === "official" || collectionParam === "original" ? [collectionParam] : [],
  );
  const [types, setTypes] = useState<ProblemType[]>(
    typeParam === "proof" || typeParam === "int" || typeParam === "mc" ? [typeParam] : [],
  );
  const [skill, setSkill] = useState(initialSkill?.name ?? "");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [limit, setLimit] = useState(24);
  const [seed, setSeed] = useState(7);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = PROBLEMS.filter((problem) => {
      if (domains.length > 0 && !domains.includes(problem.domain)) return false;
      if (difficulties.length > 0 && !difficulties.includes(problem.difficulty)) return false;
      if (collections.length > 0 && !collections.includes(problem.collection ?? "original")) return false;
      if (types.length > 0 && !types.includes(problem.type)) return false;
      if (skill && problem.skill !== skill) return false;
      if (query) {
        const haystack =
          `${problem.stem} ${problem.skill} ${problem.domain} ${problem.id} ${problem.paper?.title ?? ""} ${problem.source ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    const sorted = list.slice();
    if (sort === "easiest") {
      sorted.sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]);
    } else if (sort === "hardest") {
      sorted.sort((a, b) => DIFFICULTY_RANK[b.difficulty] - DIFFICULTY_RANK[a.difficulty]);
    } else if (sort === "skill") {
      sorted.sort((a, b) => a.skill.localeCompare(b.skill));
    } else if (sort === "random") {
      sorted.sort((a, b) => hashString(a.id, seed) - hashString(b.id, seed));
    } else {
      sorted.sort((a, b) => {
        const rank = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
        if (rank !== 0) return rank;
        return DOMAINS.indexOf(a.domain) - DOMAINS.indexOf(b.domain);
      });
    }
    return sorted;
  }, [search, domains, difficulties, collections, types, skill, sort, seed]);

  useEffect(() => {
    setLimit(24);
  }, [search, domains, difficulties, collections, types, skill, sort, seed]);

  const visible = filtered.slice(0, limit);
  const activeCount =
    domains.length +
    difficulties.length +
    collections.length +
    types.length +
    (skill ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const clearAll = () => {
    setSearch("");
    setDomains([]);
    setDifficulties([]);
    setCollections([]);
    setTypes([]);
    setSkill("");
  };

  const pickSort = (value: string) => {
    const next = value as SortKey;
    setSort(next);
    if (next === "random") setSeed((current) => current + 1);
  };

  const openRandom = () => {
    if (filtered.length === 0) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    navigate(`/problem/${pick.id}`);
  };

  return (
    <div className="page">
      <section className="page-hero bank-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            The bank · {PROBLEMS.length} problems
          </p>
          <div className="page-hero-row">
            <div>
              <h1>Every problem, one index.</h1>
              <p className="page-lede">
                Search the full bank by collection, domain, technique, difficulty, or format. Short answers check
                instantly; proofs come with a model and a rubric.
              </p>
            </div>
            <div className="page-hero-stats">
              <div>
                <span>{DOMAIN_COUNTS.Algebra}</span>
                <small>per domain</small>
              </div>
              <div>
                <span>16</span>
                <small>techniques</small>
              </div>
              <div>
                <span>{TYPE_COUNTS.proof}</span>
                <small>proofs</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="bank-toolbar">
            <div className="search-box">
              <Icon name="search" size={18} />
              <input
                type="search"
                placeholder="Search a statement, technique, or problem id…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search problems"
              />
              {search ? (
                <button type="button" className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                  <Icon name="close" size={15} />
                </button>
              ) : null}
            </div>
            <label className="sort-control">
              <span>Sort</span>
              <select value={sort} onChange={(event) => pickSort(event.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="easiest">Easiest first</option>
                <option value="hardest">Hardest first</option>
                <option value="skill">Technique A–Z</option>
                <option value="random">Random</option>
              </select>
              <Icon name="chevron-down" size={14} />
            </label>
          </div>

          <div className="filter-panel">
            <div className="filter-row">
              <span className="filter-label">Collection</span>
              <div className="chip-row">
                {COLLECTION_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`chip ${collections.includes(option.value) ? "chip-active" : ""}`}
                    aria-pressed={collections.includes(option.value)}
                    onClick={() => setCollections((current) => toggleValue(current, option.value))}
                  >
                    {option.label}
                    <span className="chip-count">{COLLECTION_COUNTS[option.value]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-row">
              <span className="filter-label">Domain</span>
              <div className="chip-row">
                {DOMAINS.map((domain) => (
                  <button
                    type="button"
                    key={domain}
                    className={`chip ${domains.includes(domain) ? "chip-active" : ""}`}
                    aria-pressed={domains.includes(domain)}
                    onClick={() => setDomains((current) => toggleValue(current, domain))}
                  >
                    {domain}
                    <span className="chip-count">{DOMAIN_COUNTS[domain]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-row">
              <span className="filter-label">Difficulty</span>
              <div className="chip-row">
                {DIFFICULTIES.map((difficulty) => (
                  <button
                    type="button"
                    key={difficulty}
                    className={`chip ${difficulties.includes(difficulty) ? "chip-active" : ""}`}
                    aria-pressed={difficulties.includes(difficulty)}
                    onClick={() => setDifficulties((current) => toggleValue(current, difficulty))}
                  >
                    {difficulty}
                    <span className="chip-count">{DIFFICULTY_COUNTS[difficulty]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-row">
              <span className="filter-label">Format</span>
              <div className="chip-row">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`chip ${types.includes(option.value) ? "chip-active" : ""}`}
                    aria-pressed={types.includes(option.value)}
                    onClick={() => setTypes((current) => toggleValue(current, option.value))}
                  >
                    {option.label}
                    <span className="chip-count">{TYPE_COUNTS[option.value]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-row filter-row-last">
              <span className="filter-label">Technique</span>
              <label className="select-control">
                <select value={skill} onChange={(event) => setSkill(event.target.value)} aria-label="Filter by technique">
                  <option value="">Any technique</option>
                  {DOMAINS.map((domain) => (
                    <optgroup key={domain} label={domain}>
                      {SKILLS.filter((item) => item.domain === domain).map((item) => (
                        <option key={item.slug} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <Icon name="chevron-down" size={14} />
              </label>
              {activeCount > 0 ? (
                <button type="button" className="text-button clear-button" onClick={clearAll}>
                  <Icon name="close" size={14} />
                  Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="results-bar">
            <p>
              <strong>{filtered.length}</strong> problem{filtered.length === 1 ? "" : "s"}
              {filtered.length !== PROBLEMS.length ? ` of ${PROBLEMS.length}` : ""}
            </p>
            <div className="results-bar-actions">
              <span>Showing {visible.length}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={openRandom}
                disabled={filtered.length === 0}
              >
                <Icon name="shuffle" size={15} />
                Random problem
              </button>
            </div>
          </div>

          {visible.length > 0 ? (
            <>
              <div className="problem-grid">
                {visible.map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
              {visible.length < filtered.length ? (
                <div className="load-more">
                  <button type="button" className="btn btn-secondary" onClick={() => setLimit((value) => value + 24)}>
                    Load 24 more
                    <Icon name="plus" size={16} />
                  </button>
                  <span>
                    {visible.length} of {filtered.length}
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon="search"
              title="No problems match that combination."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={clearAll}>
                  Clear all filters
                </button>
              }
            >
              Try removing a difficulty or format filter, or search for a technique like “pigeonhole”.
            </EmptyState>
          )}
        </div>
      </section>
    </div>
  );
}
