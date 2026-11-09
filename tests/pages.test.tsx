import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ALBUM_YEARS, REPORT_FILES } from "../src/lib/driveSnapshot";
import Home from "../src/pages/Home";
import Accomplishments from "../src/pages/Accomplishments";
import ActivityPage from "../src/pages/ActivityPage";
import About from "../src/pages/About";
import Feedback from "../src/pages/Feedback";
import NotFound from "../src/pages/NotFound";
import Photos from "../src/pages/Photos";

test("Home names the government once and features INKantations", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  // The hero wordmark stacks its words with <br>, so textContent carries no
  // spaces; \s* keeps the assertion on the visible text without depending on
  // line-break whitespace.
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Supreme\s*Secondary\s*Learner\s*Government/i);
  // Home renders three "Read more" bars (latest, about intro, mandate), so a
  // singular getByRole would throw; the footer lives in the layout test.
  expect(screen.getAllByRole("link", { name: /Read more/i })).toHaveLength(3);
  expect(screen.getAllByText(/INKantations/i).length).toBeGreaterThan(0);
});

test("accomplishments render every title, the reports and detail links", () => {
  render(<MemoryRouter><Accomplishments /></MemoryRouter>);
  expect(screen.getByRole("heading", { level: 1, name: "Accomplishments" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /INKantations/i }).length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: /Read more accomplishment reports/i })).toHaveAttribute("href", expect.stringContaining("1_44iCUzUJAaBi0cc0a7DcpauUPpRJIxj"));
  // The reports come from the same snapshot as the document folders.
  if (REPORT_FILES[0]) {
    expect(
      screen.getByRole("link", { name: new RegExp(REPORT_FILES[0].name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }),
    ).toHaveAttribute("href", REPORT_FILES[0].view);
  }
});

test("an unknown activity slug renders not found", () => {
  render(
    <MemoryRouter initialEntries={["/accomplishments/nope"]}>
      <Routes>
        <Route path="/accomplishments/:slug" element={<ActivityPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
});

test("About lists all 27 officers and the objectives", () => {
  render(<MemoryRouter><About /></MemoryRouter>);
  expect(screen.getAllByRole("img", { name: /^Portrait of /i })).toHaveLength(27);
  // Pin the published order: filtering by group must preserve the roster's
  // listed sequence, first officer through last.
  const portraits = screen.getAllByRole("img", { name: /^Portrait of /i });
  expect(portraits[0]).toHaveAttribute("alt", "Portrait of Hon. Rhian Jade L. Castro");
  expect(portraits[26]).toHaveAttribute("alt", "Portrait of Hon. Mira Narciso");
  for (const name of ["Hon. Rhian Jade L. Castro", "Dr. Amparo M. Munoz", "Hon. Mira Narciso"]) {
    expect(screen.getByText(name)).toBeInTheDocument();
  }
  expect(screen.getByRole("heading", { level: 2, name: /Duties, Responsibilities/i })).toBeInTheDocument();
});

test("Feedback embeds the form with a fallback link", () => {
  render(<MemoryRouter><Feedback /></MemoryRouter>);
  expect(screen.getByTitle("BSANHS SSLG feedback form")).toHaveAttribute("src", expect.stringContaining("?embedded=true"));
  expect(screen.getByRole("link", { name: /open it in a new tab/i })).toHaveAttribute("href", expect.stringContaining("docs.google.com/forms"));
});

test("the 404 keeps the layout and offers a way home", () => {
  render(<MemoryRouter><NotFound /></MemoryRouter>);
  expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
});

test("the photos page lists the published Drive album tree", () => {
  render(<MemoryRouter><Photos /></MemoryRouter>);
  const year = ALBUM_YEARS[0];
  if (!year) return; // A snapshot with no albums renders the empty state.
  expect(screen.getByRole("heading", { name: year.name })).toBeInTheDocument();
  const album = year.terms.flatMap((term) => term.albums)[0];
  if (!album) return;
  expect(screen.getByRole("button", { name: new RegExp(album.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeInTheDocument();
});

test("opening an album moves focus into the panel and Escape closes it", () => {
  render(<MemoryRouter><Photos /></MemoryRouter>);
  const album = ALBUM_YEARS[0]?.terms.flatMap((term) => term.albums)[0];
  if (!album) return;
  const card = screen.getByRole("button", { name: new RegExp(album.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") });
  // jsdom's click does not move focus, so focus the trigger explicitly to
  // prove the panel — not the click — moves it.
  card.focus();
  fireEvent.click(card);
  const close = screen.getByRole("button", { name: "Close" });
  expect(document.activeElement).toBe(close);

  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  expect(document.activeElement).toBe(card);
});
