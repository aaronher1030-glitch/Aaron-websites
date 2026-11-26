import { DIFFICULTY_RANK, PROBLEMS } from "../data/problems";
import type { Difficulty, Domain, Problem, ProblemType, Store } from "../data/types";
import { latestAttemptMap } from "./drill";

export interface SelectionFilters {
  domains: Domain[];
  skills: string[];
  difficulties: Difficulty[];
  types: ProblemType[];
  unseenOnly?: boolean;
  weakFirst?: boolean;
  balanceDomains?: boolean;
}

export interface SelectionResult {
  problems: Problem[];
  available: number;
  unseenAvailable: number;
}

export function matchesFilters(problem: Problem, filters: SelectionFilters): boolean {
  if (filters.domains.length > 0 && !filters.domains.includes(problem.domain)) return false;
  if (filters.skills.length > 0 && !filters.skills.includes(problem.skill)) return false;
  if (filters.difficulties.length > 0 && !filters.difficulties.includes(problem.difficulty)) return false;
  if (filters.types.length > 0 && !filters.types.includes(problem.type)) return false;
  return true;
}

function shuffle<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function filterPool(filters: SelectionFilters): Problem[] {
  return PROBLEMS.filter((problem) => matchesFilters(problem, filters));
}

export function selectProblems(
  filters: SelectionFilters,
  count: number,
  store: Store,
): SelectionResult {
  const pool = filterPool(filters);
  const latest = latestAttemptMap(store);
  const unseen = pool.filter((p) => !latest.has(p.id));
  const available = pool.length;
  const unseenAvailable = unseen.length;

  let candidates = filters.unseenOnly && unseen.length >= count ? unseen : pool;

  if (filters.weakFirst) {
    const skillRows = new Map<string, { attempted: number; correct: number }>();
    for (const [qid, attempt] of latest) {
      const problem = PROBLEMS.find((p) => p.id === qid);
      if (!problem) continue;
      const row = skillRows.get(problem.skill) ?? { attempted: 0, correct: 0 };
      row.attempted += 1;
      if (attempt.correct) row.correct += 1;
      skillRows.set(problem.skill, row);
    }
    candidates = candidates.slice().sort((a, b) => {
      const aRow = skillRows.get(a.skill);
      const bRow = skillRows.get(b.skill);
      const aAcc = aRow && aRow.attempted > 0 ? aRow.correct / aRow.attempted : 0.5;
      const bAcc = bRow && bRow.attempted > 0 ? bRow.correct / bRow.attempted : 0.5;
      if (aAcc !== bAcc) return aAcc - bAcc;
      const aSeen = latest.has(a.id) ? 1 : 0;
      const bSeen = latest.has(b.id) ? 1 : 0;
      return aSeen - bSeen;
    });
  } else {
    candidates = shuffle(candidates);
  }

  let chosen: Problem[] = [];
  if (filters.balanceDomains) {
    const byDomain = new Map<Domain, Problem[]>();
    for (const problem of candidates) {
      const list = byDomain.get(problem.domain) ?? [];
      list.push(problem);
      byDomain.set(problem.domain, list);
    }
    const domainOrder = shuffle([...byDomain.keys()]);
    let cursor = 0;
    while (chosen.length < count && cursor < 200) {
      let added = false;
      for (const domain of domainOrder) {
        const list = byDomain.get(domain) ?? [];
        const problem = list[cursor];
        if (problem) {
          chosen.push(problem);
          added = true;
          if (chosen.length >= count) break;
        }
      }
      if (!added) break;
      cursor += 1;
    }
  } else {
    chosen = candidates.slice(0, count);
  }

  // Prefer difficulty balance if the caller did not restrict difficulty.
  if (filters.difficulties.length === 0 && chosen.length > 3) {
    chosen = chosen.slice().sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]);
  }

  return { problems: chosen, available, unseenAvailable };
}

export function poolBySkill(skill: string, store: Store): Problem[] {
  const latest = latestAttemptMap(store);
  return PROBLEMS.filter((p) => p.skill === skill).sort((a, b) => {
    const aSeen = latest.has(a.id) ? 1 : 0;
    const bSeen = latest.has(b.id) ? 1 : 0;
    if (aSeen !== bSeen) return aSeen - bSeen;
    return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
  });
}
