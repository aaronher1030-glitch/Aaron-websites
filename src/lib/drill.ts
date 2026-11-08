import type { Attempt, Drill, Question, ReviewItem } from "../data/types";
import { DOMAINS } from "../data/types";
import { QUESTION_BY_ID, questionsForPaper } from "../data/questions";
import { isCorrect } from "./answer";

export function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function createDrill(input: { name: string; mode: "practice" | "timed"; qids: string[]; limitSec: number }): Drill {
  return { id: uid(), name: input.name, mode: input.mode, qids: input.qids, answers: {}, checked: {}, flagged: {}, strikes: {}, index: 0, limitSec: input.limitSec, elapsedSec: 0, startedAt: Date.now(), done: false };
}

export function answeredCount(drill: Drill): number {
  return drill.qids.filter((id) => Boolean(drill.answers[id]?.trim())).length;
}

export function isQuestionCorrect(drill: Drill, id: string): boolean {
  const q = QUESTION_BY_ID.get(id);
  return q ? isCorrect(q, drill.answers[id] ?? "") : false;
}

export function correctCount(drill: Drill): number {
  return drill.qids.filter((id) => isQuestionCorrect(drill, id)).length;
}

export function drillStats(drill: Drill) {
  const answered = answeredCount(drill);
  const correct = correctCount(drill);
  return { total: drill.qids.length, answered, correct, accuracy: answered ? Math.round((correct / answered) * 100) : null };
}

export function remainingSeconds(drill: Drill): number {
  return drill.limitSec ? Math.max(0, drill.limitSec - drill.elapsedSec) : 0;
}

/* Attempts are chronological, so the last append per question is the latest
   result — regardless of the ts values the caller stamped. */
export function latestAttemptMap(attempts: Attempt[]): Map<string, Attempt> {
  const latest = new Map<string, Attempt>();
  for (const attempt of attempts) latest.set(attempt.qid, attempt);
  return latest;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function diagnosticQids(bank: Question[]): string[] {
  const picked: string[] = [];
  for (const domain of DOMAINS) {
    const pool = shuffle(bank.filter((q) => q.domain === domain));
    picked.push(...pool.slice(0, 4).map((q) => q.id));
  }
  return shuffle(picked);
}

/* A topic is weak when at least two of its questions have been attempted and
   the latest-attempt accuracy across those questions is strictly under 60%. */
export function weakTopicNames(attempts: Attempt[]): Set<string> {
  const byTopic = new Map<string, { total: number; correct: number }>();
  for (const [qid, attempt] of latestAttemptMap(attempts)) {
    const q = QUESTION_BY_ID.get(qid);
    if (!q) continue;
    const acc = byTopic.get(q.topic) ?? { total: 0, correct: 0 };
    acc.total += 1;
    if (attempt.correct) acc.correct += 1;
    byTopic.set(q.topic, acc);
  }
  const weak = new Set<string>();
  for (const [topic, { total, correct }] of byTopic) {
    if (total >= 2 && correct / total < 0.6) weak.add(topic);
  }
  return weak;
}

export function weakQids(bank: Question[], attempts: Attempt[]): string[] {
  const weak = weakTopicNames(attempts);
  return bank.filter((q) => weak.has(q.topic)).map((q) => q.id);
}

export function dailyQids(bank: Question[], attempts: Attempt[]): string[] {
  const latest = latestAttemptMap(attempts);
  const weak = weakTopicNames(attempts);
  const unseen = bank.filter((q) => !latest.has(q.id));
  const weakItems = bank.filter((q) => latest.has(q.id) && weak.has(q.topic));
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const pool of [shuffle(unseen), shuffle(weakItems), shuffle(bank)]) {
    for (const q of pool) {
      if (picked.length >= 10) return picked;
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      picked.push(q.id);
    }
  }
  return picked;
}

export function dueQids(review: ReviewItem[], now: number): string[] {
  return review
    .filter((item) => item.dueAt <= now && QUESTION_BY_ID.has(item.qid))
    .sort((a, b) => a.dueAt - b.dueAt)
    .map((item) => item.qid);
}

export function paperQids(paper: string): string[] {
  return questionsForPaper(paper).map((q) => q.id);
}

export function randomQids(bank: Question[], count: number): string[] {
  return shuffle(bank).slice(0, count).map((q) => q.id);
}