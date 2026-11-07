/**
 * Merge the four supplied PNCO papers and the imported prototype bank into one
 * candidate list for blind verification.
 *
 * Inputs:  content/docx.raw.json (200 items), content/prototype.raw.json (234)
 * Output:  content/candidates.json, content/merge-report.json
 *
 * Controller rulings applied here:
 *  - proto-textbook (LQ) items are deterministically re-shuffled from their id;
 *  - every candidate carries both `answer` (0-3) and `sourceKey` (A-D);
 *  - chapters come from the canonical topic registry, not the source paper;
 *  - supplied-paper items are Olympiad difficulty;
 *  - dedupe uses the full normalized stem plus the normalized first choice.
 *
 * Run with: npm run content:merge
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  KEY_LETTERS,
  normalizeText,
  shuffleChoices,
  sourceKeyFor,
} from "./lib.mjs";

/**
 * Mirror of src/data/topics.ts. `tests/content-pipeline.test.ts` asserts the
 * two tables agree, so this literal can never drift silently.
 */
export const TOPIC_META = [
  { name: "Measurement and units", chapter: 1, domain: "General" },
  { name: "Atomic structure", chapter: 2, domain: "General" },
  { name: "Nomenclature", chapter: 2, domain: "General" },
  { name: "Stoichiometry", chapter: 3, domain: "General" },
  { name: "Aqueous reactions", chapter: 4, domain: "Analytical" },
  { name: "Gases", chapter: 5, domain: "Physical" },
  { name: "Thermochemistry", chapter: 6, domain: "Physical" },
  { name: "Electronic structure and spectroscopy", chapter: 7, domain: "Physical" },
  { name: "Organic chemistry", domain: "Organic" },
  { name: "Equilibrium and acid–base", domain: "Analytical" },
  { name: "Kinetics", domain: "Physical" },
  { name: "Electrochemistry", domain: "Analytical" },
  { name: "Laboratory technique", domain: "Laboratory" },
  { name: "General chemistry", domain: "General" },
];

const TOPIC_BY_NAME = new Map(TOPIC_META.map((topic) => [topic.name, topic]));

/**
 * Topic resolution rules. Ordered: subject-specific patterns first so that a
 * section like "Empirical Formula Determination" is stoichiometry and not
 * nomenclature, and a chapter-4 lab section is aqueous rather than laboratory.
 */
const TOPIC_RULES = [
  [
    /stoichiometr|empirical formula|limiting reagent|percent yield|reaction yield|the mole|molar mass|\bmoles?\b/i,
    "Stoichiometry",
  ],
  [/nomenclature|naming compounds|chemical formulas?|formulas? and names/i, "Nomenclature"],
  [
    /measurement|density|significant|dimensional analysis|\bmatter\b|handling numbers|scientific notation|unit conversion/i,
    "Measurement and units",
  ],
  [
    /atomic|isotope|subatomic|\batoms?\b|molecules? and ions|structure of the atom/i,
    "Atomic structure",
  ],
  [/aqueous|precipitat|redox|titrat|gravimetr|reactions in solution/i, "Aqueous reactions"],
  [/\bgas(?:es)?\b|gas laws?|effusion|manometr/i, "Gases"],
  [/thermo|calorim|enthalpy|hess/i, "Thermochemistry"],
  [
    /quantum|electronic|periodic|spectro|flame|electromagnetic|beer'?s law/i,
    "Electronic structure and spectroscopy",
  ],
  [/organic|functional group|isomer|stereo|biomolecule/i, "Organic chemistry"],
  [/equilibri|acid|base|\bph\b|buffer/i, "Equilibrium and acid–base"],
  [/kinetic|rate law|arrhenius/i, "Kinetics"],
  [/electrochem|\bcell|emf|nernst/i, "Electrochemistry"],
  [
    /laborator|apparatus|burette|pipette|filtration|chromatograph|error analysis/i,
    "Laboratory technique",
  ],
];

/** Resolve free text to a canonical topic. `matched` is false for the fallback. */
export function resolveTopic(text) {
  for (const [pattern, topic] of TOPIC_RULES) {
    if (pattern.test(String(text ?? ""))) return { topic, matched: true };
  }
  return { topic: "General chemistry", matched: false };
}

const DOCX_PAPERS = ["ch1-3-theory", "ch1-3-lab", "ch4-7-theory", "ch4-7-lab"];

function countBy(items, pick) {
  const counts = {};
  for (const item of items) {
    const key = pick(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function dedupeKey(item) {
  return `${normalizeText(item.stem)} || ${normalizeText(item.choices[0])}`;
}

function buildDocxCandidates(docx, warnings) {
  const unmatchedSections = new Map();
  const candidates = docx.map((item) => {
    const answer = KEY_LETTERS.indexOf(item.sourceKey);
    if (answer < 0) throw new Error(`merge: ${item.id} has invalid sourceKey ${item.sourceKey}`);
    if (!DOCX_PAPERS.includes(item.paper)) {
      throw new Error(`merge: ${item.id} has unknown paper ${item.paper}`);
    }

    const sectionText = item.section ?? item.stem;
    const { topic, matched } = resolveTopic(sectionText);
    if (!matched) unmatchedSections.set(sectionText, (unmatchedSections.get(sectionText) ?? 0) + 1);
    const meta = TOPIC_BY_NAME.get(topic);
    if (!meta) throw new Error(`merge: topic ${topic} missing from TOPIC_META`);

    const isLab = item.paper.includes("lab");
    const candidate = {
      id: item.id,
      source: "supplied-paper",
      domain: isLab ? "Laboratory" : meta.domain,
      topic,
      difficulty: "Olympiad",
      stem: item.stem,
      choices: item.choices,
      answer,
      sourceKey: item.sourceKey,
      explanation: item.explanation ?? "",
      paper: item.paper,
      tags: Array.isArray(item.tags) ? item.tags : undefined,
      flags: Array.isArray(item.flags) ? item.flags : undefined,
      number: item.number,
      section: item.section,
      sourceFile: item.sourceFile,
      verified: { status: "flagged", reviewedAt: "2026-11-07" },
    };
    if (meta.chapter) candidate.chapter = meta.chapter;
    return candidate;
  });

  for (const [section, count] of unmatchedSections) {
    warnings.add(
      `Unmapped supplied-paper section "${section}" (${count} item${count === 1 ? "" : "s"}) ` +
        "→ General chemistry",
    );
  }
  return candidates;
}

function buildPrototypeCandidates(proto, warnings, shuffleLog) {
  const unmatchedTopics = new Map();
  const candidates = proto.map((item) => {
    const isTextbook = item.id.startsWith("proto-textbook-");
    const isPracticeOrMixed = item.id.startsWith("proto-practice-") || item.id.startsWith("proto-mixed-");
    if (!isTextbook && !isPracticeOrMixed) {
      throw new Error(`merge: unexpected prototype id ${item.id}`);
    }

    let choices = item.choices;
    let answer = item.answer;
    if (isTextbook) {
      const shuffled = shuffleChoices(item);
      choices = shuffled.choices;
      answer = shuffled.answer;
      shuffleLog.push({
        id: item.id,
        fromAnswer: item.answer,
        toAnswer: answer,
        orderChanged: choices.some((choice, index) => choice !== item.choices[index]),
      });
    }
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
      throw new Error(`merge: ${item.id} has invalid answer ${item.answer}`);
    }

    const { topic, matched } = resolveTopic(item.topic);
    if (!matched) unmatchedTopics.set(item.topic, (unmatchedTopics.get(item.topic) ?? 0) + 1);
    const meta = TOPIC_BY_NAME.get(topic);
    if (!meta) throw new Error(`merge: topic ${topic} missing from TOPIC_META`);

    const candidate = {
      id: item.id,
      source: item.source,
      // Ruling 4: prototype keeps its imported domain.
      domain: item.domain,
      topic,
      difficulty: item.difficulty,
      stem: item.stem,
      choices,
      answer,
      sourceKey: sourceKeyFor(answer),
      explanation: item.explanation ?? "",
      paper: isTextbook ? undefined : "mixed-practice",
      tags: Array.isArray(item.tags) ? item.tags : undefined,
      verified: { status: "flagged", reviewedAt: "2026-11-07" },
    };
    if (meta.chapter) candidate.chapter = meta.chapter;
    return candidate;
  });

  for (const [topic, count] of unmatchedTopics) {
    warnings.add(
      `Unmapped prototype topic "${topic}" (${count} item${count === 1 ? "" : "s"}) ` +
        "→ General chemistry; imported domain kept",
    );
  }
  return candidates;
}

function mergeDuplicates(candidates, dedupedIds) {
  const kept = new Map();
  for (const item of candidates) {
    const key = dedupeKey(item);
    const existing = kept.get(key);
    if (!existing) {
      kept.set(key, item);
      continue;
    }

    // Ruling 6: keep the supplied-paper item (it carries a paper), union tags,
    // and only borrow the duplicate's explanation when the kept one is empty.
    const bothTags = [...new Set([...(existing.tags ?? []), ...(item.tags ?? []), "merged"])];
    if (existing.source !== "supplied-paper" && item.source === "supplied-paper") {
      dedupedIds.push(existing.id);
      kept.set(key, {
        ...item,
        tags: bothTags,
        explanation: item.explanation || existing.explanation,
      });
    } else {
      dedupedIds.push(item.id);
      existing.tags = bothTags;
      if (!existing.explanation && item.explanation) existing.explanation = item.explanation;
    }
  }
  return [...kept.values()];
}

function main() {
  const docx = readJson("content/docx.raw.json");
  const proto = readJson("content/prototype.raw.json");
  const warnings = new Set();
  const shuffleLog = [];
  const dedupedIds = [];

  const docxCandidates = buildDocxCandidates(docx, warnings);
  const protoCandidates = buildPrototypeCandidates(proto, warnings, shuffleLog);

  const merged = [...docxCandidates, ...protoCandidates];
  const candidates = mergeDuplicates(merged, dedupedIds);

  // A second pass is defensive: ids must be unique before batching.
  const ids = new Set();
  for (const candidate of candidates) {
    if (ids.has(candidate.id)) throw new Error(`merge: duplicate id ${candidate.id}`);
    ids.add(candidate.id);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    inputs: { docx: docx.length, prototype: proto.length },
    merged: merged.length,
    candidates: candidates.length,
    deduped: dedupedIds.length,
    dedupedIds,
    byPaper: countBy(candidates, (q) => q.paper ?? "(no paper)"),
    bySource: countBy(candidates, (q) => q.source),
    byDomain: countBy(candidates, (q) => q.domain),
    byDifficulty: countBy(candidates, (q) => q.difficulty),
    byChapter: countBy(candidates, (q) => (q.chapter == null ? "none" : String(q.chapter))),
    protoTextbook: {
      count: shuffleLog.length,
      beforeAnswers: countBy(shuffleLog, (row) => String(row.fromAnswer)),
      afterAnswers: countBy(shuffleLog, (row) => String(row.toAnswer)),
      orderChanged: shuffleLog.filter((row) => row.orderChanged).length,
      sample: shuffleLog.slice(0, 5),
    },
    warnings: [...warnings].sort(),
  };

  writeFileSync("content/candidates.json", `${JSON.stringify(candidates, null, 2)}\n`);
  writeFileSync("content/merge-report.json", `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    `merge: ${docx.length} supplied + ${proto.length} prototype → ${candidates.length} candidates ` +
      `(${dedupedIds.length} deduped)`,
  );
  console.log("by paper:", report.byPaper);
  console.log("by source:", report.bySource);
  console.log("by domain:", report.byDomain);
  console.log("by difficulty:", report.byDifficulty);
  console.log(
    `proto-textbook shuffle: before ${JSON.stringify(report.protoTextbook.beforeAnswers)} ` +
      `after ${JSON.stringify(report.protoTextbook.afterAnswers)}; ` +
      `${report.protoTextbook.orderChanged}/${shuffleLog.length} orders changed`,
  );
  if (report.warnings.length > 0) {
    console.log(`warnings (${report.warnings.length}):`);
    for (const warning of report.warnings) console.log(`  - ${warning}`);
  }
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) main();
