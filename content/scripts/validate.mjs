/**
 * Validate the staged bank and only then publish src/data/questions.json.
 *
 * Rejects (exit 1, no write):
 *  - fewer than 350 publishable items;
 *  - duplicate ids, missing/empty required fields, wrong choice counts,
 *    out-of-range answers, flagged items inside the published array;
 *  - leftover key commentary in explanations;
 *  - malformed math (odd unescaped `$`, unbalanced \ce{...});
 *  - unknown source/paper/domain/difficulty/topic values;
 *  - a supplied paper without exactly 50 published items;
 *  - audit.published disagreeing with the bank length.
 *
 * The write is atomic: temp file, then rename.
 *
 * Run with: npm run content:validate
 */

import { existsSync, readFileSync } from "node:fs";

import { TOPIC_META } from "./merge.mjs";
import { atomicWrite } from "./lib.mjs";

const STAGED_BANK = "content/verification/published.json";
const AUDIT = "content/audit.json";
const TARGET = "src/data/questions.json";

const DOMAINS = ["General", "Physical", "Analytical", "Organic", "Laboratory"];
const DIFFICULTIES = ["Foundation", "Standard", "Olympiad"];
const SOURCES = ["supplied-paper", "textbook", "mixed", "gap-fill"];
const PAPERS = ["ch1-3-theory", "ch1-3-lab", "ch4-7-theory", "ch4-7-lab", "mixed-practice"];
const SUPPLIED_PAPERS = ["ch1-3-theory", "ch1-3-lab", "ch4-7-theory", "ch4-7-lab"];
const TOPIC_NAMES = new Set(TOPIC_META.map((topic) => topic.name));
/**
 * Forbidden explanation commentary. Deliberately narrower than the brief's
 * `/wait|check|.../`: the bare word "check" is ordinary chemistry wording
 * ("check the burette reading"), so it is not flagged. "wait" is only meta when
 * it stands alone as a word or sentence opener — never inside "await"/"waiting".
 */
const META_COMMENTARY = /\bwait\b|correct option|correct choice|key fix|re-verify|should be/i;
const MIN_ITEMS = 350;
const PAPER_SIZE = 50;

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Count `$` signs that are not escaped with a backslash. */
function unescapedDollars(text) {
  let count = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== "$") continue;
    let backslashes = 0;
    for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) backslashes += 1;
    if (backslashes % 2 === 0) count += 1;
  }
  return count;
}

/** True when every \ce{...} has a matching brace. */
function ceBracesBalanced(text) {
  let index = 0;
  while ((index = text.indexOf("\\ce{", index)) !== -1) {
    let depth = 0;
    let cursor = index + 3;
    for (; cursor < text.length; cursor += 1) {
      const char = text[cursor];
      if (char === "\\") {
        cursor += 1;
        continue;
      }
      if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (depth !== 0 || cursor >= text.length) return false;
    index = cursor + 1;
  }
  return true;
}

function main() {
  const errors = [];
  const warnings = [];

  if (!existsSync(STAGED_BANK)) {
    console.error(
      `validate: ${STAGED_BANK} is missing. Run content:apply after blind verification; ` +
        `${TARGET} was not touched.`,
    );
    process.exit(1);
  }
  if (!existsSync(AUDIT)) {
    console.error(`validate: ${AUDIT} is missing. Run content:apply first; ${TARGET} was not touched.`);
    process.exit(1);
  }

  const bank = readJson(STAGED_BANK);
  const audit = readJson(AUDIT);
  if (!Array.isArray(bank)) {
    console.error(`validate: ${STAGED_BANK} must contain a JSON array; ${TARGET} was not touched.`);
    process.exit(1);
  }
  if (bank.length < MIN_ITEMS) {
    errors.push(`only ${bank.length} publishable items; at least ${MIN_ITEMS} are required`);
  }

  const ids = new Set();
  const generalChemistry = [];
  const paperCounts = {};

  bank.forEach((q, index) => {
    const label = typeof q?.id === "string" && q.id ? q.id : `item[${index}]`;
    if (!q || typeof q !== "object") {
      errors.push(`${label}: not an object`);
      return;
    }

    if (typeof q.id !== "string" || q.id.trim() === "") errors.push(`${label}: missing id`);
    else {
      if (ids.has(q.id)) errors.push(`${label}: duplicate id`);
      ids.add(q.id);
      if (!/^[a-z0-9-]+$/.test(q.id)) errors.push(`${label}: id must be kebab-case`);
    }

    for (const field of ["topic", "difficulty", "stem", "explanation", "source"]) {
      if (typeof q[field] !== "string" || q[field].trim() === "") {
        errors.push(`${label}: missing or empty ${field}`);
      }
    }
    if (typeof q.domain !== "string" || !DOMAINS.includes(q.domain)) {
      errors.push(`${label}: invalid domain ${JSON.stringify(q.domain)}`);
    }
    if (!DIFFICULTIES.includes(q.difficulty)) {
      errors.push(`${label}: invalid difficulty ${JSON.stringify(q.difficulty)}`);
    }
    if (!SOURCES.includes(q.source)) errors.push(`${label}: invalid source ${JSON.stringify(q.source)}`);
    if (q.paper !== undefined && !PAPERS.includes(q.paper)) {
      errors.push(`${label}: invalid paper ${JSON.stringify(q.paper)}`);
    }
    if (q.chapter !== undefined && ![1, 2, 3, 4, 5, 6, 7].includes(q.chapter)) {
      errors.push(`${label}: invalid chapter ${JSON.stringify(q.chapter)}`);
    }
    if (typeof q.topic === "string" && !TOPIC_NAMES.has(q.topic)) {
      errors.push(`${label}: topic ${JSON.stringify(q.topic)} is not in the registry`);
    }
    if (q.topic === "General chemistry") generalChemistry.push(q.id);

    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push(`${label}: choices must have exactly 4 entries`);
    } else {
      q.choices.forEach((choice, choiceIndex) => {
        if (typeof choice !== "string" || choice.trim() === "") {
          errors.push(`${label}: choice ${choiceIndex} is missing or empty`);
        }
      });
    }

    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      errors.push(`${label}: answer ${JSON.stringify(q.answer)} is not an integer 0-3`);
    }

    if (!q.verified || typeof q.verified !== "object") {
      errors.push(`${label}: missing verified object`);
    } else {
      if (q.verified.status === "flagged" && q.paper !== undefined) {
        errors.push(`${label}: flagged item must not carry a paper`);
      }
      if (q.verified.status !== "verified") {
        errors.push(`${label}: published item has status ${JSON.stringify(q.verified.status)}`);
      }
      if (typeof q.verified.reviewedAt !== "string" || q.verified.reviewedAt.trim() === "") {
        errors.push(`${label}: verified.reviewedAt is missing`);
      }
    }

    if (typeof q.explanation === "string" && META_COMMENTARY.test(q.explanation)) {
      errors.push(`${label}: explanation still contains key commentary`);
    }

    const texts = [
      typeof q.stem === "string" ? q.stem : "",
      typeof q.explanation === "string" ? q.explanation : "",
      ...(Array.isArray(q.choices) ? q.choices.filter((choice) => typeof choice === "string") : []),
    ];
    for (const text of texts) {
      if (unescapedDollars(text) % 2 !== 0) {
        errors.push(`${label}: odd number of unescaped "$" in ${JSON.stringify(text.slice(0, 40))}...`);
        break;
      }
    }
    for (const text of texts) {
      if (!ceBracesBalanced(text)) {
        errors.push(`${label}: unbalanced \\ce{...} in ${JSON.stringify(text.slice(0, 40))}...`);
        break;
      }
    }

    if (q.paper !== undefined) paperCounts[q.paper] = (paperCounts[q.paper] ?? 0) + 1;
  });

  for (const paper of SUPPLIED_PAPERS) {
    const count = paperCounts[paper] ?? 0;
    if (count !== PAPER_SIZE) {
      errors.push(`paper ${paper} has ${count} published items; exactly ${PAPER_SIZE} are required`);
    }
  }

  if (typeof audit.published !== "number" || audit.published !== bank.length) {
    errors.push(`audit.published (${audit.published}) does not equal bank length (${bank.length})`);
  }

  if (generalChemistry.length > 0) {
    warnings.push(`${generalChemistry.length} published item(s) fall back to "General chemistry"`);
  }

  if (errors.length > 0) {
    console.error(`validate: ${errors.length} error(s); ${TARGET} was not written.`);
    for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
    if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
    process.exit(1);
  }

  atomicWrite(TARGET, `${JSON.stringify(bank, null, 2)}\n`);
  console.log(`validate: wrote ${bank.length} verified questions to ${TARGET}`);
  console.log("by paper:", paperCounts);
  for (const warning of warnings) console.warn(`warning: ${warning}`);
}

main();
