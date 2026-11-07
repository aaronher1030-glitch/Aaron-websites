/**
 * Apply blind verification results (and adjudications) to the candidate bank.
 *
 * Safety rules:
 *  - refuses to run without the full 22-batch result set unless --allow-partial;
 *  - publishes only items whose blind answer matches the source key, or that an
 *    adjudicator resolved with a valid, non-ambiguous answer;
 *  - writes a ledger, an audit summary, and a *staged* published bank
 *    (content/verification/published.json). validate.mjs is the only script
 *    that writes src/data/questions.json, and only after re-checking everything.
 *
 * Run with: npm run content:apply [-- --allow-partial]
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  KEY_LETTERS,
  sha256,
  sourceKeyFor,
  stripMetaCommentary,
} from "./lib.mjs";

const RESULTS_DIR = "content/verification/results";
const ADJ_DIR = "content/verification/adjudication";
const BATCHES_DIR = "content/verification/batches";
const MANIFEST = "content/verification/manifest.json";
const STAGED_BANK = "content/verification/published.json";
const LEDGER = "content/verification/ledger.json";
const AUDIT = "content/audit.json";
const MIN_BATCHES = 22;
const ALLOW_PARTIAL = process.argv.includes("--allow-partial");

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function fail(message) {
  console.error(`apply-verification: ${message}`);
  process.exit(1);
}

function validLetter(value) {
  return typeof value === "string" && KEY_LETTERS.includes(value);
}

function listBlindResultFiles() {
  if (!existsSync(RESULTS_DIR)) return [];
  return readdirSync(RESULTS_DIR)
    .filter((name) => /^batch-\d+\.json$/.test(name))
    .sort();
}

function loadRows(files, { skipAdjudication = false } = {}) {
  const rows = new Map();
  for (const name of files.sort()) {
    if (skipAdjudication && name.startsWith("adjudication")) continue;
    const file = join(RESULTS_DIR, name);
    let parsed;
    try {
      parsed = readJson(file);
    } catch (error) {
      fail(`${file} is not valid JSON (${error.message})`);
    }
    if (!Array.isArray(parsed)) fail(`${file} must contain a JSON array`);
    for (const row of parsed) {
      if (!row || typeof row.id !== "string") continue;
      rows.set(row.id, row);
    }
  }
  return rows;
}

function verifyBatchManifest() {
  if (!existsSync(MANIFEST)) {
    console.warn("apply-verification: no batch manifest found; skipping checksum checks");
    return;
  }
  const manifest = readJson(MANIFEST);
  const candidatesSha = sha256(readFileSync("content/candidates.json", "utf8"));
  if (manifest.candidatesSha256 && manifest.candidatesSha256 !== candidatesSha) {
    fail("content/candidates.json changed since the batches were written; re-run content:merge and content:batches");
  }
  for (const [name, entry] of Object.entries(manifest.files ?? {})) {
    const file = join(BATCHES_DIR, name);
    if (!existsSync(file)) fail(`batch ${name} listed in the manifest is missing`);
    if (sha256(readFileSync(file, "utf8")) !== entry.sha256) {
      fail(`batch ${name} does not match its manifest checksum (stale or tampered)`);
    }
  }
}

function main() {
  const resultFiles = listBlindResultFiles();
  if (resultFiles.length < MIN_BATCHES && !ALLOW_PARTIAL) {
    fail(
      `only ${resultFiles.length} blind batch result file(s) in ${RESULTS_DIR}; ` +
        `${MIN_BATCHES} are required. Nothing was written. ` +
        "Use --allow-partial only for local debugging (unverified items are never published).",
    );
  }
  if (resultFiles.length < MIN_BATCHES) {
    console.warn(
      `apply-verification: --allow-partial with ${resultFiles.length}/${MIN_BATCHES} result files; ` +
        "items without a blind result will be flagged, not published",
    );
  }

  verifyBatchManifest();

  const candidates = readJson("content/candidates.json");
  const manifest = existsSync(MANIFEST) ? readJson(MANIFEST) : null;
  const blindById = loadRows(resultFiles);

  const adjudicationFiles = [];
  if (existsSync(ADJ_DIR)) {
    adjudicationFiles.push(
      ...readdirSync(ADJ_DIR)
        .filter((name) => name.endsWith(".json") && name !== "manifest.json")
        .map((name) => join(ADJ_DIR, name)),
    );
  }
  // Backwards compatibility with the brief's results/adjudication-*.json naming.
  if (existsSync(RESULTS_DIR)) {
    adjudicationFiles.push(
      ...readdirSync(RESULTS_DIR)
        .filter((name) => name.startsWith("adjudication-") && name.endsWith(".json"))
        .map((name) => join(RESULTS_DIR, name)),
    );
  }
  const adjudicatedById = new Map();
  for (const file of adjudicationFiles.sort()) {
    const parsed = readJson(file);
    if (!Array.isArray(parsed)) fail(`${file} must contain a JSON array`);
    for (const row of parsed) {
      if (!row || typeof row.id !== "string") continue;
      adjudicatedById.set(row.id, row);
    }
  }

  const candidateIds = new Set(candidates.map((item) => item.id));
  const extraBlind = [...blindById.keys()].filter((id) => !candidateIds.has(id));
  if (extraBlind.length > 0) {
    console.warn(
      `apply-verification: ${extraBlind.length} blind result id(s) are not candidates ` +
        `(e.g. ${extraBlind.slice(0, 3).join(", ")}); ignored`,
    );
  }

  const ledger = [];
  const published = [];

  for (const candidate of candidates) {
    const sourceKey = validLetter(candidate.sourceKey)
      ? candidate.sourceKey
      : sourceKeyFor(candidate.answer);
    const blind = blindById.get(candidate.id);
    const adjudged = adjudicatedById.get(candidate.id);

    const blindValid =
      blind !== undefined && validLetter(blind.answer) && blind.ambiguous !== true;
    const blindAgrees = blindValid && sourceKey !== "" && blind.answer === sourceKey;

    const adjudgedValid =
      adjudged !== undefined && validLetter(adjudged.answer) && adjudged.ambiguous !== true;

    let status = "flagged";
    let answerLetter = null;
    let answerSource = "";
    let issue = "";

    if (adjudgedValid) {
      // An adjudication always wins when valid (it exists only for disputes or
      // ambiguous blind rows). `status` defaults to verified.
      answerLetter = adjudged.answer;
      status = adjudged.status === "flagged" ? "flagged" : "verified";
      answerSource = "adjudicated";
      if (status === "flagged") issue = "adjudicator flagged this item";
    } else if (blindAgrees) {
      answerLetter = sourceKey;
      status = "verified";
      answerSource = "blind";
    } else if (!blind) {
      issue = "missing blind result and no adjudication";
    } else if (blind.ambiguous === true) {
      issue = "blind result marked ambiguous and no (valid) adjudication";
    } else if (!blindValid) {
      issue = `invalid blind answer ${JSON.stringify(blind.answer)} and no (valid) adjudication`;
    } else {
      issue = `source key ${sourceKey} disagrees with blind ${blind.answer} and no (valid) adjudication`;
    }

    let explanation = "";
    const blindExplanation = typeof blind?.cleanExplanation === "string" ? blind.cleanExplanation.trim() : "";
    const adjudicatedExplanation =
      typeof adjudged?.cleanExplanation === "string" ? adjudged.cleanExplanation.trim() : "";
    if (answerSource === "adjudicated" && blind?.answer !== adjudged?.answer) {
      // Keep the published reasoning consistent with the adjudicated answer.
      explanation = adjudicatedExplanation || blindExplanation;
    } else {
      explanation = blindExplanation || adjudicatedExplanation;
    }
    if (!explanation) explanation = candidate.explanation ?? "";
    explanation = stripMetaCommentary(explanation);
    if (explanation.length === 0 && status === "verified") {
      status = "flagged";
      issue = "explanation empty after removing key commentary";
    }

    const answerIndex = answerLetter === null ? -1 : KEY_LETTERS.indexOf(answerLetter);
    if (status === "verified" && answerIndex < 0) {
      status = "flagged";
      issue = "verified without a usable answer letter";
    }

    const noteParts = [];
    if (adjudgedValid) {
      if (!blind || blind.answer !== adjudged.answer || adjudged.answer !== sourceKey) {
        noteParts.push(
          `source ${sourceKey || "missing"}; blind ${blind?.answer ?? "missing"}; ` +
            `adjudicated ${adjudged.answer}`,
        );
      }
    } else if (blind && sourceKey && blind.answer !== sourceKey) {
      noteParts.push(`source ${sourceKey}; blind ${blind.answer}; no adjudication`);
    }
    const note = noteParts.join("; ") || undefined;

    const isPublished = status === "verified";
    if (isPublished) {
      const record = {
        id: candidate.id,
        domain: candidate.domain,
        topic: candidate.topic,
        difficulty: candidate.difficulty,
        stem: candidate.stem,
        choices: candidate.choices,
        answer: answerIndex,
        explanation,
        source: candidate.source,
        verified: { status: "verified", reviewedAt: "2026-11-07", ...(note ? { note } : {}) },
      };
      if (candidate.chapter != null) record.chapter = candidate.chapter;
      if (candidate.paper) record.paper = candidate.paper;
      if (Array.isArray(candidate.tags) && candidate.tags.length > 0) record.tags = candidate.tags;
      published.push(record);
    }

    ledger.push({
      id: candidate.id,
      sourceKey,
      blind: blind?.answer ?? null,
      blindAmbiguous: blind?.ambiguous === true,
      adjudicated: adjudged?.answer ?? null,
      status,
      answer: answerLetter,
      published: isPublished,
      ...(issue ? { issue } : {}),
    });
  }

  const audit = {
    total: ledger.length,
    candidates: candidates.length,
    published: published.length,
    verified: ledger.filter((row) => row.status === "verified").length,
    flagged: ledger.filter((row) => row.status === "flagged").length,
    corrections: ledger.filter(
      (row) => row.sourceKey && row.blind && row.sourceKey !== row.blind,
    ).length,
    deduped: existsSync("content/merge-report.json")
      ? (readJson("content/merge-report.json").dedupedIds ?? []).length
      : 0,
    batches: manifest?.batches ?? null,
    missingBlind: ledger.filter((row) => row.blind === null).length,
    adjudicated: ledger.filter((row) => row.adjudicated !== null).length,
    publishedByPaper: published.reduce((counts, item) => {
      const key = item.paper ?? "(no paper)";
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}),
  };

  writeFileSync(LEDGER, `${JSON.stringify(ledger, null, 2)}\n`);
  writeFileSync(AUDIT, `${JSON.stringify(audit, null, 2)}\n`);
  writeFileSync(STAGED_BANK, `${JSON.stringify(published, null, 2)}\n`);

  console.log(
    `apply-verification: ${published.length}/${ledger.length} publishable; ` +
      `${audit.flagged} flagged, ${audit.corrections} correction(s), ` +
      `${audit.missingBlind} missing blind, ${audit.adjudicated} adjudicated`,
  );
  console.log(`apply-verification: staged ${STAGED_BANK}; run content:validate to publish`);
}

main();
