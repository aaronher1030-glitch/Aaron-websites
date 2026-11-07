import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import {
  QUESTIONS,
  QUESTION_COUNT,
  questionsForPaper,
} from "../src/data/questions";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

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

test("the home page leads with the exact headline", () => {
  renderAt("/");

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "The exam is a reaction. Train the conditions.",
    }),
  ).toBeInTheDocument();
});

test("the home sample can be answered and explained", async () => {
  const user = userEvent.setup();
  renderAt("/");

  const choices = screen.getAllByRole("radio");
  expect(choices.length).toBeGreaterThanOrEqual(4);
  await user.click(choices[0]);
  await user.click(screen.getByRole("button", { name: /^check$/i }));
  expect(screen.getByText(/correct answer/i)).toBeInTheDocument();
});

test("the sample result announces a correct pick and takes focus", async () => {
  const user = userEvent.setup();
  vi.spyOn(Math, "random").mockReturnValue(0);

  const standard = QUESTIONS.filter((q) => q.difficulty === "Standard");
  const target = standard[0];
  const answerLetter = String.fromCharCode(65 + target.answer);
  renderAt("/");

  const choices = screen.getAllByRole("radio");
  await user.click(choices[target.answer]);
  await user.click(screen.getByRole("button", { name: /^check$/i }));

  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status).toHaveAttribute("data-verdict", "correct");
  expect(status).toHaveFocus();
  expect(within(status).getByText(/correct\./i)).toBeInTheDocument();
  expect(within(status).getByText(/you picked/i)).toHaveTextContent(
    `You picked ${answerLetter}.`,
  );
  expect(within(status).getByText(/correct answer/i)).toHaveTextContent(
    `Correct answer: ${answerLetter}`,
  );
});

test("the sample result calls out a wrong pick in text", async () => {
  const user = userEvent.setup();
  vi.spyOn(Math, "random").mockReturnValue(0);

  const standard = QUESTIONS.filter((q) => q.difficulty === "Standard");
  const target = standard[0];
  const wrongIndex = (target.answer + 1) % 4;
  const answerLetter = String.fromCharCode(65 + target.answer);
  renderAt("/");

  const choices = screen.getAllByRole("radio");
  await user.click(choices[wrongIndex]);
  await user.click(screen.getByRole("button", { name: /^check$/i }));

  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("data-verdict", "wrong");
  expect(within(status).getByText(/not quite/i)).toBeInTheDocument();
  expect(within(status).getByText(/correct answer/i)).toHaveTextContent(
    `Correct answer: ${answerLetter}`,
  );
});

test("try another clears the result and re-disables check", async () => {
  const user = userEvent.setup();
  renderAt("/");

  const check = screen.getByRole("button", { name: /^check$/i });
  expect(check).toBeDisabled();

  await user.click(screen.getAllByRole("radio")[0]);
  expect(check).toBeEnabled();
  await user.click(check);
  expect(screen.getByRole("status")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /try another/i }));

  expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^check$/i })).toBeDisabled();
});

test("try another returns focus to the answer choices", async () => {
  const user = userEvent.setup();
  renderAt("/");

  await user.click(screen.getAllByRole("radio")[0]);
  await user.click(screen.getByRole("button", { name: /^check$/i }));
  await user.click(screen.getByRole("button", { name: /try another/i }));

  expect(screen.getAllByRole("radio")[0]).toHaveFocus();
});

test("the hero lede separates prototype items from supplied papers", () => {
  renderAt("/");

  const supplied = QUESTIONS.filter((q) => q.source === "supplied-paper").length;
  const lede = screen.getByText(/every item was independently re-solved/i);
  const text = lede.textContent ?? "";

  expect(text).toContain(`${QUESTION_COUNT - supplied} prototype questions`);
  expect(text).toContain(`${supplied} items`);
  expect(text).toContain("four supplied PNCO papers");
});

test("the coverage note explains the four withheld items", () => {
  renderAt("/");

  const note = screen.getByText(/four supplied items are withheld/i);
  expect(note.textContent ?? "").toMatch(/no choice exactly matches/i);
  expect(
    within(note as HTMLElement).getByRole("link", {
      name: /read the corrections log/i,
    }),
  ).toHaveAttribute("href", "/about#corrections");
});

test("the trust strip states the verified bank size", () => {
  renderAt("/");

  const trust = screen.getByRole("list", { name: "What you get" });
  expect(
    within(trust).getByText(`${QUESTION_COUNT} verified questions`),
  ).toBeInTheDocument();
});

test("the diagnostic CTA points at the 20-question preset", () => {
  renderAt("/");

  const ctas = screen.getAllByRole("link", { name: /20-question diagnostic/i });
  expect(ctas.length).toBeGreaterThanOrEqual(1);
  for (const cta of ctas) {
    expect(cta).toHaveAttribute("href", "/practice?preset=diagnostic-20");
  }
});

test("each supplied paper card links to its drill with a derived count", () => {
  renderAt("/");

  const papers = [
    ["ch1-3-theory", "Chapters 1–3 Theory"],
    ["ch1-3-lab", "Chapters 1–3 Lab"],
    ["ch4-7-theory", "Chapters 4–7 Theory"],
    ["ch4-7-lab", "Chapters 4–7 Lab"],
  ] as const;

  for (const [id, title] of papers) {
    const heading = screen.getByRole("heading", { level: 3, name: title });
    const card = heading.closest("article");
    expect(card).not.toBeNull();
    const scope = within(card as HTMLElement);
    expect(
      scope.getByRole("link", { name: /drill this paper/i }),
    ).toHaveAttribute("href", `/practice?preset=paper&paper=${id}`);
    expect(
      scope.getByText(String(questionsForPaper(id).length)),
    ).toBeInTheDocument();
  }
});

test("the honesty strip is independent and points to corrections", () => {
  renderAt("/");

  const strip = screen.getByRole("region", {
    name: /independence and corrections/i,
  });
  const text = strip.textContent ?? "";

  for (const body of ["PFCS", "PNCO", "DepEd", "ACheS", "Ateneo"]) {
    expect(text).toContain(body);
  }
  expect(text).toMatch(/not affiliated|unofficial/i);
  expect(
    within(strip).getByRole("link", { name: /corrections/i }),
  ).toHaveAttribute("href", "/about#corrections");
});
