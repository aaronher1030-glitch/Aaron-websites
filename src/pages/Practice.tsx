import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DIFFICULTIES, DOMAINS, type Difficulty, type Domain, type ProblemType, type Drill } from "../data/types";
import { PROOF_PROBLEMS } from "../data/proofs";
import { PROBLEMS, SKILL_BY_SLUG } from "../data/problems";
import { SKILLS } from "../data/skills";
import { useStore } from "../store";
import { createDrill, drillStats } from "../lib/drill";
import { filterPool, selectProblems, type SelectionFilters } from "../lib/select";
import { usePageMeta } from "../lib/meta";
import { Icon, type IconName } from "../components/Icon";
import { EmptyState, SectionHead } from "../components/ui";

interface Preset {
  id: string;
  name: string;
  description: string;
  count: number;
  minutes: number;
  mode: "practice" | "timed";
  types: ProblemType[];
  difficulties?: Difficulty[];
  icon: IconName;
  tag: string;
  unseenOnly?: boolean;
  weakFirst?: boolean;
  balanceDomains?: boolean;
}

const PRESETS: Preset[] = [
  {
    id: "diagnostic",
    name: "Diagnostic",
    description: "Eight mixed short-answer questions across all four domains. Find the shape of your current ability.",
    count: 8,
    minutes: 30,
    mode: "practice",
    types: ["int", "mc"],
    icon: "compass",
    tag: "Start here",
    unseenOnly: true,
    balanceDomains: true,
  },
  {
    id: "daily",
    name: "Daily five",
    description: "Five questions, twenty minutes. Small enough to finish, hard enough to matter.",
    count: 5,
    minutes: 20,
    mode: "practice",
    types: [],
    icon: "calendar",
    tag: "Daily habit",
    balanceDomains: true,
  },
  {
    id: "proof-paper",
    name: "AMO proof paper",
    description: "Six proof prompts, three hours, no short cuts. Mark each one against its rubric when the clock stops.",
    count: 6,
    minutes: 180,
    mode: "timed",
    types: ["proof"],
    difficulties: ["Hard", "Challenge"],
    icon: "book",
    tag: "3 hours",
  },
  {
    id: "sprint",
    name: "Short-answer sprint",
    description: "Fifteen multiple-choice and short-answer problems in twenty-five minutes. Pace, not perfection.",
    count: 15,
    minutes: 25,
    mode: "timed",
    types: ["int", "mc"],
    icon: "flame",
    tag: "25 min",
    balanceDomains: true,
  },
  {
    id: "weak",
    name: "Weak spots",
    description: "Ten questions chosen from your lowest-accuracy techniques, unseen problems first.",
    count: 10,
    minutes: 30,
    mode: "practice",
    types: [],
    icon: "target",
    tag: "Adaptive",
    weakFirst: true,
  },
  {
    id: "long-mixed",
    name: "Long mixed set",
    description: "Twenty questions across every domain and format, with a full hour on the clock.",
    count: 20,
    minutes: 60,
    mode: "timed",
    types: [],
    icon: "layers",
    tag: "60 min",
    balanceDomains: true,
  },
];

const TYPE_LABEL: Record<ProblemType, string> = {
  int: "Short answer",
  mc: "Multiple choice",
  proof: "Proof",
};

function toggleValue<T>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function DrillRow({ drill }: { drill: Drill }) {
  const { deleteDrill } = useStore();
  const stats = drillStats(drill);
  return (
    <div className="resume-row">
      <div className="resume-main">
        <span className="resume-icon">
          <Icon name={drill.mode === "timed" ? "clock" : "play"} size={17} />
        </span>
        <div>
          <p className="resume-name">{drill.name}</p>
          <p className="resume-meta">
            {stats.answered} of {stats.total} answered · {drill.mode === "timed" ? "timed" : "practice"}
            {drill.limitSec ? ` · ${Math.round(drill.limitSec / 60)} min limit` : ""}
          </p>
        </div>
      </div>
      <div className="resume-actions">
        <Link to={`/drill/${drill.id}`} className="btn btn-secondary btn-sm">
          Resume
          <Icon name="arrow-right" size={14} />
        </Link>
        <button
          type="button"
          className="icon-button"
          onClick={() => deleteDrill(drill.id)}
          aria-label={`Delete ${drill.name}`}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}

export function PracticePage() {
  usePageMeta({
    title: "Practice builder",
    description:
      "Build a diagnostic, daily five, timed sprint, or proof paper from 248 olympiad problems — 208 original and 40 official Australian AMO questions. Timers, flags, and honest marking included.",
    path: "/practice",
  });
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, saveDrill, latest } = useStore();

  const skillParam = params.get("skill");
  const initialSkill = skillParam ? SKILL_BY_SLUG.get(skillParam) : undefined;
  const presetParam = params.get("preset");

  const [domains, setDomains] = useState<Domain[]>(initialSkill ? [initialSkill.domain] : []);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [types, setTypes] = useState<ProblemType[]>([]);
  const [skill, setSkill] = useState(initialSkill?.name ?? "");
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<"practice" | "timed">("practice");
  const [timer, setTimer] = useState(0);
  const [unseenOnly, setUnseenOnly] = useState(false);
  const [weakFirst, setWeakFirst] = useState(false);
  const [balanceDomains, setBalanceDomains] = useState(true);
  const [name, setName] = useState(initialSkill ? `${initialSkill.name} drill` : "");

  const activeDrills = state.drills.filter((drill) => !drill.done);

  const filters: SelectionFilters = useMemo(
    () => ({
      domains,
      skills: skill ? [skill] : [],
      difficulties,
      types,
    }),
    [domains, skill, difficulties, types],
  );

  const pool = useMemo(() => filterPool(filters), [filters]);
  const unseen = useMemo(() => pool.filter((problem) => !latest.has(problem.id)).length, [pool, latest]);
  const actualCount = Math.min(count, pool.length);

  const start = (
    presetFilters: SelectionFilters,
    size: number,
    drillMode: "practice" | "timed",
    minutes: number,
    drillName: string,
  ) => {
    const { problems } = selectProblems(presetFilters, size, state);
    if (problems.length === 0) return;
    const drill = createDrill({
      name: drillName,
      mode: drillMode,
      qids: problems.map((problem) => problem.id),
      limitSec: minutes * 60,
    });
    saveDrill(drill);
    navigate(`/drill/${drill.id}`);
  };

  const startPreset = (preset: Preset) => {
    start(
      {
        domains: [],
        skills: [],
        difficulties: preset.difficulties ?? [],
        types: preset.types,
        unseenOnly: preset.unseenOnly,
        weakFirst: preset.weakFirst,
        balanceDomains: preset.balanceDomains,
      },
      preset.count,
      preset.mode,
      preset.minutes,
      preset.name,
    );
  };

  const startCustom = () => {
    const drillName = name.trim() || (skill ? `${skill} drill` : "Custom drill");
    start({ ...filters, unseenOnly, weakFirst, balanceDomains }, count, mode, timer, drillName);
  };

  const pickPreset = (preset: Preset) => {
    if (presetParam === preset.id) {
      startPreset(preset);
      return;
    }
    startPreset(preset);
  };

  const timerLabel = timer === 0 ? "No limit" : `${timer} min`;
  const filterSummary = [
    domains.length ? domains.join(", ") : "All domains",
    difficulties.length ? difficulties.join(", ") : "All difficulties",
    types.length ? types.map((type) => TYPE_LABEL[type]).join(", ") : "All formats",
    skill || "Any technique",
  ];

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Practice · build a set
          </p>
          <div className="page-hero-row">
            <div>
              <h1>Make the next hour count.</h1>
              <p className="page-lede">
                Pick a preset for a known purpose, or build a set from the full bank. Every drill is one question at a
                time, with the clock and the marking loop built in.
              </p>
            </div>
            <div className="page-hero-stats">
              <div>
                <span>{PROBLEMS.length}</span>
                <small>in the bank</small>
              </div>
              <div>
                <span>{PROOF_PROBLEMS.length}</span>
                <small>proof labs</small>
              </div>
              <div>
                <span>{activeDrills.length}</span>
                <small>in progress</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <SectionHead
            eyebrow="Start with a purpose"
            title="Six ways in."
            text="A drill without a target is just a random walk. Each preset has a different job."
          />
          <div className="preset-grid">
            {PRESETS.map((preset) => (
              <button type="button" key={preset.id} className="preset-card" onClick={() => pickPreset(preset)}>
                <div className="preset-top">
                  <span className="preset-icon">
                    <Icon name={preset.icon} size={19} />
                  </span>
                  <span className="preset-tag">{preset.tag}</span>
                </div>
                <h3>{preset.name}</h3>
                <p>{preset.description}</p>
                <div className="preset-foot">
                  <span>
                    {preset.count} questions · {preset.minutes} min
                  </span>
                  <span className="preset-start">
                    Start
                    <Icon name="arrow-right" size={14} />
                  </span>
                </div>
              </button>
            ))}
          </div>
          {presetParam ? (
            <p className="preset-hint">
              <Icon name="info" size={14} />
              Preset links start a drill immediately. Choose a card above.
            </p>
          ) : null}
        </div>
      </section>

      {activeDrills.length > 0 ? (
        <section className="section section-tight">
          <div className="container">
            <SectionHead eyebrow="Pick up where you stopped" title="Drills in progress" />
            <div className="resume-list">
              {activeDrills.map((drill) => (
                <DrillRow key={drill.id} drill={drill} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section section-builder">
        <div className="container">
          <SectionHead
            eyebrow="Build from the bank"
            title="Your set, your constraints."
            text="Filters apply to the full bank. The counter tells you exactly how many questions are available before you start."
          />
          <div className="builder">
            <div className="builder-form">
              <div className="builder-block">
                <div className="builder-block-head">
                  <h3>Domain</h3>
                  <span>Leave all clear for a mixed set</span>
                </div>
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
                    </button>
                  ))}
                </div>
              </div>

              <div className="builder-block">
                <div className="builder-block-head">
                  <h3>Difficulty</h3>
                  <span>All levels if none selected</span>
                </div>
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
                    </button>
                  ))}
                </div>
              </div>

              <div className="builder-block">
                <div className="builder-block-head">
                  <h3>Format</h3>
                  <span>Proofs are self-assessed</span>
                </div>
                <div className="chip-row">
                  {(["int", "mc", "proof"] as ProblemType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      className={`chip ${types.includes(type) ? "chip-active" : ""}`}
                      aria-pressed={types.includes(type)}
                      onClick={() => setTypes((current) => toggleValue(current, type))}
                    >
                      {TYPE_LABEL[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="builder-block">
                <div className="builder-block-head">
                  <h3>Technique</h3>
                  <span>Optional — one technique at a time</span>
                </div>
                <label className="select-control select-wide">
                  <select
                    value={skill}
                    onChange={(event) => {
                      setSkill(event.target.value);
                      if (event.target.value) setDomains([]);
                    }}
                    aria-label="Choose a technique"
                  >
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
              </div>

              <div className="builder-block">
                <div className="builder-block-head">
                  <h3>Length</h3>
                  <span>{pool.length} problems match</span>
                </div>
                <div className="chip-row">
                  {[5, 10, 15, 20, 25].map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={`chip ${count === size ? "chip-active" : ""}`}
                      aria-pressed={count === size}
                      onClick={() => setCount(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <div className="builder-toggles">
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={unseenOnly}
                      onChange={(event) => setUnseenOnly(event.target.checked)}
                    />
                    <span>
                      <strong>Unseen first</strong>
                      <small>{unseen} unseen in this pool</small>
                    </span>
                  </label>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={weakFirst}
                      onChange={(event) => setWeakFirst(event.target.checked)}
                    />
                    <span>
                      <strong>Weak spots first</strong>
                      <small>Order by your lowest accuracy</small>
                    </span>
                  </label>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={balanceDomains}
                      onChange={(event) => setBalanceDomains(event.target.checked)}
                    />
                    <span>
                      <strong>Balance domains</strong>
                      <small>Alternate across the four domains</small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="builder-block">
                <div className="builder-block-head">
                  <h3>Mode &amp; clock</h3>
                  <span>A timer is optional</span>
                </div>
                <div className="mode-row">
                  <div className="segmented" role="group" aria-label="Drill mode">
                    <button
                      type="button"
                      className={mode === "practice" ? "is-active" : ""}
                      onClick={() => setMode("practice")}
                    >
                      <Icon name="play" size={14} />
                      Practice
                    </button>
                    <button
                      type="button"
                      className={mode === "timed" ? "is-active" : ""}
                      onClick={() => {
                        setMode("timed");
                        if (timer === 0) setTimer(45);
                      }}
                    >
                      <Icon name="clock" size={14} />
                      Timed
                    </button>
                  </div>
                  <label className="select-control">
                    <select value={timer} onChange={(event) => setTimer(Number(event.target.value))} aria-label="Time limit">
                      <option value={0}>No limit</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={180}>180 minutes</option>
                    </select>
                    <Icon name="chevron-down" size={14} />
                  </label>
                </div>
              </div>
            </div>

            <aside className="builder-summary">
              <p className="side-label">Your set</p>
              <div className="summary-count">
                <span>{actualCount}</span>
                <small>questions</small>
              </div>
              {actualCount < count ? (
                <p className="summary-warning">
                  <Icon name="alert" size={14} />
                  Only {actualCount} available with these filters.
                </p>
              ) : null}
              <ul className="summary-list">
                {filterSummary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
                <li>{mode === "timed" ? "Timed" : "Practice"} · {timerLabel}</li>
                {unseenOnly ? <li>Unseen problems first</li> : null}
                {weakFirst ? <li>Weak techniques first</li> : null}
                {balanceDomains ? <li>Balanced across domains</li> : null}
              </ul>
              <label className="summary-name">
                <span>Name this drill</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={skill ? `${skill} drill` : "Custom drill"}
                />
              </label>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={startCustom}
                disabled={pool.length === 0}
              >
                Start {actualCount || ""} question{actualCount === 1 ? "" : "s"}
                <Icon name="arrow-right" size={16} />
              </button>
              <p className="summary-note">
                Selection is random within the filters unless you choose weak-first. Progress saves after every answer.
              </p>
            </aside>
          </div>

          {pool.length === 0 ? (
            <EmptyState
              icon="filter"
              title="That filter combination is empty."
              action={
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setDomains([]);
                    setDifficulties([]);
                    setTypes([]);
                    setSkill("");
                  }}
                >
                  Reset filters
                </button>
              }
            >
              Proof prompts, for example, only exist in Hard and Challenge.
            </EmptyState>
          ) : null}
        </div>
      </section>
    </div>
  );
}
