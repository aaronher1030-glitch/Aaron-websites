import { memo } from "react";
import { Link } from "react-router-dom";
import type { Question } from "../data/types";
import { Icon } from "./Icon";
import { RichText } from "./RichText";
import { DifficultyBadge, DomainBadge } from "./ui";

/* Memoized so typing in the bank search only re-renders the cards that
   actually enter or leave the result set, not all 430. */
export const QuestionCard = memo(function QuestionCard({
  question,
  stashed,
}: {
  question: Question;
  stashed: boolean;
}) {
  return (
    <article className="question-card" data-domain={question.domain.toLowerCase()}>
      <div className="question-card-top">
        <span className="question-card-id">{question.id}</span>
        {stashed ? (
          <span className="question-card-stash">
            <Icon name="flag" size={12} />
            Stashed
          </span>
        ) : null}
      </div>
      <div className="question-card-badges">
        <DomainBadge domain={question.domain} />
        <DifficultyBadge difficulty={question.difficulty} />
      </div>
      <div className="question-card-stem">
        <RichText text={question.stem} />
      </div>
      <div className="question-card-foot">
        <span className="question-card-topic">{question.topic}</span>
        <Link
          className="question-card-open"
          to={`/q/${question.id}`}
          aria-label={`Open ${question.id}`}
        >
          Open
          <Icon name="chevron-right" size={14} />
        </Link>
      </div>
    </article>
  );
});
