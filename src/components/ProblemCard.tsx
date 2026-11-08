import { Link } from "react-router-dom";
import type { Problem } from "../data/types";
import { RichText } from "./Tex";
import { DifficultyBadge, DomainBadge, TypeBadge } from "./ui";
import { Icon } from "./Icon";

export function ProblemCard({ problem, index }: { problem: Problem; index?: number }) {
  const official = problem.collection === "official";
  return (
    <Link to={`/problem/${problem.id}`} className="problem-card">
      <div className="pc-top">
        <div className="pc-badges">
          <DomainBadge domain={problem.domain} />
          {official ? <span className="official-badge">Official</span> : null}
        </div>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>
      <p className="pc-stem">
        <RichText text={problem.stem} />
      </p>
      <div className="pc-foot">
        <span className="pc-skill">
          {typeof index === "number" ? <span className="pc-index">{String(index).padStart(2, "0")}</span> : null}
          {official && problem.paper ? `${problem.paper.year} AMO · P${problem.paper.number}` : problem.skill}
        </span>
        <span className="pc-tail">
          <TypeBadge type={problem.type} />
          <Icon name="arrow-up-right" size={15} />
        </span>
      </div>
    </Link>
  );
}
