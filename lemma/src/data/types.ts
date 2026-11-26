export const DOMAINS = ["Algebra", "Number Theory", "Combinatorics", "Geometry"] as const;
export type Domain = (typeof DOMAINS)[number];

export const DIFFICULTIES = ["Easy", "Medium", "Hard", "Challenge"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type ProblemType = "int" | "mc" | "proof";

export type Collection = "original" | "official";

export interface PaperRef {
  /** Paper identifier, for example `amo-2020`. */
  id: string;
  competition: string;
  year: number;
  day: 1 | 2;
  number: number;
  title: string;
  url: string;
}

export interface Problem {
  id: string;
  domain: Domain;
  skill: string;
  difficulty: Difficulty;
  type: ProblemType;
  stem: string;
  choices?: string[];
  answer: string;
  explanation: string;
  rubric?: string[];
  source?: string;
  sourceUrl?: string;
  collection?: Collection;
  paper?: PaperRef;
}

export interface Skill {
  slug: string;
  name: string;
  domain: Domain;
  code: string;
  formula: string;
  blurb: string;
  bigIdea: string;
  whenToUse: string[];
  traps: string[];
  checklist: string[];
}

export interface Attempt {
  qid: string;
  correct: boolean;
  answer: string;
  ts: number;
  elapsedSec: number;
  mode: "practice" | "timed" | "single" | "proof";
}

export interface Drill {
  id: string;
  name: string;
  mode: "practice" | "timed";
  qids: string[];
  answers: Record<string, string>;
  checked: Record<string, boolean>;
  flagged: Record<string, boolean>;
  grades?: Record<string, "got" | "partial" | "miss">;
  index: number;
  limitSec: number;
  elapsedSec: number;
  startedAt: number;
  finishedAt?: number;
  done: boolean;
}

export type Theme = "auto" | "light" | "dark";

export interface Store {
  attempts: Attempt[];
  drills: Drill[];
  stashed: string[];
  theme: Theme;
  createdAt: number;
}
