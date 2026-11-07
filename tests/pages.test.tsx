import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test("renders the shell and primary navigation", () => {
  renderAt("/");

  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  expect(screen.getByText(/Independent reviewer/)).toBeInTheDocument();
});

test("primary navigation exposes every core destination", () => {
  renderAt("/");

  const primary = screen.getByRole("navigation", { name: "Primary" });
  for (const label of ["Bank", "Practice", "Review", "Notes", "Lab", "Progress"]) {
    expect(within(primary).getByRole("link", { name: label })).toBeInTheDocument();
  }
  expect(within(primary).getByRole("link", { name: "Bank" })).toHaveAttribute(
    "href",
    "/bank",
  );
});

test("shell renders the homepage heading and the theme toggle", () => {
  renderAt("/");

  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
});

test("unknown routes fall back to the not found page inside the shell", () => {
  renderAt("/no-such-page");

  expect(
    screen.getByRole("heading", { level: 1, name: /not found/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("banner")).toBeInTheDocument();
});
