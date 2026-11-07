import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ThemeToggle } from "../src/components/ThemeToggle";
import { resolveTheme } from "../src/theme";

const STORAGE_KEY = "chembank:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Stubs only the browser boundary; src/theme.ts itself is never mocked. */
function stubPrefersDark(dark: boolean) {
  const matchMedia = vi.fn((query: string) => ({
    matches: dark && query === DARK_QUERY,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
  vi.stubGlobal("matchMedia", matchMedia);
  return matchMedia;
}

function resetDocumentTheme() {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
}

beforeEach(() => {
  window.localStorage.clear();
  resetDocumentTheme();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  resetDocumentTheme();
});

test("clicking the toggle flips the applied theme, persists it, and tracks aria-pressed", async () => {
  stubPrefersDark(false);
  const user = userEvent.setup();
  render(<ThemeToggle />);

  const toggle = screen.getByRole("button", { name: /theme/i });
  expect(toggle).toHaveAttribute("aria-pressed", "false");

  await user.click(toggle);
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  expect(toggle).toHaveAttribute("aria-pressed", "true");

  await user.click(toggle);
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
  expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("with empty storage, resolveTheme follows the system preference", () => {
  const matchMedia = stubPrefersDark(true);
  expect(resolveTheme()).toBe("dark");
  expect(matchMedia).toHaveBeenCalledWith(DARK_QUERY);

  stubPrefersDark(false);
  expect(resolveTheme()).toBe("light");
});

test("a stored choice outranks the system preference in resolveTheme", () => {
  window.localStorage.setItem(STORAGE_KEY, "light");
  stubPrefersDark(true);
  expect(resolveTheme()).toBe("light");

  window.localStorage.setItem(STORAGE_KEY, "dark");
  stubPrefersDark(false);
  expect(resolveTheme()).toBe("dark");
});

test("the toggle starts pressed when the stored theme is dark", () => {
  window.localStorage.setItem(STORAGE_KEY, "dark");
  stubPrefersDark(false);
  render(<ThemeToggle />);

  expect(screen.getByRole("button", { name: /theme/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
