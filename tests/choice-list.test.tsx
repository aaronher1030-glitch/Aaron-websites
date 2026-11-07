import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ChoiceList } from "../src/components/ChoiceList";
import type { Question } from "../src/data/types";

const question: Question = {
  id: "q-test-1",
  domain: "General",
  topic: "Stoichiometry",
  difficulty: "Foundation",
  stem: "Which formula is water?",
  choices: ["Water H<sub>2</sub>O", "Salt NaCl", "Sugar C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>", "Acid HCl"],
  answer: 0,
  explanation: "Water is H<sub>2</sub>O.",
  source: "supplied-paper",
  verified: { status: "verified", reviewedAt: "2026-11-01" },
};

function StrikeHarness() {
  const [strikes, setStrikes] = useState<string[]>([]);
  return (
    <ChoiceList
      question={question}
      value=""
      onChange={() => {}}
      checked={false}
      strikes={strikes}
      onStrike={(letter) =>
        setStrikes((previous) =>
          previous.includes(letter)
            ? previous.filter((item) => item !== letter)
            : [...previous, letter],
        )
      }
    />
  );
}

test("renders one radio per choice inside a labelled radiogroup", () => {
  render(
    <ChoiceList question={question} value="" onChange={() => {}} checked={false} />,
  );

  expect(screen.getByRole("radiogroup", { name: "Answer choices" })).toBeInTheDocument();
  expect(screen.getAllByRole("radio")).toHaveLength(4);

  const choices = Array.from(document.querySelectorAll(".choice"));
  expect(choices.map((choice) => choice.getAttribute("data-letter"))).toEqual([
    "A",
    "B",
    "C",
    "D",
  ]);
});

test("clicking a choice reports its letter", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <ChoiceList question={question} value="" onChange={onChange} checked={false} />,
  );

  await user.click(screen.getByRole("radio", { name: /Salt/ }));
  expect(onChange).toHaveBeenCalledWith("B");
});

test("checked state disables the radios and marks right and wrong choices", () => {
  render(
    <ChoiceList question={question} value="B" onChange={() => {}} checked />,
  );

  const radios = screen.getAllByRole("radio");
  for (const radio of radios) {
    expect(radio).toBeDisabled();
  }

  const right = document.querySelector('.choice[data-letter="A"]');
  const wrong = document.querySelector('.choice[data-letter="B"]');
  expect(right?.classList.contains("is-right")).toBe(true);
  expect(wrong?.classList.contains("is-wrong")).toBe(true);
  expect(screen.getByRole("radio", { name: /Water/ })).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("strike control calls onStrike and toggles aria-pressed with its label", async () => {
  const user = userEvent.setup();
  render(<StrikeHarness />);

  const strike = screen.getByRole("button", { name: "Eliminate A" });
  expect(strike).toHaveAttribute("aria-pressed", "false");
  expect(strike).toHaveTextContent("Eliminate");

  await user.click(strike);

  expect(strike).toHaveAttribute("aria-pressed", "true");
  expect(strike).toHaveTextContent("Undo");
  expect(strike).toHaveAttribute("aria-label", "Undo A");
  expect(
    document.querySelector('.choice[data-letter="A"]')?.classList.contains("is-struck"),
  ).toBe(true);
});

test("strike control is disabled once the question is checked", () => {
  render(
    <ChoiceList
      question={question}
      value="B"
      onChange={() => {}}
      checked
      onStrike={() => {}}
    />,
  );

  for (const strike of screen.getAllByRole("button", { name: /Eliminate/ })) {
    expect(strike).toBeDisabled();
  }
});
