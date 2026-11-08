import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { PageMeta } from "../components/PageMeta";
import { RichText } from "../components/RichText";
import {
  Bar,
  DifficultyBadge,
  DomainBadge,
  SourceBadge,
} from "../components/ui";
import { QUESTION_BY_ID } from "../data/questions";
import { DIFFICULTIES, DOMAINS, type Drill as DrillRecord } from "../data/types";
import { correctLetter, isCorrect } from "../lib/answer";
import { correctCount, drillStats, isQuestionCorrect, shuffle } from "../lib/drill";
import { formatDuration } from "../lib/format";
import { useStore } from "../store";

interface Row {
  key: string;
  total: number;
  correct: number;
}

function breakdown(drill: DrillRecord, pick: (qid: string) => string | undefined, order?: readonly string[]): Row[] {
  const rows = new Map<string, Row>();
  for (const qid of drill.qids) {
    const key = pick(qid);
    if (key === undefined) continue;
    const row = rows.get(key) ?? { key, total: 0, correct: 0 };
    row.total += 1;
    if (isQuestionCorrect(drill, qid)) row.correct += 1;
    rows.set(key, row);
  }
  const list = [...rows.values()];
  if (order) list.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return list;
}

function BreakdownPanel({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="home-coverage-panel" aria-label={title}>
      <h3>{title}</h3>
      <ul className="home-coverage-list">
        {rows.map((row) => (
          <li className="home-coverage-row" key={row.key}>
            <span className="home-coverage-label">{row.key}</span>
            <span className="home-coverage-meter">
              <Bar
                value={row.correct}
                max={row.total}
                label={`${row.key} accuracy`}
                tone={row.correct === row.total ? "acid" : row.correct === 0 ? "hazard" : "cobalt"}
              />
              <span className="home-coverage-count">{row.correct}/{row.total}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { store, createDrill } = useStore();
  const drill = store.drills.find((entry) => entry.id === id);

  if (!drill) {
    return (
      <section className="page drill-missing">
        <p className="page-eyebrow">Results</p>
        <h1>Results not found</h1>
        <p className="page-lede">
          No drill with the id <code>{id}</code> is saved on this device. Results
          live in your local notebook — start a new drill from the builder.
        </p>
        <Link className="home-button home-button-primary drill-missing-back" to="/practice">
          <Icon name="arrow-left" size={15} />
          Back to practice
        </Link>
      </section>
    );
  }

  if (!drill.done) {
    return (
      <section className="page drill-missing">
        <p className="page-eyebrow">Results</p>
        <h1>Results not ready</h1>
        <p className="page-lede">
          {drill.name} is still in progress. Submit it to lock the answers and
          open the results sheet.
        </p>
        <Link className="home-button home-button-primary drill-missing-back" to={`/drill/${drill.id}`}>
          <Icon name="arrow-left" size={15} />
          Resume drill
        </Link>
      </section>
    );
  }

  const total = drill.qids.length;
  const correct = correctCount(drill);
  const { accuracy } = drillStats(drill);
  const wrongQids = drill.qids.filter((qid) => !isQuestionCorrect(drill, qid));
  const practice = drill.mode === "practice";

  const domainRows = breakdown(drill, (qid) => QUESTION_BY_ID.get(qid)?.domain, DOMAINS);
  const difficultyRows = breakdown(drill, (qid) => QUESTION_BY_ID.get(qid)?.difficulty, DIFFICULTIES);
  const topicRows = breakdown(drill, (qid) => QUESTION_BY_ID.get(qid)?.topic);

  function repair() {
    if (wrongQids.length === 0) return;
    const next = createDrill({ name: "Repair wrong", mode: "practice", qids: wrongQids, limitSec: 0 });
    navigate(`/drill/${next.id}`);
  }

  function retry() {
    const next = createDrill({
      name: drill!.name,
      mode: drill!.mode,
      qids: shuffle(drill!.qids),
      limitSec: drill!.limitSec,
    });
    navigate(`/drill/${next.id}`);
  }

  return (
    <div className="results">
      <PageMeta
        title={`${drill.name} results`}
        description="Drill score, per-domain breakdown, and the items to repair next."
      />
      <header className="drill-head">
        <div className="drill-head-copy">
          <p className="drill-eyebrow">Results · {drill.name}</p>
          <h1>Results</h1>
        </div>
        <div className="results-actions">
          {wrongQids.length > 0 ? (
            <button type="button" className="home-button home-button-primary" onClick={repair}>
              <Icon name="target" size={15} />
              Repair wrong
            </button>
          ) : null}
          <button type="button" className="home-button home-button-secondary" onClick={retry}>
            <Icon name="repeat" size={15} />
            Retry
          </button>
        </div>
      </header>

      <div className="results-score">
        <p className="results-stat">
          <span className="results-stat-value">{correct}/{total}</span>
          <span className="results-stat-label">Score</span>
        </p>
        <p className="results-stat">
          <span className="results-stat-value">{accuracy === null ? "—" : `${accuracy}%`}</span>
          <span className="results-stat-label">Accuracy</span>
        </p>
        <p className="results-stat">
          <span className="results-stat-value">{formatDuration(drill.elapsedSec)}</span>
          <span className="results-stat-label">Time</span>
        </p>
        <p className="results-stat">
          <span className="results-stat-value">{practice ? "Practice" : "Timed"} mode</span>
          <span className="results-stat-label">Mode</span>
        </p>
      </div>

      <div className="results-breakdown">
        <BreakdownPanel title="By domain" rows={domainRows} />
        <BreakdownPanel title="By topic" rows={topicRows} />
        <BreakdownPanel title="By difficulty" rows={difficultyRows} />
      </div>

      <section className="results-review" aria-label="Question review">
        <h2 className="results-review-title">Question review</h2>
        {drill.qids.map((qid, index) => {
          const question = QUESTION_BY_ID.get(qid);
          if (!question) return null;
          const chosen = drill.answers[qid]?.trim() ?? "";
          const right = isCorrect(question, chosen);
          const paragraphs = question.explanation
            .split(/\n{2,}/)
            .map((part) => part.trim())
            .filter(Boolean);
          return (
            <article
              className="results-question"
              data-qid={qid}
              data-verdict={right ? "correct" : "wrong"}
              key={qid}
            >
              <header className="results-question-head">
                <p className="results-question-index">Question {index + 1}</p>
                <Link className="results-question-topic" to={`/q/${qid}`}>{question.topic}</Link>
                <span className="results-verdict" data-verdict={right ? "correct" : "wrong"}>
                  {right ? "Right" : "Wrong"}
                </span>
              </header>
              <div className="question-badges">
                <DomainBadge domain={question.domain} />
                <DifficultyBadge difficulty={question.difficulty} />
                <SourceBadge source={question.source} />
              </div>
              <p className="results-answer">
                <span>Chosen <strong>{chosen || "—"}</strong></span>
                <span className="results-answer-sep" aria-hidden="true">·</span>
                <span>Correct <strong>{correctLetter(question)}</strong></span>
              </p>
              <div className="question-solution">
                {paragraphs.map((paragraph, i) => (
                  <p className="solution-paragraph" key={i}>
                    <RichText text={paragraph} />
                  </p>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <nav className="results-foot">
        <Link className="home-button home-button-secondary" to="/practice">
          <Icon name="arrow-left" size={15} />
          Back to practice
        </Link>
        <Link className="home-button home-button-secondary" to="/progress">
          <Icon name="chart" size={15} />
          View progress
        </Link>
      </nav>
    </div>
  );
}
