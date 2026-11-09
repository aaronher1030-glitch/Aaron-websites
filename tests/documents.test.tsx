import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DocumentList } from "../src/components/DocumentList";
import { resetDocumentCacheForTests } from "../src/lib/useDocuments";
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
  // The per-folder promise cache is module-level and outlives each render;
  // clear it so one test's stubbed payload can never leak into the next.
  resetDocumentCacheForTests();
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
  // The published caption verbatim: the live page reads July 28, not July 26.
  expect(screen.getByText("as of July 28, 2026")).toBeInTheDocument();
  expect(screen.getByText(/Samantha C\. De Venecia/)).toBeInTheDocument();
});

test("a failed document listing offers Retry and the Drive fallback", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
  vi.stubGlobal("fetch", fetchMock);

  await act(async () => {
    render(<DocumentList folder="finance" fallbackUrl="https://drive.google.com/drive/folders/x" />);
  });

  expect(await screen.findByText(/documents are unavailable/i)).toBeInTheDocument();
  const retry = screen.getByRole("button", { name: "Retry" });
  expect(screen.getByRole("link", { name: /open the drive folder/i })).toHaveAttribute(
    "href",
    "https://drive.google.com/drive/folders/x",
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);

  // Retry drops the cached rejection and actually refetches.
  await act(async () => {
    fireEvent.click(retry);
  });
  expect(await screen.findByText(/documents are unavailable/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("document rows show the Drive thumb, extension tag and only documented dates", async () => {
  // The afterEach cache reset guarantees a fresh fetch here, so the row
  // payload below is actually requested instead of replaying an empty slot.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        folders: [],
        files: [
          {
            id: "a",
            name: "Minutes-2026-11-08.pdf",
            mime: "application/pdf",
            modified: "2026-11-08T12:00:00Z",
            thumb: "https://drive.google.com/thumbnail?id=a&sz=w600",
            view: "https://drive.google.com/file/d/a/view",
          },
          {
            id: "b",
            name: "Unsigned-Minutes",
            mime: "application/vnd.google-apps.document",
            modified: null,
            thumb: "",
            view: "https://drive.google.com/file/d/b/view",
          },
        ],
        fetchedAt: "2026-11-08T12:00:00Z",
      }),
    }),
  );
  await act(async () => {
    render(<DocumentList folder="notices" fallbackUrl="https://drive.google.com/drive/folders/y" />);
  });
  const rows = screen.getAllByRole("link");
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveAttribute("href", "https://drive.google.com/file/d/a/view");
  expect(rows[0]).toHaveAttribute("target", "_blank");
  expect(rows[0].getAttribute("rel")).toContain("noreferrer");
  // Scoped to the tag: the plate fallback repeats the type as its label.
  expect(rows[0].querySelector(".doc-row__tag")).toHaveTextContent("PDF");
  expect(rows[1].querySelector(".doc-row__tag")).toHaveTextContent("DOC");
  // en-PH with day/month/year components; the undated file invents nothing.
  expect(screen.getByText("November 8, 2026")).toBeInTheDocument();
  expect(document.querySelectorAll(".doc-row__date")).toHaveLength(1);
  expect(rows[0].querySelector("img")).toHaveAttribute(
    "src",
    "https://drive.google.com/thumbnail?id=a&sz=w600",
  );
  expect(rows[1].querySelector("img")).toBeNull();
  expect(rows[1].querySelector(".doc-plate")).not.toBeNull();
});
