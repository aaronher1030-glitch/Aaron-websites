import { QUESTION_BY_ID } from "../data/questions";
import { TOPICS } from "../data/topics";
import { DOMAINS, type Attempt, type Question } from "../data/types";
import { latestAttemptMap } from "./drill";

export interface GroupStat {
  key: string;
  attempted: number;
  correct: number;
  accuracy: number | null;
}

const CHAPTER_KEYS = ["1", "2", "3", "4", "5", "6", "7"];

/* Every group is enumerated up front so an unattempted domain/chapter/topic
   still reports attempted 0 with a null accuracy rather than vanishing. */
function tally(
  attempts: Attempt[],
  keys: readonly string[],
  pick: (question: Question) => string | undefined,
): GroupStat[] {
  const counts = new Map<string, { attempted: number; correct: number }>();
  for (const key of keys) counts.set(key, { attempted: 0, correct: 0 });
  for (const [qid, attempt] of latestAttemptMap(attempts)) {
    const question = QUESTION_BY_ID.get(qid);
    if (!question) continue;
    const key = pick(question);
    if (key === undefined) continue;
    const count = counts.get(key);
    if (!count) continue;
    count.attempted += 1;
    if (attempt.correct) count.correct += 1;
  }
  return keys.map((key) => {
    const { attempted, correct } = counts.get(key)!;
    return {
      key,
      attempted,
      correct,
      accuracy: attempted === 0 ? null : Math.round((correct / attempted) * 100),
    };
  });
}

export function statsByDomain(attempts: Attempt[]): GroupStat[] {
  return tally(attempts, DOMAINS, (question) => question.domain);
}

export function statsByChapter(attempts: Attempt[]): GroupStat[] {
  return tally(attempts, CHAPTER_KEYS, (question) =>
    question.chapter === undefined ? undefined : String(question.chapter),
  );
}

export function statsByTopic(attempts: Attempt[]): GroupStat[] {
  return tally(
    attempts,
    TOPICS.map((topic) => topic.name),
    (question) => question.topic,
  );
}

function dayKey(ts: number): string {
  const date = new Date(ts);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/* Consecutive attempt-days ending today, or yesterday when today is still
   blank. setDate arithmetic keeps the walk correct across DST boundaries. */
export function streakDays(attempts: Attempt[], now = Date.now()): number {
  const days = new Set(attempts.map((attempt) => dayKey(attempt.ts)));
  if (days.size === 0) return 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor.getTime()))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}