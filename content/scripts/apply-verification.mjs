/**
 * Apply blind verification results (and adjudications) to the candidate bank.
 *
 * Safety rules:
 *  - refuses to run without the full 22-batch result set unless --allow-partial;
 *  - publishes only items whose blind answer matches the source key, or whose
 *    adjudicator confirmed one of those two letters (never a third letter);
 *  - treats `ambiguous` as true for boolean true and the string "true";
 *  - strips every explanation source before choosing one, so a commentary-only
 *    solver answer falls through to the source explanation;
 *  - reads adjudicator answers from results/adjudication-NN.json only — the
 *    adjudication/ directory holds prompts, never answers;
 *  - writes a ledger (with candidate flags), an audit summary, and a *staged*
 *    published bank (content/verification/published.json). validate.mjs is the
 *    only script that writes src/data/questions.json, and only after re-checking
 *    everything.
 *
 * Run with: npm run content:apply [-- --allow-partial]
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  claimedKeyFlags,
  isAmbiguous,
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

  // Adjudicator answers live next to the blind results as
  // results/adjudication-NN.json. The prompt directory only ever holds the
  // hand-off (no answers), so it is never read here.
  const adjudicationFiles = existsSync(RESULTS_DIR)
    ? readdirSync(RESULTS_DIR)
        .filter((name) => /^adjudication-\d+\.json$/.test(name))
        .sort()
        .map((name) => join(RESULTS_DIR, name))
    : [];
  const adjudicatedById = new Map();
  for (const file of adjudicationFiles) {
    const parsed = readJson(file);
    if (!Array.isArray(parsed)) fail(`${file} must contain a JSON array`);
    for (const row of parsed) {
      if (!row || typeof row.id !== "string") continue;
      adjudicatedById.set(row.id, row);
    }
  }

  if (existsSync(ADJ_DIR)) {
    const leaked = readdirSync(ADJ_DIR).filter((name) => {
      if (!name.endsWith(".json") || name === "manifest.json") return false;
      try {
        const rows = readJson(join(ADJ_DIR, name));
        return Array.isArray(rows) && rows.some((row) => row && typeof row === "object" && "answer" in row);
      } catch {
        return false;
      }
    });
    if (leaked.length > 0) {
      console.warn(
        `apply-verification: ${ADJ_DIR} contains what look like adjudicator answers ` +
          `(${leaked.slice(0, 3).join(", ")}); answers in the prompt directory are ignored. ` +
          `Save them to ${RESULTS_DIR}/adjudication-NN.json instead.`,
      );
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
    const flags = Array.isArray(candidate.flags) ? candidate.flags : [];

    // I3: `ambiguous` counts as true for boolean true and the string "true"
    // (any case). A string would otherwise slip past the publication gate.
    const blindAmbiguous = isAmbiguous(blind?.ambiguous);
    const adjudicatedAmbiguous = isAmbiguous(adjudged?.ambiguous);

    const blindAnswer = blind !== undefined && validLetter(blind.answer) ? blind.answer : null;
    const blindValid = blindAnswer !== null && !blindAmbiguous;
    const blindAgrees = blindValid && sourceKey !== "" && blindAnswer === sourceKey;

    const adjudicatedAnswer =
      adjudged !== undefined && validLetter(adjudged.answer) ? adjudged.answer : null;
    // I2: an adjudication may only confirm the source key or the blind answer.
    // A third letter would publish an answer nobody actually endorsed. A blind
    // row must still exist: adjudication never substitutes for verification.
    const adjudicatedConfirms =
      adjudicatedAnswer !== null &&
      !adjudicatedAmbiguous &&
      blind !== undefined &&
      (adjudicatedAnswer === sourceKey || adjudicatedAnswer === blindAnswer);
    const adjudicatedDisagreesWithBoth =
      adjudicatedAnswer !== null &&
      !adjudicatedAmbiguous &&
      blindAnswer !== null &&
      sourceKey !== "" &&
      adjudicatedAnswer !== sourceKey &&
      adjudicatedAnswer !== blindAnswer;

    let status = "flagged";
    let answerLetter = null;
    let answerSource = "";
    let issue = "";

    if (adjudicatedConfirms) {
      answerLetter = adjudicatedAnswer;
      status = adjudged.status === "flagged" ? "flagged" : "verified";
      answerSource = "adjudicated";
      if (status === "flagged") issue = "adjudicator flagged this item";
    } else if (blindAgrees) {
      answerLetter = sourceKey;
      status = "verified";
      answerSource = "blind";
    } else if (adjudicatedDisagreesWithBoth) {
      issue = "adjudicator disagrees with both";
    } else if (!blind) {
      issue =
        adjudicatedAnswer !== null
          ? `missing blind result; adjudication (${adjudicatedAnswer}) cannot publish without a blind answer`
          : "missing blind result and no adjudication";
    } else if (blindAmbiguous) {
      issue = "blind result marked ambiguous and no (valid) adjudication";
    } else if (!validLetter(blind.answer)) {
      issue = `invalid blind answer ${JSON.stringify(blind.answer)} and no (valid) adjudication`;
    } else if (adjudged !== undefined && validLetter(adjudged.answer) && adjudicatedAmbiguous) {
      issue = "adjudication marked ambiguous";
    } else {
      issue = `source key ${sourceKey} disagrees with blind ${blind.answer} and no (valid) adjudication`;
    }

    // I1: strip every candidate source first, then take the first non-empty one.
    // Stripping after the choice (the old behaviour) could empty the selected
    // text and skip the fallback entirely.
    const clean = (value) =>
      typeof value === "string" ? stripMetaCommentary(value.trim()) : "";
    const blindClean = clean(blind?.cleanExplanation);
    const adjudicatedClean = clean(adjudged?.cleanExplanation);
    const sourceClean = clean(candidate.explanation);
    // Keep the published reasoning aligned with the published answer: when the
    // adjudicator changed the letter, prefer the adjudicator's solution.
    const adjudicationChangedAnswer =
      answerSource === "adjudicated" && blindAnswer !== adjudicatedAnswer;
    const explanation = adjudicationChangedAnswer
      ? adjudicatedClean || blindClean || sourceClean
      : blindClean || adjudicatedClean || sourceClean;
    if (!explanation && status === "verified") {
      status = "flagged";
      answerSource = "";
      issue = "explanation empty after removing key commentary";
    }

    const answerIndex = answerLetter === null ? -1 : KEY_LETTERS.indexOf(answerLetter);
    if (status === "verified" && answerIndex < 0) {
      status = "flagged";
      issue = "verified without a usable answer letter";
    }

    const noteParts = [];
    if (adjudicatedConfirms) {
      if (adjudicatedAnswer !== sourceKey || adjudicatedAnswer !== blindAnswer) {
        noteParts.push(
          `source ${sourceKey || "missing"}; blind ${blindAnswer ?? "missing"}; ` +
            `adjudicated ${adjudicatedAnswer}`,
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
      blindAmbiguous,
      adjudicated: adjudged?.answer ?? null,
      status,
      answer: answerLetter,
      published: isPublished,
      // I5: keep the candidate flags so claimed-key conflicts stay visible.
      flags,
      ...(blind?.ambiguous !== undefined && typeof blind.ambiguous !== "boolean"
        ? { blindAmbiguousRaw: blind.ambiguous }
        : {}),
      ...(adjudicatedDisagreesWithBoth ? { adjudicatorDisagreesWithBoth: true } : {}),
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
    // I5: candidates whose paper claims a different key; these are always sent
    // to adjudication and stay visible at publish time.
    claimedKeyConflicts: ledger.filter(
      (row) => claimedKeyFlags(row.flags).length > 0,
    ).length,
    claimedKeyConflictsPublished: ledger.filter(
      (row) => row.published && claimedKeyFlags(row.flags).length > 0,
    ).length,
    adjudicatorDisagreements: ledger.filter((row) => row.adjudicatorDisagreesWithBoth).length,
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
      `${audit.missingBlind} missing blind, ${audit.adjudicated} adjudicated, ` +
      `${audit.claimedKeyConflicts} claimed-key conflict(s), ` +
      `${audit.adjudicatorDisagreements} adjudicator disagreement(s)`,
  );
  console.log(`apply-verification: staged ${STAGED_BANK}; run content:validate to publish`);
}

main();
