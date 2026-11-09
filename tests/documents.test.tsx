import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { DocumentList } from "../src/components/DocumentList";
import { GPOA_FILE, documentsFor } from "../src/lib/driveSnapshot";
import Finance from "../src/pages/Finance";
import Transparency from "../src/pages/Transparency";

test("a document folder with no files shows the empty state and fallback", () => {
  render(<DocumentList folder="memorandums" fallbackUrl="https://drive.google.com/drive/folders/x" />);
  expect(screen.getByText(/no documents in this folder yet/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /open the drive folder/i })).toHaveAttribute(
    "href",
    "https://drive.google.com/drive/folders/x",
  );
});

test("transparency switches tabs by keyboard", () => {
  render(<MemoryRouter><Transparency /></MemoryRouter>);
  const tab = screen.getByRole("tab", { name: "Elections" });
  tab.focus();
  fireEvent.keyDown(tab, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: "Project Proposals" })).toHaveAttribute("aria-selected", "true");
  // The roving model moves DOM focus with the selection, not just the state.
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Project Proposals" }));
});

test("the General Plan of Action opens the document itself", () => {
  render(<MemoryRouter><Transparency /></MemoryRouter>);
  if (GPOA_FILE) {
    expect(screen.getByRole("link", { name: /open the plan/i })).toHaveAttribute(
      "href",
      GPOA_FILE.view,
    );
  }
});

test("finance prints the published figures", () => {
  render(<MemoryRouter><Finance /></MemoryRouter>);
  expect(screen.getByText("₱13,327.90")).toBeInTheDocument();
  expect(screen.getByText("26")).toBeInTheDocument();
  expect(screen.getByText("10")).toBeInTheDocument();
  // The published caption verbatim: the live page reads July 28, not July 26.
  expect(screen.getByText("as of July 28, 2026")).toBeInTheDocument();
  expect(screen.getByText(/Samantha C\. De Venecia/)).toBeInTheDocument();
});

test("document rows come from the snapshot with Drive links, tags and no invented dates", () => {
  render(<DocumentList folder="minutes" fallbackUrl="https://drive.google.com/drive/folders/y" />);
  const files = documentsFor("minutes");
  const rows = screen.getAllByRole("link");
  expect(rows).toHaveLength(files.length);
  for (const row of rows) {
    expect(row.getAttribute("href")).toMatch(/^https:\/\/drive\.google\.com\/file\/d\//);
    expect(row).toHaveAttribute("target", "_blank");
    expect(row.getAttribute("rel")).toContain("noreferrer");
  }
  expect(rows[0].querySelector(".doc-row__tag")).toHaveTextContent("DOCX");
  // The listing prints only "Jun 5"; without a year the row invents no date.
  expect(document.querySelectorAll(".doc-row__date")).toHaveLength(0);
  expect(screen.getByText(/snapshot of the public drive folder/i)).toBeInTheDocument();
});
