import type { Question, Store } from "../data/types";
import { isCorrect } from "./answer";

export interface FilterState {
  q: string;
  domain: string;
  chapter: string;
  topic: string;
  difficulty: string;
  source: string;
  status: "all" | "unseen" | "wrong" | "flagged";
}

export function filterQuestions(bank: Question[], filters: FilterState, store: Store) {
  const latest = new Map<string, boolean>();
  for (const a of store.attempts) latest.set(a.qid, a.correct);
  const needle = filters.q.trim().toLowerCase();
  const items = bank.filter((q) => {
    if (filters.domain && q.domain !== filters.domain) return false;
    if (filters.chapter && String(q.chapter ?? "") !== filters.chapter) return false;
    if (filters.topic && q.topic !== filters.topic) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    if (filters.source && q.source !== filters.source) return false;
    if (filters.status === "unseen" && latest.has(q.id)) return false;
    if (filters.status === "wrong" && latest.get(q.id) !== false) return false;
    if (filters.status === "flagged" && !store.stashed.includes(q.id)) return false;
    if (needle) {
      const hay = `${q.stem} ${q.topic} ${q.explanation}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  return { items, total: items.length };
}

export function isAnswerCorrect(q: Question, answer: string) {
  return isCorrect(q, answer);
}
