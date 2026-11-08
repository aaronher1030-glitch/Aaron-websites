import { expect, test } from "vitest";
import {
  answeredCount,
  createDrill,
  dailyQids,
  diagnosticQids,
  drillStats,
  dueQids,
  isQuestionCorrect,
  latestAttemptMap,
  paperQids,
  randomQids,
  remainingSeconds,
  shuffle,
  uid,
  weakQids,
  weakTopicNames,
} from "../src/lib/drill";
import { QUESTIONS, QUESTION_BY_ID } from "../src/data/questions";
import { DOMAINS, type Attempt, type ReviewItem } from "../src/data/types";

test("scores answered questions and ignores blanks", () => {
  const q = QUESTIONS[0];
  const drill = createDrill({ name: "t", mode: "practice", qids: [q.id], limitSec: 0 });
  expect(drillStats(drill).accuracy).toBeNull();
  drill.answers[q.id] = "A";
  expect(isQuestionCorrect(drill, q.id)).toBe(q.answer === 0);
  expect(drillStats(drill).answered).toBe(1);
});

function attempt(qid: string, correct: boolean, ts = 0): Attempt {
  return { qid, correct, answer: correct ? "A" : "B", ts, elapsedSec: 1, mode: "single" };
}

function topicPool(topic: string) {
  return QUESTIONS.filter((q) => q.topic === topic);
}

test("createDrill starts clean with the requested mode and limit", () => {
  const drill = createDrill({ name: "Custom drill", mode: "timed", qids: ["x", "y"], limitSec: 180 });
  expect(drill).toMatchObject({
    name: "Custom drill",
    mode: "timed",
    qids: ["x", "y"],
    answers: {},
    checked: {},
    flagged: {},
    strikes: {},
    index: 0,
    limitSec: 180,
    elapsedSec: 0,
    done: false,
  });
  expect(typeof drill.id).toBe("string");
  expect(drill.id.length).toBeGreaterThan(0);
  expect(typeof drill.startedAt).toBe("number");
  expect(drill.finishedAt).toBeUndefined();
});

test("uid produces unique non-empty ids", () => {
  const ids = Array.from({ length: 500 }, () => uid());
  expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
  expect(new Set(ids).size).toBe(500);
});

test("uid falls back when crypto.randomUUID is unavailable", () => {
  const cryptoObj = globalThis.crypto;
  Object.defineProperty(cryptoObj, "randomUUID", { value: undefined, configurable: true });
  try {
    const a = uid();
    const b = uid();
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  } finally {
    // Remove the own-property shadow so the prototype method is visible again.
    delete (cryptoObj as { randomUUID?: unknown }).randomUUID;
  }
});

test("answeredCount ignores blank and whitespace-only answers", () => {
  const [a, b, c] = QUESTIONS;
  const drill = createDrill({ name: "t", mode: "practice", qids: [a.id, b.id, c.id], limitSec: 0 });
  expect(answeredCount(drill)).toBe(0);
  drill.answers[a.id] = "A";
  drill.answers[b.id] = "   ";
  expect(answeredCount(drill)).toBe(1);
  drill.answers[c.id] = "";
  expect(answeredCount(drill)).toBe(1);
});

test("drillStats reports accuracy over answered items only", () => {
  const [a, b, c] = QUESTIONS;
  const drill = createDrill({ name: "t", mode: "practice", qids: [a.id, b.id, c.id], limitSec: 0 });
  drill.answers[a.id] = String.fromCharCode(65 + a.answer);
  drill.answers[b.id] = String.fromCharCode(65 + ((b.answer + 1) % 4));
  expect(drillStats(drill)).toEqual({ total: 3, answered: 2, correct: 1, accuracy: 50 });
});

test("remainingSeconds clamps at zero and reports zero for untimed drills", () => {
  const timed = createDrill({ name: "t", mode: "timed", qids: [], limitSec: 100 });
  expect(remainingSeconds({ ...timed, elapsedSec: 30 })).toBe(70);
  expect(remainingSeconds({ ...timed, elapsedSec: 100 })).toBe(0);
  expect(remainingSeconds({ ...timed, elapsedSec: 150 })).toBe(0);
  const untimed = createDrill({ name: "t", mode: "practice", qids: [], limitSec: 0 });
  expect(remainingSeconds({ ...untimed, elapsedSec: 90 })).toBe(0);
});

test("latestAttemptMap keeps the last appended attempt per question", () => {
  const [a, b] = QUESTIONS;
  const first = attempt(a.id, false, 10);
  const other = attempt(b.id, true, 20);
  const last = attempt(a.id, true, 5);
  const map = latestAttemptMap([first, other, last]);
  expect(map.size).toBe(2);
  expect(map.get(a.id)).toBe(last);
  expect(map.get(b.id)).toBe(other);
  expect(latestAttemptMap([]).size).toBe(0);
});

test("diagnosticQids balances four random items per domain", () => {
  const qids = diagnosticQids(QUESTIONS);
  expect(qids).toHaveLength(20);
  expect(new Set(qids).size).toBe(20);
  for (const domain of DOMAINS) {
    expect(qids.filter((id) => QUESTION_BY_ID.get(id)?.domain === domain)).toHaveLength(4);
  }
});

test("weakTopicNames requires at least two attempted questions and under 60% latest accuracy", () => {
  const meas = topicPool("Measurement and units");
  const atom = topicPool("Atomic structure");
  const stoich = topicPool("Stoichiometry");
  const gases = topicPool("Gases");
  const thermo = topicPool("Thermochemistry");
  const attempts: Attempt[] = [
    // Measurement: 2 attempted, both wrong -> 0%, weak.
    attempt(meas[0].id, false, 1),
    attempt(meas[1].id, false, 2),
    // Atomic structure: 2 attempted, both correct -> 100%, not weak.
    attempt(atom[0].id, true, 3),
    attempt(atom[1].id, true, 4),
    // Stoichiometry: a single attempted question is below the minimum.
    attempt(stoich[0].id, false, 5),
    // Gases: 3 of 5 correct is exactly 60% — the threshold is strict.
    attempt(gases[0].id, true, 6),
    attempt(gases[1].id, true, 7),
    attempt(gases[2].id, true, 8),
    attempt(gases[3].id, false, 9),
    attempt(gases[4].id, false, 10),
    // Thermochemistry: 2 of 5 correct -> 40%, weak.
    attempt(thermo[0].id, true, 11),
    attempt(thermo[1].id, true, 12),
    attempt(thermo[2].id, false, 13),
    attempt(thermo[3].id, false, 14),
    attempt(thermo[4].id, false, 15),
    // Unknown ids never form a topic.
    attempt("not-in-the-bank", false, 16),
  ];
  const weak = weakTopicNames(attempts);
  expect(weak.has("Measurement and units")).toBe(true);
  expect(weak.has("Thermochemistry")).toBe(true);
  expect(weak.has("Atomic structure")).toBe(false);
  expect(weak.has("Stoichiometry")).toBe(false);
  expect(weak.has("Gases")).toBe(false);
  expect(weakTopicNames([]).size).toBe(0);
});

test("weak topics read the latest attempt per question, not every attempt", () => {
  const pool = topicPool("Nomenclature");
  const recovered = [
    attempt(pool[0].id, false, 1),
    attempt(pool[1].id, false, 2),
    attempt(pool[0].id, true, 3),
    attempt(pool[1].id, true, 4),
  ];
  expect(weakTopicNames(recovered).has("Nomenclature")).toBe(false);
  const half = [
    attempt(pool[0].id, false, 1),
    attempt(pool[1].id, false, 2),
    attempt(pool[0].id, true, 3),
  ];
  expect(weakTopicNames(half).has("Nomenclature")).toBe(true);
});

test("weakQids is empty for a fresh store and drills whole weak topics", () => {
  expect(weakQids(QUESTIONS, [])).toEqual([]);
  const pool = topicPool("Kinetics");
  const attempts = [attempt(pool[0].id, false, 1), attempt(pool[1].id, false, 2)];
  expect(weakQids(QUESTIONS, attempts)).toEqual(pool.map((q) => q.id));
});

test("dailyQids takes unseen items first, then weak topics, and fills to ten", () => {
  const fresh = dailyQids(QUESTIONS, []);
  expect(fresh).toHaveLength(10);
  expect(new Set(fresh).size).toBe(10);

  const unseen = QUESTIONS.filter((q) => q.topic !== "Gases").slice(0, 4);
  const unseenIds = new Set(unseen.map((q) => q.id));
  const attempts: Attempt[] = [];
  let ts = 1;
  for (const q of QUESTIONS) {
    if (unseenIds.has(q.id)) continue;
    // Every Gases item is seen and wrong (0% -> weak); all other seen items correct.
    attempts.push(attempt(q.id, q.topic !== "Gases", ts++));
  }
  const qids = dailyQids(QUESTIONS, attempts);
  expect(qids).toHaveLength(10);
  expect(new Set(qids).size).toBe(10);
  expect(new Set(qids.slice(0, 4))).toEqual(unseenIds);
  for (const id of qids.slice(4)) {
    expect(QUESTION_BY_ID.get(id)?.topic).toBe("Gases");
  }
});

test("dailyQids fills from the wider bank when unseen and weak run short", () => {
  const kinetics = topicPool("Kinetics");
  const wrongIds = new Set([kinetics[2].id, kinetics[3].id]);
  // No unseen items; Kinetics sits at 2/4 = 50% (weak), everything else at 100%.
  const attempts = QUESTIONS.map((q, i) => attempt(q.id, !wrongIds.has(q.id), i + 1));
  const qids = dailyQids(QUESTIONS, attempts);
  expect(qids).toHaveLength(10);
  expect(new Set(qids).size).toBe(10);
  expect(new Set(qids.slice(0, 4))).toEqual(new Set(kinetics.map((q) => q.id)));
});

test("dueQids keeps only known items due at or before now, sorted by dueAt", () => {
  const [a, b, c] = QUESTIONS;
  const now = 1_000_000;
  const review: ReviewItem[] = [
    { qid: b.id, dueAt: now + 5000, step: 0, lastSeen: 0 },
    { qid: a.id, dueAt: now - 5000, step: 1, lastSeen: 0 },
    { qid: "missing-id", dueAt: now - 10000, step: 0, lastSeen: 0 },
    { qid: c.id, dueAt: now, step: 0, lastSeen: 0 },
  ];
  expect(dueQids(review, now)).toEqual([a.id, c.id]);
  expect(dueQids([], now)).toEqual([]);
});

test("paperQids returns every published item of each supplied paper", () => {
  const expected: Record<string, number> = {
    "ch1-3-theory": 49,
    "ch1-3-lab": 49,
    "ch4-7-theory": 48,
    "ch4-7-lab": 50,
  };
  for (const [paper, count] of Object.entries(expected)) {
    const qids = paperQids(paper);
    expect(qids).toHaveLength(count);
    expect(new Set(qids).size).toBe(count);
    for (const id of qids) {
      expect(QUESTION_BY_ID.get(id)?.paper).toBe(paper);
    }
  }
});

test("randomQids draws distinct items and shuffle preserves the pool", () => {
  const qids = randomQids(QUESTIONS, 10);
  expect(qids).toHaveLength(10);
  expect(new Set(qids).size).toBe(10);
  for (const id of qids) expect(QUESTION_BY_ID.has(id)).toBe(true);

  const pool = QUESTIONS.slice(0, 12);
  const shuffled = shuffle(pool);
  expect(shuffled).toHaveLength(pool.length);
  expect(new Set(shuffled.map((q) => q.id))).toEqual(new Set(pool.map((q) => q.id)));
  expect(pool).toEqual(QUESTIONS.slice(0, 12));
});