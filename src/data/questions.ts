import raw from "./questions.json";
import type { Domain, Question } from "./types";

export const QUESTIONS = raw as Question[];
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export const DOMAIN_COUNTS = QUESTIONS.reduce<Record<Domain, number>>(
  (acc, q) => {
    acc[q.domain] += 1;
    return acc;
  },
  { General: 0, Physical: 0, Analytical: 0, Organic: 0, Laboratory: 0 },
);

export const QUESTION_COUNT = QUESTIONS.length;

export function questionsForPaper(paper: string) {
  return QUESTIONS.filter((q) => q.paper === paper);
}
