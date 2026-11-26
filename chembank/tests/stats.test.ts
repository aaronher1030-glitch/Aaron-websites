import { expect, test } from "vitest";
import { QUESTIONS } from "../src/data/questions";
import type { Attempt } from "../src/data/types";
import {
  statsByChapter,
  statsByDomain,
  statsByTopic,
  streakDays,
} from "../src/lib/stats";

function attempt(qid: string, correct: boolean, ts = 1): Attempt {
  return { qid, correct, answer: correct ? "A" : "B", ts, elapsedSec: 1, mode: "single" };
}

test("statsByDomain tallies latest attempts and leaves unattempted domains null", () => {
  const general = QUESTIONS.filter((q) => q.domain === "General");
  const physical = QUESTIONS.find((q) => q.domain === "Physical")!;
  const stats = statsByDomain([
    attempt(general[0].id, true),
    attempt(general[1].id, true),
    attempt(physical.id, false),
  ]);
  const byKey = new Map(stats.map((entry) => [entry.key, entry]));
  expect(byKey.get("General")).toEqual({ key: "General", attempted: 2, correct: 2, accuracy: 100 });
  expect(byKey.get("Physical")).toEqual({ key: "Physical", attempted: 1, correct: 0, accuracy: 0 });
  expect(byKey.get("Organic")).toEqual({ key: "Organic", attempted: 0, correct: 0, accuracy: null });
  expect(stats).toHaveLength(5);
});

test("statsByTopic uses the latest attempt per question", () => {
  const kinetics = QUESTIONS.filter((q) => q.topic === "Kinetics");
  const stats = statsByTopic([
    attempt(kinetics[0].id, false),
    attempt(kinetics[0].id, true),
    attempt(kinetics[1].id, false),
  ]);
  const entry = stats.find((row) => row.key === "Kinetics")!;
  expect(entry).toEqual({ key: "Kinetics", attempted: 2, correct: 1, accuracy: 50 });
});

test("statsByChapter enumerates chapters and skips questions without one", () => {
  const ch1 = QUESTIONS.find((q) => q.chapter === 1)!;
  const stats = statsByChapter([attempt(ch1.id, true)]);
  expect(stats.map((row) => row.key)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  const entry = stats.find((row) => row.key === "1")!;
  expect(entry.attempted).toBeGreaterThanOrEqual(1);
  expect(entry.accuracy).toBe(100);
  expect(stats.find((row) => row.key === "7")!.accuracy).toBeNull();
});

/* Streaks are built from local-noon offsets so the assertions hold in any
   runner timezone: both the attempts and the streak cursor read local days. */
const NOW = new Date(2026, 10, 7, 15, 0, 0).getTime();
function day(offset: number): number {
  const date = new Date(2026, 10, 7, 12, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.getTime();
}

test("an empty notebook has a zero streak", () => {
  expect(streakDays([], NOW)).toBe(0);
});

test("streakDays counts consecutive attempt-days ending today", () => {
  const attempts = [attempt("q", true, day(0)), attempt("q", true, day(-1)), attempt("q", true, day(-2))];
  expect(streakDays(attempts, NOW)).toBe(3);
});

test("streakDays may end yesterday when today has no attempts", () => {
  const attempts = [attempt("q", true, day(-1)), attempt("q", true, day(-2))];
  expect(streakDays(attempts, NOW)).toBe(2);
});

test("a gap breaks the streak", () => {
  const attempts = [attempt("q", true, day(0)), attempt("q", true, day(-2)), attempt("q", true, day(-3))];
  expect(streakDays(attempts, NOW)).toBe(1);
});

test("multiple attempts on one day count once", () => {
  const attempts = [attempt("a", true, day(0)), attempt("b", false, day(0)), attempt("c", true, day(-1))];
  expect(streakDays(attempts, NOW)).toBe(2);
});

test("a streak older than yesterday is zero", () => {
  expect(streakDays([attempt("q", true, day(-2))], NOW)).toBe(0);
});
