import { OFFICIAL_AMO_PROBLEMS } from "./amoPapers";
import raw from "./problems.json";
import { PROOF_PROBLEMS } from "./proofs";
import { SKILLS, SKILL_BY_NAME, SKILL_BY_SLUG } from "./skills";
import type { Difficulty, Domain, Problem } from "./types";

const bank = (raw as unknown as Problem[]).map((p) => ({
  ...p,
  source: p.source ?? "Lemma original bank",
  collection: p.collection ?? ("original" as const),
}));

export const PROBLEMS: Problem[] = [
  ...bank,
  ...PROOF_PROBLEMS.map((p) => ({ ...p, collection: "original" as const })),
  ...OFFICIAL_AMO_PROBLEMS,
];

export const PROBLEM_BY_ID = new Map(PROBLEMS.map((p) => [p.id, p]));
export const SKILLS_LIST = SKILLS;
export { SKILL_BY_NAME, SKILL_BY_SLUG };

export const QUESTION_COUNT = PROBLEMS.length;

export const DOMAIN_COUNTS = PROBLEMS.reduce<Record<Domain, number>>(
  (acc, p) => {
    acc[p.domain] += 1;
    return acc;
  },
  { Algebra: 0, "Number Theory": 0, Combinatorics: 0, Geometry: 0 },
);

export const SKILL_COUNTS = PROBLEMS.reduce<Record<string, number>>((acc, p) => {
  acc[p.skill] = (acc[p.skill] ?? 0) + 1;
  return acc;
}, {});

export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  Challenge: 3,
};

export function skillFor(problem: Problem) {
  return SKILL_BY_NAME.get(problem.skill);
}

export function relatedProblems(problem: Problem, limit = 3): Problem[] {
  const sameSkill = PROBLEMS.filter(
    (p) => p.id !== problem.id && p.skill === problem.skill,
  );
  const sameDomain = PROBLEMS.filter(
    (p) => p.id !== problem.id && p.domain === problem.domain && p.skill !== problem.skill,
  );
  return [...sameSkill, ...sameDomain].slice(0, limit);
}

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .replace(/[,\s$]/g, "")
    .replace(/[−–]/g, "-")
    .replace(/^\+/, "");
}

function parseNumeric(value: string): number | null {
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  const fraction = /^(-?\d+)\/(\d+)$/.exec(value);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator !== 0) return Number(fraction[1]) / denominator;
  }
  return null;
}

export function isCorrect(problem: Problem, value: string): boolean {
  if (problem.type === "proof") return true;
  const normalized = normalizeAnswer(value);
  if (problem.type === "mc") return normalized.toUpperCase() === problem.answer;
  const given = parseNumeric(normalized);
  const expected = parseNumeric(normalizeAnswer(problem.answer));
  if (given === null || expected === null) return normalized === normalizeAnswer(problem.answer);
  return Math.abs(given - expected) < 1e-9;
}

export function answerLabel(problem: Problem): string {
  if (problem.type === "mc") {
    const index = problem.answer.charCodeAt(0) - 65;
    const choice = problem.choices?.[index];
    return choice ? `${problem.answer}. ${choice}` : problem.answer;
  }
  if (problem.type === "proof") return "Model proof";
  return problem.answer;
}

export function choiceLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : (pluralForm ?? singular + "s")}`;
}
