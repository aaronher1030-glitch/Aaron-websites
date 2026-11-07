export type Theme = "light" | "dark";

const STORAGE_KEY = "chembank:theme";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStoredTheme(): Theme | null {
  const value = storage()?.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function systemTheme(): Theme {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export function resolveTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", theme === "dark" ? "#121212" : "#f4f1e8");
}

export function storeTheme(theme: Theme): void {
  try {
    storage()?.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
}

export function initTheme(): void {
  applyTheme(resolveTheme());
}
