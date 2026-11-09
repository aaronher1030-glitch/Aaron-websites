import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DocumentList } from "../src/components/DocumentList";
import Finance from "../src/pages/Finance";
import Transparency from "../src/pages/Transparency";

// The Drive proxy is stubbed for every test so each DocumentList settles on
// the empty payload instead of rejecting against jsdom's absent API server.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ folders: [], files: [], fetchedAt: "" }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("a document folder with no files shows the empty state and fallback", async () => {
  render(<DocumentList folder="finance" fallbackUrl="https://drive.google.com/drive/folders/x" />);
  expect(await screen.findByText(/no documents in this folder yet/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /open the drive folder/i })).toBeInTheDocument();
});

test("transparency switches tabs by keyboard", async () => {
  // DocumentList's stubbed fetch settles asynchronously; flushing the render
  // (and the post-interaction settle) inside async act keeps the output free
  // of unwrapped-update warnings, per the Task 6 lesson.
  await act(async () => {
    render(<MemoryRouter><Transparency /></MemoryRouter>);
  });
  const tab = screen.getByRole("tab", { name: "Elections" });
  await act(async () => {
    tab.focus();
    fireEvent.keyDown(tab, { key: "ArrowRight" });
  });
  expect(screen.getByRole("tab", { name: "Project Proposals" })).toHaveAttribute("aria-selected", "true");
  // The roving model moves DOM focus with the selection, not just the state.
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Project Proposals" }));
});

test("finance prints the published figures", async () => {
  await act(async () => {
    render(<MemoryRouter><Finance /></MemoryRouter>);
  });
  expect(screen.getByText("₱13,327.90")).toBeInTheDocument();
  expect(screen.getByText("26")).toBeInTheDocument();
  expect(screen.getByText("10")).toBeInTheDocument();
  expect(screen.getByText(/Samantha C\. De Venecia/)).toBeInTheDocument();
});