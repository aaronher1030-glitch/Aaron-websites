import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  Bar,
  DifficultyBadge,
  DomainBadge,
  ProgressRing,
  SectionHead,
  SourceBadge,
  VerificationBadge,
} from "../src/components/ui";
import { Icon } from "../src/components/Icon";

test("domain, difficulty, source and verification badges render their labels", () => {
  const { container } = render(
    <>
      <DomainBadge domain="Physical" />
      <DifficultyBadge difficulty="Olympiad" />
      <SourceBadge source="supplied-paper" />
      <SourceBadge source="textbook" />
      <SourceBadge source="mixed" />
      <SourceBadge source="gap-fill" />
      <VerificationBadge verified={{ status: "verified", reviewedAt: "2026-11-01" }} />
      <VerificationBadge verified={{ status: "flagged", reviewedAt: "2026-11-01" }} />
    </>,
  );

  expect(screen.getByText("Physical")).toHaveClass("badge", "badge-domain");
  expect(screen.getByText("Physical")).toHaveAttribute("data-domain", "physical");
  expect(screen.getByText("Olympiad")).toHaveClass("badge", "badge-difficulty");
  expect(screen.getByText("Olympiad")).toHaveAttribute("data-difficulty", "olympiad");

  expect(screen.getByText("Supplied paper")).toHaveClass("badge", "badge-source");
  expect(screen.getByText("Textbook")).toBeInTheDocument();
  expect(screen.getByText("Merged source")).toBeInTheDocument();
  expect(screen.getByText("Gap fill")).toBeInTheDocument();

  expect(screen.getByText("Blind-verified")).toHaveClass("badge", "badge-verified");
  expect(screen.getByText("Blind-verified")).toHaveAttribute("data-status", "verified");
  expect(screen.getByText("Flagged")).toHaveAttribute("data-status", "flagged");
  expect(container.textContent).not.toMatch(/official/i);
});

test("bar exposes progressbar semantics and a clamped fill width", () => {
  const { container } = render(<Bar value={42} max={100} label="Mastery" tone="acid" />);
  const bar = screen.getByRole("progressbar", { name: "Mastery" });

  expect(bar).toHaveAttribute("aria-valuemin", "0");
  expect(bar).toHaveAttribute("aria-valuemax", "100");
  expect(bar).toHaveAttribute("aria-valuenow", "42");
  expect(bar).toHaveAttribute("data-tone", "acid");
  expect(container.querySelector(".bar-fill")).toHaveStyle({ width: "42%" });

  const { container: high } = render(<Bar value={150} max={100} label="Over" />);
  expect(high.querySelector(".bar-fill")).toHaveStyle({ width: "100%" });

  const { container: low } = render(<Bar value={-20} max={100} label="Under" />);
  expect(low.querySelector(".bar-fill")).toHaveStyle({ width: "0%" });
  expect(screen.getByRole("progressbar", { name: "Under" })).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
});

test("progress ring announces its label and rounded percentage", () => {
  const { container } = render(<ProgressRing value={30} max={60} label="Accuracy" />);

  const ring = screen.getByRole("img", { name: "Accuracy, 50%" });
  expect(ring).toBeInTheDocument();
  expect(container.querySelector(".progress-ring-value")).toHaveTextContent("50%");
  expect(container.querySelectorAll("circle")).toHaveLength(2);

  render(<ProgressRing value={999} max={100} label="Clamped" />);
  expect(screen.getByRole("img", { name: "Clamped, 100%" })).toBeInTheDocument();
});

test("section head renders its eyebrow, heading, lede and actions", () => {
  const { container } = render(
    <SectionHead
      eyebrow="Chapter 4"
      title="Thermodynamics"
      lede="Enthalpy, entropy, and free energy."
      actions={<button type="button">Review all</button>}
      id="thermo"
    />,
  );

  const head = container.querySelector("header.section-head");
  expect(head).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Thermodynamics" })).toHaveAttribute(
    "id",
    "thermo",
  );
  expect(container.querySelector(".section-eyebrow")).toHaveTextContent("Chapter 4");
  expect(container.querySelector(".section-lede")).toHaveTextContent("Enthalpy");
  expect(screen.getByRole("button", { name: "Review all" }).closest(".section-actions")).toBeTruthy();
});

test("icons are decorative by default and labelled when titled", () => {
  const { container } = render(<Icon name="flask" />);
  const decorative = container.querySelector("svg");
  expect(decorative).toHaveAttribute("aria-hidden", "true");
  expect(decorative).toHaveAttribute("focusable", "false");
  expect(decorative).not.toHaveAttribute("role");
  expect(decorative).toHaveAttribute("viewBox", "0 0 24 24");
  expect(decorative).toHaveAttribute("stroke", "currentColor");

  const { container: titled } = render(<Icon name="target" title="Target practice" />);
  const labelled = titled.querySelector("svg");
  expect(labelled).toHaveAttribute("role", "img");
  expect(labelled).not.toHaveAttribute("aria-hidden");
  expect(labelled?.querySelector("title")?.textContent).toBe("Target practice");
});
