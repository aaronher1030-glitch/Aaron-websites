import type { Question } from "../data/types";
import { choiceLetter } from "../lib/answer";
import { RichText } from "./RichText";

export function ChoiceList({ question, value, onChange, checked, strikes = [], onStrike }: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  checked: boolean;
  strikes?: string[];
  onStrike?: (letter: string) => void;
}) {
  return (
    <div className="choice-list" role="radiogroup" aria-label="Answer choices">
      {question.choices.map((choice, index) => {
        const letter = choiceLetter(index);
        const picked = value === letter;
        const right = checked && question.answer === index;
        const wrong = checked && picked && !right;
        const struck = strikes.includes(letter);
        return (
          <div
            key={letter}
            data-letter={letter}
            className={`choice ${picked ? "is-picked" : ""} ${right ? "is-right" : ""} ${wrong ? "is-wrong" : ""} ${struck ? "is-struck" : ""}`.trim()}
          >
            <button
              type="button"
              className="choice-card"
              role="radio"
              aria-checked={picked}
              disabled={checked}
              onClick={() => onChange(letter)}
            >
              <span className="choice-letter">{letter}</span>
              <span className="choice-body"><RichText text={choice} /></span>
            </button>
            <button
              type="button"
              className="choice-strike"
              aria-label={struck ? `Undo ${letter}` : `Eliminate ${letter}`}
              aria-pressed={struck}
              disabled={checked || !onStrike}
              onClick={() => onStrike?.(letter)}
            >
              {struck ? "Undo" : "Eliminate"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
