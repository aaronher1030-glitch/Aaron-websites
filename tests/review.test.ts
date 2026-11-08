import { expect, test } from "vitest";
import { dueReview, scheduleReview } from "../src/lib/review";
import type { Store } from "../src/data/types";

test("wrong answers come back tomorrow and advance on success", () => {
  const now = Date.UTC(2026, 10, 7);
  const first = scheduleReview(undefined, false, now);
  expect(first.dueAt).toBe(now + 86_400_000);
  const second = scheduleReview({ ...first, qid: "q" }, true, now);
  expect(second.dueAt).toBe(now + 3 * 86_400_000);
});

test("correct answers advance through the intervals and cap", () => {
  let item = { qid: "q", dueAt: 0, step: 0, lastSeen: 0 };
  for (const days of [3, 7, 21, 21]) {
    item = scheduleReview(item, true, 0);
    expect(item.dueAt).toBe(days * 86_400_000);
  }
});

test("a wrong answer keeps the step but resets the interval to one day", () => {
  const now = Date.UTC(2026, 10, 7);
  const existing = { qid: "q", dueAt: now, step: 2, lastSeen: now - 1000 };
  const next = scheduleReview(existing, false, now);
  expect(next.step).toBe(2);
  expect(next.dueAt).toBe(now + 86_400_000);
  expect(next.qid).toBe("q");
  expect(next.lastSeen).toBe(now);
});

test("dueReview returns only items due now, oldest first", () => {
  const now = Date.UTC(2026, 10, 7);
  const store: Store = {
    version: 1,
    attempts: [],
    drills: [],
    stashed: [],
    theme: "auto",
    createdAt: 0,
    review: [
      { qid: "b", dueAt: now - 1000, step: 0, lastSeen: 0 },
      { qid: "a", dueAt: now - 5000, step: 1, lastSeen: 0 },
      { qid: "c", dueAt: now + 5000, step: 0, lastSeen: 0 },
      { qid: "d", dueAt: now, step: 0, lastSeen: 0 },
    ],
  };
  expect(dueReview(store, now).map((item) => item.qid)).toEqual(["a", "b", "d"]);
});
