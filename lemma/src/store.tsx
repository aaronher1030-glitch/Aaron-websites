import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PROBLEMS, SKILLS_LIST } from "./data/problems";
import type { Attempt, Drill, Problem, Store, Theme } from "./data/types";
import { dayKey, latestAttemptMap, streakDays } from "./lib/drill";

const STORAGE_KEY = "lemma:v1";

function freshStore(): Store {
  return {
    attempts: [],
    drills: [],
    stashed: [],
    theme: "auto",
    createdAt: Date.now(),
  };
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (!Array.isArray(parsed.attempts) || !Array.isArray(parsed.drills)) return freshStore();
    return {
      attempts: parsed.attempts.filter(
        (a): a is Attempt =>
          Boolean(a) &&
          typeof a.qid === "string" &&
          typeof a.correct === "boolean" &&
          typeof a.ts === "number",
      ),
      drills: parsed.drills.filter((d): d is Drill => Boolean(d) && typeof d.id === "string"),
      stashed: Array.isArray(parsed.stashed) ? parsed.stashed.filter((s) => typeof s === "string") : [],
      theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "auto",
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : Date.now(),
    };
  } catch {
    return freshStore();
  }
}

export interface DomainStat {
  domain: string;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
}

export interface SkillStat {
  skill: string;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
  avgTime: number | null;
}

export interface DifficultyStat {
  difficulty: string;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
}

export interface Stats {
  totalProblems: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
  avgTime: number | null;
  streak: number;
  solved: number;
  byDomain: DomainStat[];
  bySkill: SkillStat[];
  byDifficulty: DifficultyStat[];
  recent: Array<{ attempt: Attempt; problem: Problem }>;
  today: number;
}

interface StoreContextValue {
  state: Store;
  latest: Map<string, Attempt>;
  stats: Stats;
  setTheme: (theme: Theme) => void;
  recordAttempt: (attempt: Omit<Attempt, "ts">) => void;
  recordAttempts: (attempts: Array<Omit<Attempt, "ts">>) => void;
  toggleStash: (qid: string) => void;
  saveDrill: (drill: Drill) => void;
  deleteDrill: (id: string) => void;
  clearHistory: () => void;
  exportData: () => void;
  importData: (json: string) => boolean;
  resetTheme: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Store>(() => loadStore());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable */
    }
  }, [state]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = state.theme === "auto" ? (media.matches ? "dark" : "light") : state.theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [state.theme]);

  const setTheme = useCallback((theme: Theme) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const recordAttempts = useCallback((incoming: Array<Omit<Attempt, "ts">>) => {
    if (incoming.length === 0) return;
    const ts = Date.now();
    setState((prev) => ({
      ...prev,
      attempts: [...prev.attempts, ...incoming.map((attempt, index) => ({ ...attempt, ts: ts + index }))],
    }));
  }, []);

  const recordAttempt = useCallback(
    (attempt: Omit<Attempt, "ts">) => {
      recordAttempts([attempt]);
    },
    [recordAttempts],
  );

  const toggleStash = useCallback((qid: string) => {
    setState((prev) => ({
      ...prev,
      stashed: prev.stashed.includes(qid)
        ? prev.stashed.filter((id) => id !== qid)
        : [...prev.stashed, qid],
    }));
  }, []);

  const saveDrill = useCallback((drill: Drill) => {
    setState((prev) => {
      const index = prev.drills.findIndex((item) => item.id === drill.id);
      const drills = index >= 0 ? prev.drills.map((item) => (item.id === drill.id ? drill : item)) : [drill, ...prev.drills];
      return { ...prev, drills };
    });
  }, []);

  const deleteDrill = useCallback((id: string) => {
    setState((prev) => ({ ...prev, drills: prev.drills.filter((drill) => drill.id !== id) }));
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, attempts: [], drills: [], stashed: [] }));
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lemma-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as Partial<Store>;
      if (!Array.isArray(parsed.attempts) || !Array.isArray(parsed.drills)) return false;
      setState({
        attempts: parsed.attempts,
        drills: parsed.drills,
        stashed: Array.isArray(parsed.stashed) ? parsed.stashed : [],
        theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "auto",
        createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetTheme = useCallback(() => setTheme("auto"), [setTheme]);

  const latest = useMemo(() => latestAttemptMap(state), [state]);

  const stats = useMemo<Stats>(() => {
    const byDomain = SKILLS_LIST.reduce<Record<string, DomainStat>>((acc, skill) => {
      if (!acc[skill.domain]) {
        acc[skill.domain] = {
          domain: skill.domain,
          total: 0,
          attempted: 0,
          correct: 0,
          accuracy: null,
        };
      }
      return acc;
    }, {});
    for (const problem of PROBLEMS) {
      byDomain[problem.domain].total += 1;
    }
    for (const problem of PROBLEMS) {
      const attempt = latest.get(problem.id);
      if (!attempt) continue;
      const row = byDomain[problem.domain];
      row.attempted += 1;
      if (attempt.correct) row.correct += 1;
    }
    for (const row of Object.values(byDomain)) {
      row.accuracy = row.attempted > 0 ? Math.round((row.correct / row.attempted) * 100) : null;
    }

    const bySkill = SKILLS_LIST.map<SkillStat>((skill) => {
      const problems = PROBLEMS.filter((p) => p.skill === skill.name);
      let attempted = 0;
      let correct = 0;
      let timeTotal = 0;
      let timeCount = 0;
      for (const problem of problems) {
        const attempt = latest.get(problem.id);
        if (!attempt) continue;
        attempted += 1;
        if (attempt.correct) correct += 1;
        if (attempt.elapsedSec > 0) {
          timeTotal += attempt.elapsedSec;
          timeCount += 1;
        }
      }
      return {
        skill: skill.name,
        total: problems.length,
        attempted,
        correct,
        accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : null,
        avgTime: timeCount > 0 ? timeTotal / timeCount : null,
      };
    });

    const byDifficulty = ["Easy", "Medium", "Hard", "Challenge"].map<DifficultyStat>((difficulty) => {
      const problems = PROBLEMS.filter((p) => p.difficulty === difficulty);
      let attempted = 0;
      let correct = 0;
      for (const problem of problems) {
        const attempt = latest.get(problem.id);
        if (!attempt) continue;
        attempted += 1;
        if (attempt.correct) correct += 1;
      }
      return {
        difficulty,
        total: problems.length,
        attempted,
        correct,
        accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : null,
      };
    });

    let correct = 0;
    let timeTotal = 0;
    let timeCount = 0;
    for (const attempt of latest.values()) {
      if (attempt.correct) correct += 1;
      if (attempt.elapsedSec > 0) {
        timeTotal += attempt.elapsedSec;
        timeCount += 1;
      }
    }

    const today = dayKey(Date.now());
    const recent = [...state.attempts]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 12)
      .map((attempt) => {
        const problem = PROBLEMS.find((p) => p.id === attempt.qid);
        return problem ? { attempt, problem } : null;
      })
      .filter((row): row is { attempt: Attempt; problem: Problem } => Boolean(row));

    return {
      totalProblems: PROBLEMS.length,
      attempted: latest.size,
      correct,
      accuracy: latest.size > 0 ? Math.round((correct / latest.size) * 100) : null,
      avgTime: timeCount > 0 ? timeTotal / timeCount : null,
      streak: streakDays(state),
      solved: [...latest.values()].filter((a) => a.correct).length,
      byDomain: Object.values(byDomain),
      bySkill,
      byDifficulty,
      recent,
      today: state.attempts.filter((a) => dayKey(a.ts) === today).length,
    };
  }, [latest, state]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      latest,
      stats,
      setTheme,
      recordAttempt,
      recordAttempts,
      toggleStash,
      saveDrill,
      deleteDrill,
      clearHistory,
      exportData,
      importData,
      resetTheme,
    }),
    [
      state,
      latest,
      stats,
      setTheme,
      recordAttempt,
      recordAttempts,
      toggleStash,
      saveDrill,
      deleteDrill,
      clearHistory,
      exportData,
      importData,
      resetTheme,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
