import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "../src/components/SiteLayout";

function renderLayout() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<p>home</p>} />
          <Route path="finance" element={<p>finance</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

test("keeps the published nav order with Photos after Accomplishments", () => {
  renderLayout();
  const nav = screen.getByRole("navigation", { name: "Primary" });
  expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual([
    "Home", "Finance", "Accomplishments", "Photos", "Transparency", "About us", "Feedback",
  ]);
});

test("exposes one skip link, one main and the current page", () => {
  renderLayout();
  expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
  expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
});

test("the menu toggle announces and closes on Escape", () => {
  renderLayout();
  const toggle = screen.getByRole("button", { name: "Open menu" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(toggle);
  const close = screen.getByRole("button", { name: "Close menu" });
  expect(close).toHaveAttribute("aria-expanded", "true");
  expect(close).toHaveAttribute("aria-controls", screen.getByRole("navigation", { name: "Primary" }).id);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
});

test("Escape returns focus to the menu trigger", () => {
  renderLayout();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  const finance = within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", {
    name: "Finance",
  });
  finance.focus();
  expect(finance).toHaveFocus();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
});

test("navigating to another route closes the menu", () => {
  renderLayout();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "Finance" }));
  expect(screen.getByText("finance")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
});

test("the footer names the government and links Facebook", () => {
  renderLayout();
  expect(screen.getByText(/Benigno S\. Aquino National High School Supreme Secondary Learner Government/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /facebook\.com\/SSLGBSANHS/i })).toHaveAttribute("href", "https://www.facebook.com/SSLGBSANHS");
});
