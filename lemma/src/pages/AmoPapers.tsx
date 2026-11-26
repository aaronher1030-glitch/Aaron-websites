import { Link, useNavigate } from "react-router-dom";
import { AMO_PAPERS, type AmoPaper } from "../data/amoPapers";
import { PROBLEM_BY_ID } from "../data/problems";
import { createDrill } from "../lib/drill";
import { usePageMeta } from "../lib/meta";
import { useStore } from "../store";
import { Icon } from "../components/Icon";
import { DifficultyBadge } from "../components/ui";

type PaperScope = "day1" | "day2" | "full";

const SCOPE_LABEL: Record<PaperScope, string> = {
  day1: "Day 1",
  day2: "Day 2",
  full: "Full paper",
};

export function AmoPapersPage() {
  usePageMeta({
    title: "AMO papers 2016–2020",
    description:
      "Browse and drill all 40 official Australian Mathematical Olympiad questions from 2016–2020, with transcriptions, paper links, Lemma outlines, and rubrics.",
    path: "/amo-papers",
  });
  const navigate = useNavigate();
  const { saveDrill } = useStore();

  const startPaper = (paper: AmoPaper, scope: PaperScope) => {
    const ids =
      scope === "full"
        ? paper.problemIds
        : paper.problemIds.filter((id) => PROBLEM_BY_ID.get(id)?.paper?.day === (scope === "day1" ? 1 : 2));
    if (ids.length === 0) return;
    const drill = createDrill({
      name: `${paper.year} AMO — ${SCOPE_LABEL[scope]}`,
      mode: "timed",
      qids: ids,
      limitSec: (scope === "full" ? 480 : 240) * 60,
    });
    saveDrill(drill);
    navigate(`/drill/${drill.id}`);
  };

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Official papers · 2016–2020
          </p>
          <div className="page-hero-row">
            <div>
              <h1>The real AMO, question by question.</h1>
              <p className="page-lede">
                All 40 questions from the five most recent publicly released Australian Mathematical Olympiad
                papers, transcribed in full. Each has a Lemma key-idea outline, a four-point rubric, and a link to the
                official AMT paper.
              </p>
            </div>
            <div className="page-hero-stats">
              <div>
                <span>5</span>
                <small>papers</small>
              </div>
              <div>
                <span>40</span>
                <small>official problems</small>
              </div>
              <div>
                <span>4 h</span>
                <small>per paper day</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="paper-list">
            {AMO_PAPERS.map((paper) => (
              <article className="paper-card" key={paper.id}>
                <header className="paper-head">
                  <div className="paper-title">
                    <p className="eyebrow">{paper.competition}</p>
                    <h2>{paper.year}</h2>
                    <p className="paper-dates">
                      {paper.day1Date} · {paper.day2Date}
                    </p>
                  </div>
                  <div className="paper-actions">
                    <a className="btn btn-secondary btn-sm" href={paper.url} target="_blank" rel="noreferrer">
                      Official PDF
                      <Icon name="external" size={14} />
                    </a>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => startPaper(paper, "full")}>
                      Full paper
                      <Icon name="play" size={14} />
                    </button>
                  </div>
                </header>

                <div className="paper-days">
                  {([1, 2] as const).map((day) => {
                    const problems = paper.problemIds
                      .map((id) => PROBLEM_BY_ID.get(id))
                      .filter((problem) => problem?.paper?.day === day);
                    return (
                      <div className="paper-day" key={day}>
                        <div className="paper-day-head">
                          <h3>Day {day}</h3>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => startPaper(paper, day === 1 ? "day1" : "day2")}
                          >
                            Drill Day {day}
                            <Icon name="play" size={13} />
                          </button>
                        </div>
                        <ol className="paper-problem-list">
                          {problems.map((problem) =>
                            problem ? (
                              <li key={problem.id}>
                                <Link to={`/problem/${problem.id}`} className="paper-problem">
                                  <span className="paper-problem-num">P{problem.paper?.number}</span>
                                  <span className="paper-problem-main">
                                    <span>{problem.skill}</span>
                                    <small>{problem.domain}</small>
                                  </span>
                                  <DifficultyBadge difficulty={problem.difficulty} />
                                </Link>
                              </li>
                            ) : null,
                          )}
                        </ol>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="paper-note">
            <div>
              <h2>About the official collection</h2>
              <p>
                The question statements are reproduced from the publicly released AMT papers for study and practice.
                Copyright remains with the Australian Mathematics Trust. The outlines and rubrics are Lemma's own and
                are not official marking guides. Always use the linked PDF for the authoritative wording and full
                solutions.
              </p>
            </div>
            <div className="paper-note-actions">
              <a className="btn btn-secondary btn-sm" href="https://amt.edu.au/" target="_blank" rel="noreferrer">
                Australian Maths Trust
                <Icon name="external" size={14} />
              </a>
              <Link className="btn btn-secondary btn-sm" to="/amo-guide">
                AMO family guide
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
