export const DOMAINS = ["General", "Physical", "Analytical", "Organic", "Laboratory"] as const;
export type Domain = (typeof DOMAINS)[number];

export const DIFFICULTIES = ["Foundation", "Standard", "Olympiad"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SOURCES = ["supplied-paper", "textbook", "mixed", "gap-fill"] as const;
export type SourceKind = (typeof SOURCES)[number];

export type PaperId =
  | "ch1-3-theory"
  | "ch1-3-lab"
  | "ch4-7-theory"
  | "ch4-7-lab"
  | "mixed-practice";

export interface Question {
  id: string;
  domain: Domain;
  chapter?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  topic: string;
  difficulty: Difficulty;
  stem: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  source: SourceKind;
  paper?: PaperId;
  tags?: string[];
  verified: { status: "verified" | "flagged"; reviewedAt: string; note?: string };
  corrections?: string[];
}

export interface Attempt {
  qid: string;
  correct: boolean;
  answer: string;
  ts: number;
  elapsedSec: number;
  mode: "practice" | "timed" | "single";
}

export interface Drill {
  id: string;
  name: string;
  mode: "practice" | "timed";
  qids: string[];
  answers: Record<string, string>;
  checked: Record<string, boolean>;
  flagged: Record<string, boolean>;
  strikes: Record<string, string[]>;
  index: number;
  limitSec: number;
  elapsedSec: number;
  startedAt: number;
  finishedAt?: number;
  done: boolean;
}

export interface ReviewItem {
  qid: string;
  dueAt: number;
  step: number;
  lastSeen: number;
}

export interface Store {
  version: 1;
  attempts: Attempt[];
  drills: Drill[];
  review: ReviewItem[];
  stashed: string[];
  theme: "auto" | "light" | "dark";
  createdAt: number;
}
