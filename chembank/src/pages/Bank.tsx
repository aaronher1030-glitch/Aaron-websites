import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import { QuestionCard } from "../components/QuestionCard";
import { QUESTIONS, QUESTION_COUNT } from "../data/questions";
import { TOPICS } from "../data/topics";
import { DIFFICULTIES, DOMAINS, SOURCES, type SourceKind } from "../data/types";
import { filterQuestions, type FilterState } from "../lib/select";
import { useStore } from "../store";

const CHAPTERS = ["1", "2", "3", "4", "5", "6", "7"] as const;
const TOPIC_OPTIONS = TOPICS.map((topic) => topic.name);

/* The bank holds 430 rich-text cards; rendering them all at once stalls the
   first paint. Reveal a page at a time and reset to the first page whenever
   the filters change. */
const PAGE_SIZE = 60;

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

function oneOf(value: string | null, allowed: readonly string[]): string {
  return value && allowed.includes(value) ? value : "";
}

/* Sanitize incoming URL values (deep links, back/forward) so a hand-typed or
   stale link never strands the selects on a blank option; unknown values fall
   back to "all". */
function readFilters(params: URLSearchParams): FilterState {
  const status = params.get("status");
  return {
    q: params.get("q") ?? "",
    domain: oneOf(params.get("domain"), DOMAINS),
    chapter: oneOf(params.get("chapter"), CHAPTERS),
    topic: oneOf(params.get("topic"), TOPIC_OPTIONS),
    difficulty: oneOf(params.get("difficulty"), DIFFICULTIES),
    source: oneOf(params.get("source"), SOURCES),
    status:
      status === "unseen" || status === "wrong" || status === "flagged"
        ? status
        : "all",
  };
}

export default function Bank() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { store } = useStore();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  /* Local state is the live authority. The router commits search params inside
     a transition, so deriving writes from the committed URL races fast typing
     and select changes: a write can spread a stale q (or miss a pending select)
     and supersede the newer value. Handlers update this state urgently and
     mirror it to the URL; only genuine external URL changes (back/forward, deep
     links, reset) sync back. Echoes of our own writes are matched by their full
     serialized params so an external change is never swallowed. */
  const [filters, setFilters] = useState<FilterState>(() => readFilters(searchParams));
  const pendingWrites = useRef<Set<string>>(new Set());

  useEffect(() => {
    const committed = searchParams.toString();
    if (pendingWrites.current.has(committed)) {
      pendingWrites.current.delete(committed);
      return;
    }
    pendingWrites.current.clear();
    setFilters(readFilters(searchParams));
    setVisibleCount(PAGE_SIZE);
  }, [searchParams]);

  const { items, total } = filterQuestions(QUESTIONS, filters, store);
  const stashed = new Set(store.stashed);
  const visible = items.slice(0, visibleCount);
  const remaining = total - visible.length;

  const activeCount = [
    filters.q,
    filters.domain,
    filters.chapter,
    filters.topic,
    filters.difficulty,
    filters.source,
    filters.status !== "all" ? filters.status : "",
  ].filter(Boolean).length;

  function writeFilters(next: FilterState) {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.domain) params.set("domain", next.domain);
    if (next.chapter) params.set("chapter", next.chapter);
    if (next.topic) params.set("topic", next.topic);
    if (next.difficulty) params.set("difficulty", next.difficulty);
    if (next.source) params.set("source", next.source);
    if (next.status !== "all") params.set("status", next.status);
    const serialized = params.toString();
    // Only track an echo when the URL will actually change; a no-op write
    // leaves no commit to suppress and must not strand a stale pending entry.
    if (serialized !== searchParams.toString()) pendingWrites.current.add(serialized);
    // Replace so a keystroke in search does not pile up history entries.
    setSearchParams(params, { replace: true });
  }

  function reset() {
    writeFilters({
      q: "",
      domain: "",
      chapter: "",
      topic: "",
      difficulty: "",
      source: "",
      status: "all",
    });
  }

  return (
    <div className="bank">
      <PageMeta
        title="Question bank"
        description="Filter 430 blind-verified chemistry questions by domain, chapter, topic, difficulty, source, and your own attempt history."
        path="/bank"
      />
      <header className="bank-head">
        <p className="bank-eyebrow">The bank</p>
        <h1>Question bank</h1>
        <p className="bank-lede">
          All {QUESTION_COUNT} blind-verified items. Filter by domain, chapter,
          topic, difficulty, source, or your own history, then open any card to
          work it with a full solution.
        </p>
      </header>

      <div className="bank-search">
        <Icon name="search" size={18} />
        <input
          id="bank-search"
          type="search"
          aria-label="Search questions"
          placeholder="Search stems, topics, and explanations…"
          value={filters.q}
          onChange={(event) => writeFilters({ ...filters, q: event.target.value })}
        />
      </div>

      <button
        type="button"
        className="home-button home-button-secondary bank-filters-toggle"
        aria-expanded={filtersOpen}
        aria-controls="bank-filters"
        onClick={() => setFiltersOpen((open) => !open)}
      >
        <Icon name="chart" size={15} />
        Filters
        {activeCount > 0 ? (
          <span className="bank-filters-badge">{activeCount}</span>
        ) : null}
      </button>

      <div className="bank-layout">
        <aside
          id="bank-filters"
          className="bank-rail"
          data-open={filtersOpen}
          aria-label="Question filters"
        >
          <p className="bank-rail-title">Refine</p>

          <div className="bank-field">
            <label htmlFor="bank-domain">Domain</label>
            <select
              id="bank-domain"
              value={filters.domain}
              onChange={(event) => writeFilters({ ...filters, domain: event.target.value })}
            >
              <option value="">All domains</option>
              {DOMAINS.map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          <div className="bank-field">
            <label htmlFor="bank-chapter">Chapter</label>
            <select
              id="bank-chapter"
              value={filters.chapter}
              onChange={(event) => writeFilters({ ...filters, chapter: event.target.value })}
            >
              <option value="">All chapters</option>
              {CHAPTERS.map((chapter) => (
                <option key={chapter} value={chapter}>Chapter {chapter}</option>
              ))}
            </select>
          </div>

          <div className="bank-field">
            <label htmlFor="bank-topic">Topic</label>
            <select
              id="bank-topic"
              value={filters.topic}
              onChange={(event) => writeFilters({ ...filters, topic: event.target.value })}
            >
              <option value="">All topics</option>
              {TOPIC_OPTIONS.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div className="bank-field">
            <label htmlFor="bank-difficulty">Difficulty</label>
            <select
              id="bank-difficulty"
              value={filters.difficulty}
              onChange={(event) => writeFilters({ ...filters, difficulty: event.target.value })}
            >
              <option value="">All levels</option>
              {DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>

          <div className="bank-field">
            <label htmlFor="bank-source">Source</label>
            <select
              id="bank-source"
              value={filters.source}
              onChange={(event) => writeFilters({ ...filters, source: event.target.value })}
            >
              <option value="">All sources</option>
              {SOURCES.map((source) => (
                <option key={source} value={source}>{SOURCE_LABEL[source]}</option>
              ))}
            </select>
          </div>

          <div className="bank-field">
            <label htmlFor="bank-status">Status</label>
            <select
              id="bank-status"
              value={filters.status}
              onChange={(event) =>
                writeFilters({ ...filters, status: event.target.value as FilterState["status"] })
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </aside>

        <section className="bank-results" aria-label="Filtered questions">
          <div className="bank-results-head">
            <p className="bank-count" role="status">
              Showing {total} of {QUESTION_COUNT}
            </p>
            <button
              type="button"
              className="home-button home-button-secondary bank-reset"
              onClick={reset}
              disabled={activeCount === 0}
            >
              <Icon name="close" size={14} />
              Reset
            </button>
          </div>

          {items.length > 0 ? (
            <>
              <div className="bank-list">
                {visible.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    stashed={stashed.has(question.id)}
                  />
                ))}
              </div>
              {remaining > 0 ? (
                <button
                  type="button"
                  className="home-button home-button-secondary bank-more"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  <Icon name="repeat" size={15} />
                  Show more
                  <span className="bank-more-count">{remaining} left</span>
                </button>
              ) : null}
            </>
          ) : (
            <div className="bank-empty">
              <p className="bank-empty-title">No questions match these filters.</p>
              <p className="bank-empty-copy">
                Try a broader search, or reset the filters to see all{" "}
                {QUESTION_COUNT} items.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
