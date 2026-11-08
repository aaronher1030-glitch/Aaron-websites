import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import { QUESTIONS } from "../data/questions";
import { TOPICS } from "../data/topics";
import { DIFFICULTIES, DOMAINS, SOURCES, type SourceKind } from "../data/types";
import {
  dailyQids,
  diagnosticQids,
  dueQids,
  paperQids,
  randomQids,
  weakQids,
} from "../lib/drill";
import { formatDuration } from "../lib/format";
import { filterQuestions, type FilterState } from "../lib/select";
import { useStore } from "../store";

const PRESETS = [
  { id: "diagnostic-20", name: "Diagnostic 20", icon: "target", copy: "Four random items from each of the five domains." },
  { id: "daily-10", name: "Daily 10", icon: "repeat", copy: "Unseen items first, then weak topics, filled to ten." },
  { id: "chapter", name: "Chapter drill", icon: "book", copy: "Every item from one selected chapter." },
  { id: "lab", name: "Lab drill", icon: "flask", copy: "The full Laboratory domain." },
  { id: "paper", name: "Full paper", icon: "book", copy: "A complete supplied paper, item for item." },
  { id: "weak", name: "Weak spots", icon: "chart", copy: "Topics under 60% accuracy with at least two attempted items." },
  { id: "due", name: "Due review", icon: "timer", copy: "The spaced-review queue, oldest due first." },
  { id: "random-10", name: "Random 10", icon: "repeat", copy: "Ten items shuffled from the whole bank." },
  { id: "custom", name: "Custom", icon: "search", copy: "Your own filters across the whole bank." },
] as const satisfies readonly { id: string; name: string; icon: IconName; copy: string }[];

type PresetId = (typeof PRESETS)[number]["id"];

const PRESET_IDS = PRESETS.map((preset) => preset.id);

const PAPERS = [
  { id: "ch1-3-theory", title: "Chapters 1–3 Theory" },
  { id: "ch1-3-lab", title: "Chapters 1–3 Lab" },
  { id: "ch4-7-theory", title: "Chapters 4–7 Theory" },
  { id: "ch4-7-lab", title: "Chapters 4–7 Lab" },
] as const;

const PAPER_IDS = PAPERS.map((paper) => paper.id);
const CHAPTERS = ["1", "2", "3", "4", "5", "6", "7"] as const;
const TOPIC_OPTIONS = TOPICS.map((topic) => topic.name);

/* Simulation pacing, not official PNCO timing: 90 seconds per item. */
const SECONDS_PER_ITEM = 90;

const SOURCE_LABEL: Record<SourceKind, string> = {
  "supplied-paper": "Supplied paper",
  textbook: "Textbook",
  mixed: "Merged source",
  "gap-fill": "Gap fill",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "unseen", label: "Unseen" },
  { value: "wrong", label: "Wrong last attempt" },
  { value: "flagged", label: "Stashed" },
] as const;

const EMPTY_FILTERS: FilterState = {
  q: "",
  domain: "",
  chapter: "",
  topic: "",
  difficulty: "",
  source: "",
  status: "all",
};

interface BuilderState {
  preset: PresetId;
  paper: string;
  chapter: string;
}

function oneOf(value: string | null, allowed: readonly string[], fallback: string): string {
  return value && allowed.includes(value) ? value : fallback;
}

/* Sanitize deep links (Home CTAs, shared URLs) so a stale or hand-typed param
   never strands the builder on an unknown preset. */
function readBuilder(params: URLSearchParams): BuilderState {
  return {
    preset: oneOf(params.get("preset"), PRESET_IDS, "diagnostic-20") as PresetId,
    paper: oneOf(params.get("paper"), PAPER_IDS, "ch1-3-theory"),
    chapter: oneOf(params.get("chapter"), CHAPTERS, "1"),
  };
}

export default function Practice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store, createDrill } = useStore();
  const [mode, setMode] = useState<"practice" | "timed">("practice");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  /* Same echo guard as the Bank: local state is the live authority while the
     router commits search params inside a transition; only genuine external
     URL changes sync back. */
  const [builder, setBuilder] = useState<BuilderState>(() => readBuilder(searchParams));
  const pendingWrites = useRef<Set<string>>(new Set());

  useEffect(() => {
    const committed = searchParams.toString();
    if (pendingWrites.current.has(committed)) {
      pendingWrites.current.delete(committed);
      return;
    }
    pendingWrites.current.clear();
    setBuilder(readBuilder(searchParams));
  }, [searchParams]);

  function writeBuilder(next: BuilderState) {
    setBuilder(next);
    const params = new URLSearchParams();
    params.set("preset", next.preset);
    if (next.preset === "paper") params.set("paper", next.paper);
    if (next.preset === "chapter") params.set("chapter", next.chapter);
    const serialized = params.toString();
    // Only track an echo when the URL will actually change.
    if (serialized !== searchParams.toString()) pendingWrites.current.add(serialized);
    setSearchParams(params, { replace: true });
  }

  /* Mode is deliberately not a dependency: toggling practice/timed must not
     reshuffle a random preset out from under the live count. */
  const qids = useMemo(() => {
    switch (builder.preset) {
      case "diagnostic-20":
        return diagnosticQids(QUESTIONS);
      case "daily-10":
        return dailyQids(QUESTIONS, store.attempts);
      case "chapter":
        return filterQuestions(QUESTIONS, { ...EMPTY_FILTERS, chapter: builder.chapter }, store).items.map((q) => q.id);
      case "lab":
        return filterQuestions(QUESTIONS, { ...EMPTY_FILTERS, domain: "Laboratory" }, store).items.map((q) => q.id);
      case "paper":
        return paperQids(builder.paper);
      case "weak":
        return weakQids(QUESTIONS, store.attempts);
      case "due":
        return dueQids(store.review, Date.now());
      case "random-10":
        return randomQids(QUESTIONS, 10);
      case "custom":
        return filterQuestions(QUESTIONS, filters, store).items.map((q) => q.id);
    }
  }, [builder, filters, store]);

  const count = qids.length;
  const limitSec = mode === "timed" ? count * SECONDS_PER_ITEM : 0;
  const preset = PRESETS.find((entry) => entry.id === builder.preset);
  const drillName =
    builder.preset === "chapter"
      ? `Chapter ${builder.chapter} drill`
      : builder.preset === "paper"
        ? (PAPERS.find((entry) => entry.id === builder.paper)?.title ?? "Full paper")
        : builder.preset === "custom"
          ? "Custom drill"
          : (preset?.name ?? "Drill");

  const emptyNote =
    builder.preset === "weak"
      ? "No weak topics yet. A topic appears here once you have attempted at least two of its questions and your latest-attempt accuracy is under 60%."
      : builder.preset === "due"
        ? "Nothing is due yet. The spaced-review queue fills as the review loop schedules missed items; until then this preset stays empty."
        : "No questions match these filters. Broaden the search or relax a filter to rebuild the pool.";

  function start() {
    if (count === 0) return;
    const drill = createDrill({ name: drillName, mode, qids, limitSec });
    navigate(`/drill/${drill.id}`);
  }

  return (
    <div className="practice">
      <PageMeta
        title="Practice builder"
        description="Build an untimed or timed chemistry drill by chapter, lab domain, paper, weak topic, or your own filters."
        path="/practice"
      />
      <header className="practice-head">
        <p className="practice-eyebrow">Practice</p>
        <h1>Build a drill</h1>
        <p className="practice-lede">
          Pick a preset or shape your own pool, choose practice or timed mode,
          and start. Every drill saves to this device as you play — close the
          tab and resume where you left off.
        </p>
      </header>

      <div className="practice-presets" role="group" aria-label="Presets">
        {PRESETS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="practice-preset"
            aria-pressed={builder.preset === entry.id}
            onClick={() => writeBuilder({ ...builder, preset: entry.id })}
          >
            <Icon name={entry.icon} size={18} />
            <span className="practice-preset-name">{entry.name}</span>
            <span className="practice-preset-copy">{entry.copy}</span>
          </button>
        ))}
      </div>

      {builder.preset === "chapter" ? (
        <div className="bank-field practice-option">
          <label htmlFor="practice-chapter">Chapter</label>
          <select
            id="practice-chapter"
            value={builder.chapter}
            onChange={(event) => writeBuilder({ ...builder, chapter: event.target.value })}
          >
            {CHAPTERS.map((chapter) => (
              <option key={chapter} value={chapter}>Chapter {chapter}</option>
            ))}
          </select>
        </div>
      ) : null}

      {builder.preset === "paper" ? (
        <div className="bank-field practice-option">
          <label htmlFor="practice-paper">Paper</label>
          <select
            id="practice-paper"
            value={builder.paper}
            onChange={(event) => writeBuilder({ ...builder, paper: event.target.value })}
          >
            {PAPERS.map((paper) => (
              <option key={paper.id} value={paper.id}>{paper.title}</option>
            ))}
          </select>
        </div>
      ) : null}

      {builder.preset === "custom" ? (
        <div className="practice-custom">
          <div className="bank-search">
            <Icon name="search" size={18} />
            <input
              id="practice-search"
              type="search"
              aria-label="Search questions"
              placeholder="Search stems, topics, and explanations…"
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />
          </div>
          <div className="practice-custom-fields">
            <div className="bank-field">
              <label htmlFor="practice-domain">Domain</label>
              <select
                id="practice-domain"
                value={filters.domain}
                onChange={(event) => setFilters({ ...filters, domain: event.target.value })}
              >
                <option value="">All domains</option>
                {DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            <div className="bank-field">
              <label htmlFor="practice-chapter-filter">Chapter</label>
              <select
                id="practice-chapter-filter"
                value={filters.chapter}
                onChange={(event) => setFilters({ ...filters, chapter: event.target.value })}
              >
                <option value="">All chapters</option>
                {CHAPTERS.map((chapter) => (
                  <option key={chapter} value={chapter}>Chapter {chapter}</option>
                ))}
              </select>
            </div>
            <div className="bank-field">
              <label htmlFor="practice-topic">Topic</label>
              <select
                id="practice-topic"
                value={filters.topic}
                onChange={(event) => setFilters({ ...filters, topic: event.target.value })}
              >
                <option value="">All topics</option>
                {TOPIC_OPTIONS.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            <div className="bank-field">
              <label htmlFor="practice-difficulty">Difficulty</label>
              <select
                id="practice-difficulty"
                value={filters.difficulty}
                onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}
              >
                <option value="">All levels</option>
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
            <div className="bank-field">
              <label htmlFor="practice-source">Source</label>
              <select
                id="practice-source"
                value={filters.source}
                onChange={(event) => setFilters({ ...filters, source: event.target.value })}
              >
                <option value="">All sources</option>
                {SOURCES.map((source) => (
                  <option key={source} value={source}>{SOURCE_LABEL[source]}</option>
                ))}
              </select>
            </div>
            <div className="bank-field">
              <label htmlFor="practice-status">Status</label>
              <select
                id="practice-status"
                value={filters.status}
                onChange={(event) =>
                  setFilters({ ...filters, status: event.target.value as FilterState["status"] })
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : null}

      <div className="practice-modes" role="group" aria-label="Drill mode">
        <button
          type="button"
          className="home-button home-button-secondary practice-mode"
          aria-pressed={mode === "practice"}
          onClick={() => setMode("practice")}
        >
          <Icon name="check" size={15} />
          Practice
        </button>
        <button
          type="button"
          className="home-button home-button-secondary practice-mode"
          aria-pressed={mode === "timed"}
          onClick={() => setMode("timed")}
        >
          <Icon name="timer" size={15} />
          Timed
        </button>
      </div>

      <section className="practice-summary" aria-label="Drill summary">
        <p className="practice-count" role="status">
          {count === 1 ? "1 question matches" : `${count} questions match`}
        </p>
        {count === 0 ? <p className="practice-empty">{emptyNote}</p> : null}
        {count > 0 ? (
          <p className="practice-limit">
            {mode === "timed"
              ? `${formatDuration(limitSec)} on the clock — 90 seconds per item. Simulation timing, not official PNCO time.`
              : "Untimed, with instant feedback after every check."}
          </p>
        ) : null}
        <button
          type="button"
          className="home-button home-button-primary practice-start"
          disabled={count === 0}
          onClick={start}
        >
          <Icon name="target" size={15} />
          Start drill
        </button>
      </section>
    </div>
  );
}