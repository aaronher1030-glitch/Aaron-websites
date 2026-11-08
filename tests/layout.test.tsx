import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "../src/components/SiteLayout";

test("keeps the published nav order with Photos after Accomplishments", () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<p>home</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  const nav = screen.getByRole("navigation", { name: "Primary" });
  expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual([
    "Home", "Finance", "Accomplishments", "Photos", "Transparency", "About us", "Feedback",
  ]);
  expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
  expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
});
