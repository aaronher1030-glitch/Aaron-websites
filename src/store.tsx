import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Attempt, Drill, Store } from "./data/types";
import { createDrill as buildDrill } from "./lib/drill";
import { scheduleReview } from "./lib/review";
import {
  applyTheme,
  clearStoredTheme,
  readStoredTheme,
  storeTheme,
  systemTheme,
} from "./theme";

const STORAGE_KEY = "chembank:v1";

export interface StoreApi {
  store: Store;
  recordAttempt: (attempt: Attempt) => void;
  createDrill: (input: {
    name: string;
    mode: "practice" | "timed";
    qids: string[];
    limitSec: number;
  }) => Drill;
  updateDrill: (drill: Drill) => void;
  toggleStash: (qid: string) => void;
  clearReview: (qid: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  reset: () => void;
  setTheme: (theme: Store["theme"]) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function defaultStore(): Store {
  return {
    version: 1,
    attempts: [],
    drills: [],
    review: [],
    stashed: [],
    theme: "auto",
    createdAt: Date.now(),
  };
}

/* The dedicated theme override is the source of truth on load, so a stored
   light/dark choice survives even if the main notebook predates it. */
function hydrateTheme(): Store["theme"] {
  try {
    return readStoredTheme() ?? "auto";
  } catch {
    return "auto";
  }
}

function isValidStore(parsed: unknown): parsed is Store {
  const candidate = parsed as Store | null;
  return (
    candidate?.version === 1 &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.drills) &&
    Array.isArray(candidate.review) &&
    Array.isArray(candidate.stashed)
  );
}

function readStore(): Store {
  try {
    const theme = hydrateTheme();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultStore(), theme };
    const parsed = JSON.parse(raw) as Store;
    if (!isValidStore(parsed)) return { ...defaultStore(), theme };
    return { ...defaultStore(), ...parsed, theme };
  } catch {
    // Private mode, blocked storage, or corrupt JSON: start clean for this visit.
    return defaultStore();
  }
}

function writeStore(store: Store): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Private mode or blocked storage: state still lives in memory for this visit.
    return;
  }
}

/* One delegation point for the theme side effects so setTheme, importData,
   and reset all paint and persist the same way. */
function applyThemeChoice(theme: Store["theme"]): void {
  if (theme === "light" || theme === "dark") {
    applyTheme(theme);
    storeTheme(theme);
  } else {
    clearStoredTheme();
    applyTheme(systemTheme());
  }
}

function sanitizeTheme(theme: unknown): Store["theme"] {
  return theme === "light" || theme === "dark" ? theme : "auto";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(readStore);

  useEffect(() => {
    writeStore(store);
  }, [store]);

  const recordAttempt = useCallback((attempt: Attempt) => {
    setStore((current) => {
      const existing = current.review.find((item) => item.qid === attempt.qid);
      // scheduleReview leaves qid blank for a brand-new item; stamp it from the
      // attempt so a review entry never carries an empty qid in any mode.
      const scheduled = { ...scheduleReview(existing, attempt.correct), qid: attempt.qid };
      const review = existing
        ? current.review.map((item) => (item.qid === attempt.qid ? scheduled : item))
        : [...current.review, scheduled];
      return { ...current, attempts: [...current.attempts, attempt], review };
    });
  }, []);

  const createDrill = useCallback(
    (input: { name: string; mode: "practice" | "timed"; qids: string[]; limitSec: number }) => {
      const drill = buildDrill(input);
      setStore((current) => ({
        ...current,
        drills: [...current.drills, drill],
      }));
      return drill;
    },
    [],
  );

  const updateDrill = useCallback((drill: Drill) => {
    setStore((current) => ({
      ...current,
      drills: current.drills.map((existing) => (existing.id === drill.id ? drill : existing)),
    }));
  }, []);

  const toggleStash = useCallback((qid: string) => {
    setStore((current) => ({
      ...current,
      stashed: current.stashed.includes(qid)
        ? current.stashed.filter((id) => id !== qid)
        : [...current.stashed, qid],
    }));
  }, []);

  const clearReview = useCallback((qid: string) => {
    setStore((current) => ({
      ...current,
      review: current.review.filter((item) => item.qid !== qid),
    }));
  }, []);

  const exportData = useCallback(() => JSON.stringify(store), [store]);

  const importData = useCallback((json: string): boolean => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return false;
    }
    if (!isValidStore(parsed)) return false;
    const next: Store = { ...defaultStore(), ...parsed, theme: sanitizeTheme(parsed.theme) };
    setStore(next);
    applyThemeChoice(next.theme);
    return true;
  }, []);

  const reset = useCallback(() => {
    const fresh = defaultStore();
    setStore(fresh);
    applyThemeChoice(fresh.theme);
  }, []);

  const setTheme = useCallback((theme: Store["theme"]) => {
    applyThemeChoice(theme);
    setStore((current) => ({ ...current, theme }));
  }, []);

  const value = useMemo<StoreApi>(
    () => ({
      store,
      recordAttempt,
      createDrill,
      updateDrill,
      toggleStash,
      clearReview,
      exportData,
      importData,
      reset,
      setTheme,
    }),
    [store, recordAttempt, createDrill, updateDrill, toggleStash, clearReview, exportData, importData, reset, setTheme],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside a StoreProvider");
  }
  return context;
}