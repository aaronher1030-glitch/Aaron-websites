/**
 * Shared helpers for the ChemBank content pipeline.
 *
 * Everything here is deterministic: no Math.random, no wall-clock input. The
 * prototype stores its textbook (LQ) answers at index 0 because the original
 * page shuffled choices at runtime, so the merge re-creates that shuffle from
 * a stable per-item seed instead of copying the page's random sort.
 */

import { createHash } from "node:crypto";
import { renameSync, writeFileSync } from "node:fs";

export const KEY_LETTERS = "ABCD";

/** Stable 32-bit FNV-1a hash. */
export function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Tiny seeded PRNG (mulberry32). Returns floats in [0, 1). */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffle an item's choices with a seed derived from its id.
 * Returns the new choice order and the new index of the original correct
 * choice. Duplicate choice text is tracked by position, not by string lookup.
 */
export function shuffleChoices(item) {
  const rng = mulberry32(fnv1a32(item.id));
  const entries = item.choices.map((text, index) => ({
    text,
    correct: index === item.answer,
  }));
  for (let i = entries.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return {
    choices: entries.map((entry) => entry.text),
    answer: entries.findIndex((entry) => entry.correct),
  };
}

/** Lowercase, tag-free, math-free form used for duplicate detection. */
export function normalizeText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function sourceKeyFor(answer) {
  return KEY_LETTERS[answer] ?? "";
}

const META_COMMENTARY =
  /\b(?:wait|hmm|hold on|correct option|correct choice|correct answer|key fix|answer key|re-?verify|re-?check|should be)\b/i;

/**
 * Drop clearly meta sentences ("Wait, check...", "Correct option: D",
 * "Key fix: ...") from an explanation. Sentences that merely contain a flagged
 * phrase are dropped only when the phrase is commentary; chemistry wording is
 * never rewritten.
 */
export function stripMetaCommentary(text) {
  if (!text) return "";
  const paragraphs = String(text).split(/\n{2,}/);
  const kept = [];
  for (const paragraph of paragraphs) {
    const sentences = paragraph.split(/(?<=[.!?])\s+(?=[A-Z(“"(])/u);
    const filtered = sentences.filter((sentence) => !META_COMMENTARY.test(sentence));
    const joined = filtered.join(" ").replace(/[ \t]+/g, " ").trim();
    if (joined) kept.push(joined);
  }
  return kept.join("\n\n").trim();
}

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/** Write via a temp file and rename so readers never see a half-written bank. */
export function atomicWrite(file, data) {
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, data);
  renameSync(temp, file);
}
