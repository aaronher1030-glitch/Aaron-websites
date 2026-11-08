import type { Drill } from "../data/types";

export function QuestionMap({ drill, onJump }: {
  drill: Drill;
  onJump: (index: number) => void;
}) {
  return (
    <div className="question-map" role="group" aria-label="Question map">
      {drill.qids.map((qid, index) => {
        const answered = Boolean(drill.answers[qid]?.trim());
        const flagged = Boolean(drill.flagged[qid]);
        const current = index === drill.index;
        const label = `Question ${index + 1}${answered ? ", answered" : ""}${flagged ? ", flagged" : ""}`;
        return (
          <button
            key={`${qid}-${index}`}
            type="button"
            className="question-map-cell"
            data-answered={answered}
            data-flagged={flagged}
            data-current={current}
            aria-current={current ? "true" : undefined}
            aria-label={label}
            onClick={() => onJump(index)}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}