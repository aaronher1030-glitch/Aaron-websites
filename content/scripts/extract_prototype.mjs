/**
 * Extract the ChemBank prototype question bank from the user-supplied HTML.
 *
 * Source of record: content/source/chembank-accounts.html (see the README
 * there for provenance). The file is a one-page reviewer whose three question
 * arrays are plain JavaScript literals:
 *
 *   raw: [domain, topic, tier, difficulty, stem, choices, answer, explanation]
 *   RP:  [domain, topic, difficulty, stem, choices, answer, explanation]
 *   LQ:  [sectionCode, difficulty, stem, choices, answer, explanation]
 *
 * The page itself is never executed: only the array literals are evaluated,
 * in an empty VM context, and every string is copied through untouched so
 * Task 5 can blind-verify the original wording, HTML markup and math.
 *
 * Output: content/prototype.raw.json
 *
 * Run with: npm run content:prototype
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const CONTENT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(CONTENT, "source", "chembank-accounts.html");
const OUT = join(CONTENT, "prototype.raw.json");

const html = readFileSync(SOURCE, "utf8");

/**
 * Return the source text of the array literal assigned to `const <name>=[`.
 * Tracks brackets outside string literals so brackets inside stems or choices
 * cannot end the scan early.
 */
function grabArrayLiteral(name) {
  const anchor = `const ${name}=[`;
  const start = html.indexOf(anchor);
  if (start < 0) throw new Error(`prototype: missing array ${name}`);
  const open = start + anchor.length - 1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = open; i < html.length; i += 1) {
    const char = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return html.slice(open, i + 1);
    }
  }
  throw new Error(`prototype: unbalanced array literal ${name}`);
}

function readArray(name) {
  const source = grabArrayLiteral(name);
  const value = vm.runInNewContext(`(${source})`, Object.create(null));
  if (!Array.isArray(value)) throw new Error(`prototype: ${name} is not an array`);
  return value;
}

const raw = readArray("raw");
const practice = readArray("RP");
const sections = readArray("SEC");
const textbook = readArray("LQ");

const DOMAIN_NAMES = {
  G: "General",
  R: "Physical",
  A: "Analytical",
  O: "Organic",
  M: "Laboratory",
};
const DIFFICULTY_NAMES = { E: "Foundation", M: "Standard", H: "Olympiad" };
const SECTION_FALLBACK = "Chapter 1–2 foundations";

const problems = [];
function problem(id, message) {
  problems.push(`${id}: ${message}`);
}

function requireCode(id, kind, value, allowed) {
  if (!Object.hasOwn(allowed, value)) {
    problem(id, `unknown ${kind} code ${JSON.stringify(value)}`);
    return undefined;
  }
  return allowed[value];
}

function requireShape(id, row, length) {
  if (!Array.isArray(row) || row.length !== length) {
    problem(id, `expected ${length} fields, got ${Array.isArray(row) ? row.length : typeof row}`);
    return false;
  }
  return true;
}

function requireText(id, label, value, minLength) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    problem(id, `${label} is missing or shorter than ${minLength} characters`);
    return false;
  }
  return true;
}

function requireChoices(id, choices) {
  if (!Array.isArray(choices) || choices.length !== 4) {
    problem(id, `expected 4 choices, got ${Array.isArray(choices) ? choices.length : typeof choices}`);
    return false;
  }
  for (const [index, choice] of choices.entries()) {
    requireText(id, `choice ${index}`, choice, 1);
  }
  return true;
}

function requireAnswer(id, answer) {
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
    problem(id, `answer index ${JSON.stringify(answer)} is not an integer in 0..3`);
    return false;
  }
  return true;
}

const sectionTitles = new Map();
for (const [index, section] of sections.entries()) {
  const id = `SEC[${index}]`;
  if (!section || typeof section !== "object") {
    problem(id, "section is not an object");
    continue;
  }
  if (typeof section.n !== "string" || section.n.length === 0) {
    problem(id, "section number is missing");
    continue;
  }
  if (typeof section.t !== "string" || section.t.length === 0) {
    problem(id, "section title is missing");
    continue;
  }
  if (sectionTitles.has(section.n)) problem(id, `duplicate section code ${section.n}`);
  sectionTitles.set(section.n, section.t);
}

const mixedItems = raw.map((row, index) => {
  const id = `proto-mixed-${String(index + 1).padStart(3, "0")}`;
  if (!requireShape(id, row, 8)) return null;
  return {
    id,
    source: "mixed",
    domain: requireCode(id, "domain", row[0], DOMAIN_NAMES),
    topic: requireText(id, "topic", row[1], 1) ? row[1] : undefined,
    difficulty: requireCode(id, "difficulty", row[3], DIFFICULTY_NAMES),
    stem: requireText(id, "stem", row[4], 6) ? row[4] : undefined,
    choices: requireChoices(id, row[5]) ? row[5] : undefined,
    answer: requireAnswer(id, row[6]) ? row[6] : undefined,
    explanation: requireText(id, "explanation", row[7], 11) ? row[7] : undefined,
  };
});

const practiceItems = practice.map((row, index) => {
  const id = `proto-practice-${String(index + 1).padStart(3, "0")}`;
  if (!requireShape(id, row, 7)) return null;
  return {
    id,
    source: "textbook",
    domain: requireCode(id, "domain", row[0], DOMAIN_NAMES),
    topic: requireText(id, "topic", row[1], 1) ? row[1] : undefined,
    difficulty: requireCode(id, "difficulty", row[2], DIFFICULTY_NAMES),
    stem: requireText(id, "stem", row[3], 6) ? row[3] : undefined,
    choices: requireChoices(id, row[4]) ? row[4] : undefined,
    answer: requireAnswer(id, row[5]) ? row[5] : undefined,
    explanation: requireText(id, "explanation", row[6], 11) ? row[6] : undefined,
  };
});

const textbookUsage = new Map();
const textbookItems = textbook.map((row, index) => {
  const id = `proto-textbook-${String(index + 1).padStart(3, "0")}`;
  if (!requireShape(id, row, 6)) return null;
  let topic = SECTION_FALLBACK;
  if (typeof row[0] !== "string" || !sectionTitles.has(row[0])) {
    problem(id, `unknown section code ${JSON.stringify(row[0])}`);
  } else {
    topic = sectionTitles.get(row[0]);
    textbookUsage.set(row[0], (textbookUsage.get(row[0]) ?? 0) + 1);
  }
  return {
    id,
    source: "textbook",
    domain: "General",
    topic,
    difficulty: requireCode(id, "difficulty", row[1], DIFFICULTY_NAMES),
    stem: requireText(id, "stem", row[2], 6) ? row[2] : undefined,
    choices: requireChoices(id, row[3]) ? row[3] : undefined,
    answer: requireAnswer(id, row[4]) ? row[4] : undefined,
    explanation: requireText(id, "explanation", row[5], 11) ? row[5] : undefined,
  };
});

for (const section of sections) {
  if (typeof section?.n === "string" && !textbookUsage.has(section.n)) {
    console.warn(`warning: section ${section.n} has no textbook questions`);
  }
}

if (problems.length > 0) {
  console.error(`prototype: ${problems.length} contract violation(s); nothing written`);
  for (const entry of problems) console.error(`  ${entry}`);
  process.exitCode = 1;
} else {
  const items = [...mixedItems, ...practiceItems, ...textbookItems];
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== items.length) throw new Error("prototype: duplicate ids");
  writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`);
  const count = (prefix) => items.filter((item) => item.id.startsWith(prefix)).length;
  console.log(
    `wrote ${items.length} questions (mixed ${count("proto-mixed")}, ` +
      `practice ${count("proto-practice")}, textbook ${count("proto-textbook")})`,
  );
}
