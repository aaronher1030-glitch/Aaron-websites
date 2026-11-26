import type { Drill, Problem, Store } from "../data/types";
import { PROBLEM_BY_ID, isCorrect } from "../data/problems";

export function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function createDrill(input: {
  name: string;
  mode: "practice" | "timed";
  qids: string[];
  limitSec: number;
}): Drill {
  return {
    id: uid(),
    name: input.name,
    mode: input.mode,
    qids: input.qids,
    answers: {},
    checked: {},
    flagged: {},
    grades: {},
    index: 0,
    limitSec: input.limitSec,
    elapsedSec: 0,
    startedAt: Date.now(),
    done: false,
  };
}

export function answeredCount(drill: Drill): number {
  return drill.qids.filter((qid) => {
    const answer = drill.answers[qid];
    const grade = drill.grades?.[qid];
    return (typeof answer === "string" && answer.trim().length > 0) || Boolean(grade);
  }).length;
}

export function isQuestionCorrect(drill: Drill, qid: string): boolean {
  const problem = PROBLEM_BY_ID.get(qid);
  if (!problem) return false;
  if (problem.type === "proof") return drill.grades?.[qid] === "got";
  return isCorrect(problem, drill.answers[qid] ?? "");
}

export function correctCount(drill: Drill): number {
  return drill.qids.filter((qid) => isQuestionCorrect(drill, qid)).length;
}

export function drillStats(drill: Drill) {
  const total = drill.qids.length;
  const answered = answeredCount(drill);
  const correct = correctCount(drill);
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
  return { total, answered, correct, accuracy };
}

export function remainingSeconds(drill: Drill): number {
  if (!drill.limitSec) return 0;
  return Math.max(0, drill.limitSec - drill.elapsedSec);
}

export function latestAttemptMap(store: Store): Map<string, Store["attempts"][number]> {
  const map = new Map<string, Store["attempts"][number]>();
  for (const attempt of store.attempts) {
    const current = map.get(attempt.qid);
    if (!current || attempt.ts >= current.ts) map.set(attempt.qid, attempt);
  }
  return map;
}

export function skillAccuracy(store: Store): Map<string, { attempted: number; correct: number }> {
  const latest = latestAttemptMap(store);
  const map = new Map<string, { attempted: number; correct: number }>();
  for (const [qid, attempt] of latest) {
    const problem = PROBLEM_BY_ID.get(qid);
    if (!problem) continue;
    const row = map.get(problem.skill) ?? { attempted: 0, correct: 0 };
    row.attempted += 1;
    if (attempt.correct) row.correct += 1;
    map.set(problem.skill, row);
  }
  return map;
}

export function dayKey(ts: number): string {
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function streakDays(store: Store): number {
  const days = new Set(store.attempts.map((a) => dayKey(a.ts)));
  if (days.size === 0) return 0;
  const cursor = new Date();
  let streak = 0;
  const today = dayKey(cursor.getTime());
  if (!days.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor.getTime()))) return 0;
  }
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function problemTypeLabel(problem: Problem): string {
  if (problem.type === "proof") return "Proof";
  if (problem.type === "mc") return "Multiple choice";
  return "Short answer";
}
