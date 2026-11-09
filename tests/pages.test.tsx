import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Home from "../src/pages/Home";
import Accomplishments from "../src/pages/Accomplishments";
import ActivityPage from "../src/pages/ActivityPage";

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
