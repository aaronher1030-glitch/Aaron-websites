import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { CHAPTER_NOTES } from "../src/data/notes";
import { LAB_TECHNIQUES } from "../src/data/lab";

vi.setConfig({ testTimeout: 60000 });

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

test.each([
  ["/notes", /Chapter notes/i],
  ["/lab", /Lab bench/i],
  ["/formulas", /Formula sheet/i],
  ["/periodic-table", /Periodic table/i],
  ["/guide", /PNCO guide/i],
  ["/about", /Methodology and corrections/i],
  ["/not-a-real-route", /Page not found/i],
])("renders %s with its page heading", (path, heading) => {
  renderAt(path);
  expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
});

test("a public route publishes its title, description, canonical URL, and index directive", () => {
  renderAt("/formulas");

  expect(document.title).toBe("Formula sheet · ChemBank");
  expect(
    document.head.querySelector('meta[name="description"]')?.getAttribute("content"),
  ).toMatch(/printable PNCO formula sheet/i);
  expect(
    document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
  ).toBe("https://chembank.pages.dev/formulas");
  expect(
    document.head.querySelector('meta[name="robots"]')?.getAttribute("content"),
  ).toBe("index,follow");
});

test("a working route stays out of search results", () => {
  renderAt("/progress");

  expect(document.title).toBe("Progress · ChemBank");
  expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  expect(
    document.head.querySelector('meta[name="robots"]')?.getAttribute("content"),
  ).toBe("noindex,follow");
});

test("note cards open the structured chapter briefing", () => {
  const note = CHAPTER_NOTES[0];
  renderAt(`/notes/${note.slug}`);

  expect(
    screen.getByRole("heading", { level: 1, name: note.title }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /The big idea/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Traps/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Checklist/i })).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: new RegExp(`Drill chapter ${note.chapter}`, "i") }),
  ).toHaveAttribute("href", `/practice?preset=chapter&chapter=${note.chapter}`);
});

test("a missing note slug falls back to the not-found page", () => {
  renderAt("/notes/no-such-note");
  expect(
    screen.getByRole("heading", { level: 1, name: /Page not found/i }),
  ).toBeInTheDocument();
});

test("lab cards open the bench briefing with procedure and traps", () => {
  const technique = LAB_TECHNIQUES[0];
  renderAt(`/lab/${technique.slug}`);

  expect(
    screen.getByRole("heading", { level: 1, name: technique.title }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Procedure/i })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /What precision can you claim/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Start lab drill/i }),
  ).toHaveAttribute("href", "/practice?preset=lab");
});

test("periodic table selects elements, links to the bank, and moves focus with arrows", async () => {
  const user = userEvent.setup();
  renderAt("/periodic-table");

  const oxygen = screen.getByRole("button", {
    name: /Oxygen, symbol O, atomic number 8/i,
  });
  expect(oxygen).toHaveAttribute("aria-pressed", "false");
  await user.click(oxygen);

  expect(oxygen).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("heading", { name: "Oxygen" })).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Questions on atomic structure/i }),
  ).toHaveAttribute("href", "/bank?topic=Atomic%20structure");

  const carbon = screen.getByRole("button", { name: /Carbon, symbol C, atomic number 6/i });
  const nitrogen = screen.getByRole("button", {
    name: /Nitrogen, symbol N, atomic number 7/i,
  });
  carbon.focus();
  fireEvent.keyDown(carbon, { key: "ArrowRight" });
  expect(document.activeElement).toBe(nitrogen);
});

test("guide lists the disclaimer and source links", () => {
  renderAt("/guide");

  expect(screen.getAllByText(/last verified/i).length).toBeGreaterThan(0);
  expect(
    screen.getByRole("heading", {
      name: /Independent and not affiliated with any organizer/i,
    }),
  ).toBeInTheDocument();

  const sources = screen
    .getAllByRole("link", { name: /PFCS|IChO|UP Manila|Ateneo/i })
    .filter((link) => link.getAttribute("href")?.startsWith("http"));
  expect(sources.length).toBeGreaterThan(0);
  for (const source of sources) {
    expect(source).toHaveAttribute("target", "_blank");
    expect(source).toHaveAttribute("rel", "noreferrer");
  }
});

test("about exposes the audit counts and corrections anchor", () => {
  renderAt("/about");

  const corrections = document.getElementById("corrections");
  expect(corrections).not.toBeNull();
  expect(within(corrections as HTMLElement).getByText(/published items carry/i)).toBeInTheDocument();
  expect(screen.getAllByText("430").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(/Free, independent, and unofficial/i)).toBeInTheDocument();
});

test("overflow navigation reaches the reference pages", () => {
  renderAt("/");

  const menu = screen.getByRole("navigation", { name: /reference/i });
  expect(within(menu).getByRole("link", { name: /Formulas/i })).toHaveAttribute(
    "href",
    "/formulas",
  );
  expect(
    within(menu).getByRole("link", { name: /Periodic table/i }),
  ).toHaveAttribute("href", "/periodic-table");
  expect(within(menu).getByRole("link", { name: /PNCO guide/i })).toHaveAttribute(
    "href",
    "/guide",
  );
  expect(within(menu).getByRole("link", { name: /About/i })).toHaveAttribute(
    "href",
    "/about",
  );
});
