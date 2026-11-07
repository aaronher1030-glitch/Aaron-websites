/// <reference types="vite/client" />

import { expect, test } from "vitest";

import candidatesJson from "../content/candidates.json";
import manifestJson from "../content/verification/manifest.json";
import prototypeJson from "../content/prototype.raw.json";
import { TOPIC_META } from "../content/scripts/merge.mjs";
import { TOPICS } from "../src/data/topics";

interface Candidate {
  id: string;
  topic: string;
  answer: number;
  sourceKey: string;
  choices: string[];
  stem: string;
}

interface RawPrototype {
  id: string;
  answer: number;
  choices: string[];
}

interface BatchItem {
  id: string;
  stem: string;
  choices: string[];
}

interface Manifest {
  total: number;
  batches: number;
  batchSize: number;
  candidatesSha256: string;
  files: Record<string, { count: number; sha256: string }>;
}

const candidates = candidatesJson as Candidate[];
const prototype = prototypeJson as RawPrototype[];
const manifest = manifestJson as Manifest;

const batchModules = import.meta.glob<BatchItem[]>(
  "../content/verification/batches/*.json",
  { eager: true, import: "default" },
);

const batches = Object.entries(batchModules)
  .map(([path, items]) => ({ name: path.split("/").pop() ?? path, items }))
  .sort((a, b) => a.name.localeCompare(b.name));

test("candidates cover the merged inputs", () => {
  expect(candidates.length).toBeGreaterThanOrEqual(400);
  expect(candidates.length).toBe(434);
  for (const candidate of candidates) {
    expect(candidate.choices, candidate.id).toHaveLength(4);
    expect(Number.isInteger(candidate.answer), candidate.id).toBe(true);
    expect(candidate.answer, candidate.id).toBeGreaterThanOrEqual(0);
    expect(candidate.answer, candidate.id).toBeLessThanOrEqual(3);
    expect(candidate.sourceKey, candidate.id).toBe("ABCD"[candidate.answer]);
  }
});

test("proto-textbook choices are deterministically re-shuffled", () => {
  const textbook = candidates.filter((candidate) => candidate.id.startsWith("proto-textbook-"));
  expect(textbook).toHaveLength(104);

  const answers = new Set(textbook.map((candidate) => candidate.answer));
  expect(answers.size).toBeGreaterThan(1);

  const rawById = new Map(prototype.map((item) => [item.id, item]));
  const changed = textbook.filter((candidate) => {
    const raw = rawById.get(candidate.id);
    expect(raw, candidate.id).toBeDefined();
    return raw!.choices.some((choice, index) => choice !== candidate.choices[index]);
  });
  expect(changed.length).toBeGreaterThanOrEqual(90);
});

test("every batch item exposes only id, stem, and choices", () => {
  expect(batches.map((batch) => batch.name)).toEqual(Object.keys(manifest.files).sort());
  for (const { name, items } of batches) {
    expect(items.length, name).toBeLessThanOrEqual(manifest.batchSize);
    expect(items.length, name).toBeGreaterThan(0);
    for (const item of items) {
      expect(Object.keys(item).sort(), `${name} ${item.id}`).toEqual(["choices", "id", "stem"]);
      expect(item.choices, item.id).toHaveLength(4);
    }
  }
});

test("batch manifests cover every candidate id exactly once", () => {
  expect(manifest.batches).toBe(batches.length);
  expect(manifest.total).toBe(candidates.length);
  expect(manifest.batches).toBe(Math.ceil(candidates.length / manifest.batchSize));
  expect(manifest.candidatesSha256).toMatch(/^[0-9a-f]{64}$/);

  const seen = new Map<string, number>();
  for (const { name, items } of batches) {
    expect(manifest.files[name].count, name).toBe(items.length);
    expect(manifest.files[name].sha256, name).toMatch(/^[0-9a-f]{64}$/);
    for (const item of items) seen.set(item.id, (seen.get(item.id) ?? 0) + 1);
  }

  expect(seen.size).toBe(candidates.length);
  for (const candidate of candidates) {
    expect(seen.get(candidate.id), candidate.id).toBe(1);
  }
});

test("the merge topic table mirrors the TypeScript registry", () => {
  const fromScript = TOPIC_META.map(({ name, chapter, domain }) => ({ name, chapter, domain }));
  const fromRegistry = TOPICS.map(({ name, chapter, domain }) => ({ name, chapter, domain }));
  expect(fromScript).toEqual(fromRegistry);
  expect(fromScript).toHaveLength(14);
});
