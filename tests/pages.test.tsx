import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { PIO_FOLDER_URL } from "../src/config";
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

test("accomplishments render every title and link to detail pages", async () => {
  // useAlbums() settles asynchronously (the fetch rejects with no API server in
  // jsdom); wrapping the render in async act flushes that state update inside
  // act so it does not print an unwrapped-update warning. Assertions are the
  // brief's verbatim.
  await act(async () => {
    render(<MemoryRouter><Accomplishments /></MemoryRouter>);
  });
  expect(screen.getByRole("heading", { level: 1, name: "Accomplishments" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /INKantations/i }).length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: /Read more accomplishment reports/i })).toHaveAttribute("href", expect.stringContaining("1_44iCUzUJAaBi0cc0a7DcpauUPpRJIxj"));
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

test("the album list error names the state and links the public Drive folder", async () => {
  // useAlbums does not cache a rejection (it clears its slot), so this stub
  // reaches the page even though the Accomplishments test above ran first.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
  );
  try {
    await act(async () => {
      render(<MemoryRouter><Photos /></MemoryRouter>);
    });
    // Scoped to the title: the body repeats the phrase ("…are unavailable right now.").
    expect(
      await screen.findByText(/albums are unavailable/i, { selector: ".empty-state__title" }),
    ).toBeInTheDocument();
    // An error with no retry control still has to interrupt a screen reader.
    expect(screen.getByRole("alert")).toHaveTextContent(/albums are unavailable/i);
    expect(screen.getByRole("link", { name: /open the drive folder/i })).toHaveAttribute(
      "href",
      PIO_FOLDER_URL,
    );
  } finally {
    vi.unstubAllGlobals();
  }
});

test("opening an album moves focus into the panel and Escape closes it", async () => {
  const album = { id: "openingAlbum0000000000", name: "Opening ceremony", count: 0, cover: null };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith("/api/albums")) {
        return {
          ok: true,
          json: async () => ({
            years: [
              { id: "year1", name: "2026–2027", terms: [{ id: "term1", name: "First term", albums: [album] }] },
            ],
            fetchedAt: "2026-11-09T00:00:00.000Z",
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          album: { id: album.id, name: album.name },
          photos: [],
          fetchedAt: "2026-11-09T00:00:00.000Z",
        }),
      };
    }),
  );
  try {
    await act(async () => {
      render(<MemoryRouter><Photos /></MemoryRouter>);
    });
    const card = await screen.findByRole("button", { name: /Opening ceremony/i });
    // jsdom's click does not move focus, so focus the trigger explicitly to
    // prove the panel — not the click — moves it.
    card.focus();
    fireEvent.click(card);
    const close = await screen.findByRole("button", { name: "Close" });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(card);
  } finally {
    vi.unstubAllGlobals();
  }
});
