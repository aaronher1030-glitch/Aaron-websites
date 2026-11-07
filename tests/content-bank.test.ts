import { expect, test } from "vitest";
import { QUESTION_BY_ID, QUESTIONS } from "../src/data/questions";
import { DOMAINS } from "../src/data/types";
import { TOPICS, topicByName } from "../src/data/topics";

test("the seed bank is structurally valid", () => {
  expect(QUESTIONS.length).toBeGreaterThanOrEqual(5);
  for (const q of QUESTIONS) {
    expect(q.id).toMatch(/^[a-z0-9-]+$/);
    expect(q.choices).toHaveLength(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThanOrEqual(3);
    expect(q.explanation.trim().length).toBeGreaterThan(20);
    expect(q.stem.trim().length).toBeGreaterThan(10);
    expect(q.verified.status).toBe("verified");
  }
});

test("every item is a seed item with a unique id", () => {
  const ids = QUESTIONS.map((q) => q.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(QUESTION_BY_ID.size).toBe(QUESTIONS.length);
  for (const id of ids) {
    expect(id.startsWith("seed-"), `unexpected id: ${id}`).toBe(true);
  }
});

test("all five domains are represented", () => {
  for (const domain of DOMAINS) {
    expect(
      QUESTIONS.some((q) => q.domain === domain),
      `no question in domain ${domain}`,
    ).toBe(true);
  }
});

test("every topic resolves to a canonical topic name", () => {
  expect(TOPICS.length).toBeGreaterThanOrEqual(14);
  for (const q of QUESTIONS) {
    expect(topicByName(q.topic), `unknown topic: ${q.topic}`).toBeDefined();
  }
});
