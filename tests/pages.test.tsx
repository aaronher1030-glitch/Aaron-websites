import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "../src/App";
import {
  DOMAIN_COUNTS,
  QUESTIONS,
  QUESTION_BY_ID,
  QUESTION_COUNT,
  questionsForPaper,
} from "../src/data/questions";

/* Bank tests mount pages of rich-text/KaTeX cards; give them headroom over
   the 5s default so parallel workers do not flake them. */
vi.setConfig({ testTimeout: 20000 });

/* Hidden probes expose the router location so filter persistence and
   prev/next navigation can be asserted without a snapshot. */
function LocationProbe() {
  const location = useLocation();
  return (
    <>
      <div data-testid="location-pathname" hidden>
        {location.pathname}
      </div>
      <div data-testid="location-search" hidden>
        {location.search}
      </div>
    </>
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

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

/* ---------------------------------------------------------------
   Bank
   --------------------------------------------------------------- */

test("the bank lists the verified bank with a showing count and paged cards", () => {
  renderAt("/bank");

  expect(
    screen.getByRole("heading", { level: 1, name: "Question bank" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(`Showing ${QUESTION_COUNT} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();

  const opens = screen.getAllByRole("link", { name: /^Open / });
  expect(opens.length).toBeGreaterThan(0);
  expect(opens.length).toBeLessThan(QUESTION_COUNT);
  expect(opens[0]).toHaveAttribute("href", `/q/${QUESTIONS[0].id}`);
  expect(screen.getByRole("button", { name: /show more/i })).toBeInTheDocument();
});

test("show more reveals another page of cards", async () => {
  const user = userEvent.setup();
  renderAt("/bank");

  const before = screen.getAllByRole("link", { name: /^Open / }).length;
  await user.click(screen.getByRole("button", { name: /show more/i }));
  const after = screen.getAllByRole("link", { name: /^Open / }).length;

  expect(after).toBeGreaterThan(before);
  expect(
    screen.getByText(`Showing ${QUESTION_COUNT} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
});

test("bank search narrows the cards and persists in the URL", async () => {
  const user = userEvent.setup();
  renderAt("/bank");

  const needle = "nanoparticle";
  const expected = QUESTIONS.filter((q) =>
    `${q.stem} ${q.topic} ${q.explanation}`.toLowerCase().includes(needle),
  ).length;

  await user.type(
    screen.getByRole("searchbox", { name: /search questions/i }),
    needle,
  );

  expect(
    screen.getByText(`Showing ${expected} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /^Open / })).toHaveLength(expected);
  expect(screen.getByTestId("location-search").textContent).toBe(`?q=${needle}`);
});

test("bank selects narrow results and persist in the URL", async () => {
  const user = userEvent.setup();
  renderAt("/bank");

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Domain" }),
    "General",
  );
  expect(
    screen.getByText(`Showing ${DOMAIN_COUNTS.General} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
  expect(screen.getByTestId("location-search").textContent).toBe("?domain=General");

  await user.selectOptions(screen.getByRole("combobox", { name: "Chapter" }), "1");
  const expected = QUESTIONS.filter(
    (q) => q.domain === "General" && q.chapter === 1,
  ).length;
  expect(
    screen.getByText(`Showing ${expected} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
  expect(screen.getByTestId("location-search").textContent).toBe(
    "?domain=General&chapter=1",
  );
});

test("topic, difficulty, and source selects each narrow the bank", async () => {
  const user = userEvent.setup();
  renderAt("/bank");

  await user.selectOptions(screen.getByRole("combobox", { name: "Topic" }), "Gases");
  const gases = QUESTIONS.filter((q) => q.topic === "Gases").length;
  expect(
    screen.getByText(`Showing ${gases} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
  expect(screen.getByTestId("location-search").textContent).toBe("?topic=Gases");

  await user.selectOptions(screen.getByRole("combobox", { name: "Topic" }), "");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Difficulty" }),
    "Foundation",
  );
  const foundation = QUESTIONS.filter((q) => q.difficulty === "Foundation").length;
  expect(
    screen.getByText(`Showing ${foundation} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();

  await user.selectOptions(screen.getByRole("combobox", { name: "Difficulty" }), "");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Source" }),
    "supplied-paper",
  );
  const supplied = QUESTIONS.filter((q) => q.source === "supplied-paper").length;
  expect(
    screen.getByText(`Showing ${supplied} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
  expect(screen.getByTestId("location-search").textContent).toBe(
    "?source=supplied-paper",
  );
});

test("status filters read the local store", async () => {
  const wrongQ = QUESTIONS[0];
  const stashedQ = QUESTIONS[1];
  window.localStorage.setItem(
    "chembank:v1",
    JSON.stringify({
      version: 1,
      attempts: [
        { qid: wrongQ.id, correct: false, answer: "A", ts: 1, elapsedSec: 1, mode: "single" },
      ],
      drills: [],
      review: [],
      stashed: [stashedQ.id],
      theme: "auto",
      createdAt: 1,
    }),
  );
  const user = userEvent.setup();
  renderAt("/bank?status=wrong");

  expect(screen.getByText(`Showing 1 of ${QUESTION_COUNT}`)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: `Open ${wrongQ.id}` }),
  ).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("wrong");

  await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "flagged");
  expect(screen.getByText(`Showing 1 of ${QUESTION_COUNT}`)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: `Open ${stashedQ.id}` }),
  ).toBeInTheDocument();

  await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "unseen");
  expect(
    screen.getByText(`Showing ${QUESTION_COUNT - 1} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
});

test("reset clears every filter and the URL", async () => {
  const user = userEvent.setup();
  renderAt("/bank?domain=Physical&q=gas");

  expect(screen.getByRole("combobox", { name: "Domain" })).toHaveValue("Physical");
  expect(screen.getByRole("searchbox", { name: /search questions/i })).toHaveValue("gas");

  await user.click(screen.getByRole("button", { name: /^reset$/i }));

  expect(screen.getByTestId("location-search").textContent).toBe("");
  expect(
    screen.getByText(`Showing ${QUESTION_COUNT} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Domain" })).toHaveValue("");
  expect(screen.getByRole("searchbox", { name: /search questions/i })).toHaveValue("");
});

test("an empty result set explains itself", async () => {
  const user = userEvent.setup();
  renderAt("/bank");

  await user.type(
    screen.getByRole("searchbox", { name: /search questions/i }),
    "zzzz-no-match",
  );

  expect(screen.getByText(`Showing 0 of ${QUESTION_COUNT}`)).toBeInTheDocument();
  expect(screen.getByText(/no questions match/i)).toBeInTheDocument();
  expect(screen.queryAllByRole("link", { name: /^Open / })).toHaveLength(0);
});

test("the mobile filter drawer toggles open and closed", async () => {
  const user = userEvent.setup();
  renderAt("/bank");

  const toggle = screen.getByRole("button", { name: /filters/i });
  expect(toggle).toHaveAttribute("aria-expanded", "false");

  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(document.getElementById("bank-filters")).toHaveAttribute("data-open", "true");

  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(document.getElementById("bank-filters")).toHaveAttribute("data-open", "false");
});

test("bank filters hydrate from the URL on a fresh load", () => {
  renderAt("/bank?difficulty=Olympiad");

  expect(screen.getByRole("combobox", { name: "Difficulty" })).toHaveValue("Olympiad");
  const olympiad = QUESTIONS.filter((q) => q.difficulty === "Olympiad").length;
  expect(
    screen.getByText(`Showing ${olympiad} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
});

test("unknown filter values in the URL fall back to all", () => {
  renderAt("/bank?domain=Bogus&status=hacked&chapter=9");

  expect(screen.getByRole("combobox", { name: "Domain" })).toHaveValue("");
  expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("all");
  expect(screen.getByRole("combobox", { name: "Chapter" })).toHaveValue("");
  expect(
    screen.getByText(`Showing ${QUESTION_COUNT} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
});

/* The router commits search params inside a transition, so a write fired
   before the previous keystroke's commit lands must not spread the stale
   committed URL. Fire both interactions inside the lagging window, then
   flush: the field, the URL, and the results have to agree. */
test("changing a select during a lagging search commit keeps the typed query", async () => {
  renderAt("/bank");

  const search = screen.getByRole("searchbox", { name: /search questions/i });
  const domain = screen.getByRole("combobox", { name: "Domain" });
  act(() => {
    fireEvent.change(search, { target: { value: "gas" } });
    fireEvent.change(domain, { target: { value: "Physical" } });
  });
  await act(async () => {});

  const expected = QUESTIONS.filter(
    (q) =>
      q.domain === "Physical" &&
      `${q.stem} ${q.topic} ${q.explanation}`.toLowerCase().includes("gas"),
  ).length;
  expect(search).toHaveValue("gas");
  expect(domain).toHaveValue("Physical");
  expect(screen.getByTestId("location-search").textContent).toBe(
    "?q=gas&domain=Physical",
  );
  expect(
    screen.getByText(`Showing ${expected} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
});

test("typing immediately after a select change keeps the selected domain", async () => {
  renderAt("/bank");

  const search = screen.getByRole("searchbox", { name: /search questions/i });
  const domain = screen.getByRole("combobox", { name: "Domain" });
  act(() => {
    fireEvent.change(domain, { target: { value: "Physical" } });
    fireEvent.change(search, { target: { value: "gas" } });
  });
  await act(async () => {});

  const expected = QUESTIONS.filter(
    (q) =>
      q.domain === "Physical" &&
      `${q.stem} ${q.topic} ${q.explanation}`.toLowerCase().includes("gas"),
  ).length;
  expect(search).toHaveValue("gas");
  expect(domain).toHaveValue("Physical");
  expect(screen.getByTestId("location-search").textContent).toBe(
    "?q=gas&domain=Physical",
  );
  expect(
    screen.getByText(`Showing ${expected} of ${QUESTION_COUNT}`),
  ).toBeInTheDocument();
});

/* ---------------------------------------------------------------
   QuestionPage
   --------------------------------------------------------------- */

test("the question page resolves its id and shows metadata", () => {
  const target = QUESTIONS[0];
  renderAt(`/q/${target.id}`);

  expect(
    screen.getByRole("heading", { level: 1, name: target.topic }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(new RegExp(`Question 1 of ${QUESTION_COUNT}`)),
  ).toBeInTheDocument();
  expect(document.querySelector(".badge-domain")).toHaveTextContent(target.domain);
  expect(document.querySelector(".badge-difficulty")).toHaveTextContent(target.difficulty);
  expect(document.querySelector(".badge-source")).toHaveTextContent("Supplied paper");
  expect(document.querySelector(".badge-verified")).toHaveTextContent("Blind-verified");
  expect(document.querySelector(".question-stem")?.textContent).toContain(
    "spherical gold nanoparticle",
  );
  expect(screen.getAllByRole("radio")).toHaveLength(4);
  expect(screen.getByRole("button", { name: /^check$/i })).toBeDisabled();
});

test("the question page renders no dead Eliminate controls", () => {
  /* jsdom does not load stylesheets, so inject the real page CSS to observe
     the scoped rule that hides the answer-only sheet's strike buttons. */
  const style = document.createElement("style");
  style.textContent = readFileSync("src/styles/pages.css", "utf8");
  document.head.appendChild(style);
  try {
    renderAt(`/q/${QUESTIONS[0].id}`);

    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.queryByRole("button", { name: /Eliminate/ })).toBeNull();
  } finally {
    style.remove();
  }
});

test("check records exactly one single-mode attempt and focuses the verdict", async () => {
  const user = userEvent.setup();
  const target = QUESTIONS[0];
  const letter = String.fromCharCode(65 + target.answer);
  renderAt(`/q/${target.id}`);

  await user.click(screen.getAllByRole("radio")[target.answer]);
  const check = screen.getByRole("button", { name: /^check$/i });
  expect(check).toBeEnabled();
  await user.click(check);

  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status).toHaveAttribute("data-verdict", "correct");
  expect(status).toHaveFocus();
  expect(within(status).getByText(/correct\./i)).toHaveTextContent(
    `Correct. You picked ${letter}.`,
  );
  expect(within(status).getByText(/correct answer/i)).toHaveTextContent(
    `Correct answer: ${letter}`,
  );
  expect(check).toBeDisabled();
  expect(screen.getByRole("region", { name: "Solution" })).toBeInTheDocument();

  await user.click(check);
  const persisted = JSON.parse(window.localStorage.getItem("chembank:v1") ?? "{}");
  expect(persisted.attempts).toHaveLength(1);
  expect(persisted.attempts[0]).toMatchObject({
    qid: target.id,
    correct: true,
    answer: letter,
    mode: "single",
  });
  expect(typeof persisted.attempts[0].ts).toBe("number");
  expect(persisted.attempts[0].elapsedSec).toBeGreaterThanOrEqual(0);
});

test("a wrong pick reports the correct letter and records correct:false", async () => {
  const user = userEvent.setup();
  const target = QUESTIONS[0];
  const wrongIndex = (target.answer + 1) % 4;
  const pickedLetter = String.fromCharCode(65 + wrongIndex);
  const correctLetter = String.fromCharCode(65 + target.answer);
  renderAt(`/q/${target.id}`);

  await user.click(screen.getAllByRole("radio")[wrongIndex]);
  await user.click(screen.getByRole("button", { name: /^check$/i }));

  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("data-verdict", "wrong");
  expect(status).toHaveFocus();
  expect(within(status).getByText(/not quite/i)).toHaveTextContent(
    `Not quite. You picked ${pickedLetter}.`,
  );
  expect(within(status).getByText(/correct answer/i)).toHaveTextContent(
    `Correct answer: ${correctLetter}`,
  );
  expect(
    document
      .querySelector(`.choice[data-letter="${correctLetter}"]`)
      ?.classList.contains("is-right"),
  ).toBe(true);

  const persisted = JSON.parse(window.localStorage.getItem("chembank:v1") ?? "{}");
  expect(persisted.attempts).toHaveLength(1);
  expect(persisted.attempts[0]).toMatchObject({
    correct: false,
    answer: pickedLetter,
    mode: "single",
  });
});

test("show solution reveals without recording an attempt or stashing", async () => {
  const user = userEvent.setup();
  const target = QUESTIONS[0];
  renderAt(`/q/${target.id}`);

  await user.click(screen.getByRole("button", { name: /show solution/i }));

  const solution = screen.getByRole("region", { name: "Solution" });
  expect(solution).toHaveFocus();
  expect(solution).toHaveTextContent("The particle volume");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /show solution/i }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole("radio")[0]).toBeEnabled();

  const persisted = JSON.parse(window.localStorage.getItem("chembank:v1") ?? "{}");
  expect(persisted.attempts).toEqual([]);
  expect(persisted.stashed).toEqual([]);
});

test("the solution preserves paragraph breaks", async () => {
  const target = QUESTIONS[0];
  const original = target.explanation;
  target.explanation = "First paragraph.\n\nSecond paragraph.";
  try {
    const user = userEvent.setup();
    renderAt(`/q/${target.id}`);

    await user.click(screen.getByRole("button", { name: /show solution/i }));

    const solution = screen.getByRole("region", { name: "Solution" });
    const paragraphs = solution.querySelectorAll("p.solution-paragraph");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent("First paragraph.");
    expect(paragraphs[1]).toHaveTextContent("Second paragraph.");
  } finally {
    target.explanation = original;
  }
});

test("prev and next walk the bank in order and reset the answer state", async () => {
  const user = userEvent.setup();
  const second = QUESTIONS[1];
  renderAt(`/q/${second.id}`);

  expect(screen.getByRole("link", { name: /^Previous/ })).toHaveAttribute(
    "href",
    `/q/${QUESTIONS[0].id}`,
  );
  expect(screen.getByRole("link", { name: /^Next/ })).toHaveAttribute(
    "href",
    `/q/${QUESTIONS[2].id}`,
  );

  await user.click(screen.getAllByRole("radio")[0]);
  await user.click(screen.getByRole("button", { name: /^check$/i }));
  expect(screen.getByRole("status")).toBeInTheDocument();

  await user.click(screen.getByRole("link", { name: /^Next/ }));

  expect(screen.getByTestId("location-pathname").textContent).toBe(
    `/q/${QUESTIONS[2].id}`,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: QUESTIONS[2].topic }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^check$/i })).toBeDisabled();
  expect(screen.getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "false");

  await user.click(screen.getByRole("link", { name: /^Previous/ }));
  expect(
    screen.getByRole("heading", { level: 1, name: second.topic }),
  ).toBeInTheDocument();
});

test("the first question has no previous link and the last has no next", () => {
  const first = renderAt(`/q/${QUESTIONS[0].id}`);
  expect(screen.queryByRole("link", { name: /^Previous/ })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /^Next/ })).toBeInTheDocument();
  first.unmount();

  renderAt(`/q/${QUESTIONS[QUESTIONS.length - 1].id}`);
  expect(screen.queryByRole("link", { name: /^Next/ })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /^Previous/ })).toBeInTheDocument();
});

test("an unknown id shows a not-found state with a way back", () => {
  renderAt("/q/does-not-exist");

  expect(
    screen.getByRole("heading", { level: 1, name: /not found/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /back to the bank/i }),
  ).toHaveAttribute("href", "/bank");
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  expect(screen.getByRole("banner")).toBeInTheDocument();
});

test("stash toggles and persists across a reload into the bank", async () => {
  const user = userEvent.setup();
  const target = QUESTIONS[0];
  const first = renderAt(`/q/${target.id}`);

  const stash = screen.getByRole("button", { name: /^Stash$/ });
  expect(stash).toHaveAttribute("aria-pressed", "false");

  await user.click(stash);
  expect(screen.getByRole("button", { name: /^Stashed$/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(JSON.parse(window.localStorage.getItem("chembank:v1") ?? "{}").stashed).toEqual([target.id]);

  await user.click(screen.getByRole("button", { name: /^Stashed$/ }));
  expect(JSON.parse(window.localStorage.getItem("chembank:v1") ?? "{}").stashed).toEqual([]);

  await user.click(screen.getByRole("button", { name: /^Stash$/ }));
  first.unmount();

  renderAt("/bank?status=flagged");
  expect(screen.getByText(`Showing 1 of ${QUESTION_COUNT}`)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: `Open ${target.id}` }),
  ).toBeInTheDocument();
});

test("copy diagnostics writes the report and confirms visibly", async () => {
  const user = userEvent.setup();
  const target = QUESTIONS[0];
  const letter = String.fromCharCode(65 + target.answer);
  renderAt(`/q/${target.id}`);

  await user.click(screen.getAllByRole("radio")[target.answer]);
  await user.click(screen.getByRole("button", { name: /copy diagnostics/i }));

  expect(screen.getByText(/diagnostics copied/i)).toBeInTheDocument();
  const text = await navigator.clipboard.readText();
  expect(text).toContain(target.id);
  expect(text).toContain(target.topic);
  expect(text).toContain(target.source);
  expect(text).toContain(`your answer: ${letter}`);
  expect(text).toContain(`correct answer: ${letter}`);
});

test("reporting always offers diagnostics and corrections, never an invented GitHub link", () => {
  renderAt(`/q/${QUESTIONS[0].id}`);

  expect(
    screen.getByRole("button", { name: /copy diagnostics/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /corrections log/i }),
  ).toHaveAttribute("href", "/about#corrections");
  expect(screen.queryByRole("link", { name: /github/i })).not.toBeInTheDocument();
});

/* ---------------------------------------------------------------
   Practice builder + Drill player
   --------------------------------------------------------------- */

function readPersisted() {
  return JSON.parse(window.localStorage.getItem("chembank:v1") ?? "{}");
}

function seedStore(partial: Record<string, unknown>) {
  window.localStorage.setItem(
    "chembank:v1",
    JSON.stringify({
      version: 1,
      attempts: [],
      drills: [],
      review: [],
      stashed: [],
      theme: "auto",
      createdAt: 1,
      ...partial,
    }),
  );
}

test("diagnostic preset starts a drill that walks choose, check, next, submit to results", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=diagnostic-20");

  expect(
    screen.getByRole("heading", { level: 1, name: /build a drill/i }),
  ).toBeInTheDocument();
  expect(screen.getByText("20 questions match")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /diagnostic 20/i }),
  ).toHaveAttribute("aria-pressed", "true");

  await user.click(screen.getByRole("button", { name: /start drill/i }));

  const persisted = readPersisted();
  expect(persisted.drills).toHaveLength(1);
  const drill = persisted.drills[0];
  expect(drill.qids).toHaveLength(20);
  expect(drill.mode).toBe("practice");
  expect(drill.limitSec).toBe(0);
  expect(screen.getByTestId("location-pathname").textContent).toBe(
    `/drill/${drill.id}`,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: drill.name }),
  ).toBeInTheDocument();
  expect(screen.getByText("Question 1 of 20")).toBeInTheDocument();

  const first = QUESTION_BY_ID.get(drill.qids[0]);
  expect(first).toBeDefined();
  expect(document.querySelector(".drill-sheet")?.textContent).toContain(
    first!.topic,
  );
  expect(screen.getAllByRole("radio")).toHaveLength(4);

  await user.click(screen.getAllByRole("radio")[first!.answer]);
  await user.click(screen.getByRole("button", { name: /^check$/i }));

  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(status).toHaveAttribute("data-verdict", "correct");
  expect(status).toHaveFocus();
  expect(screen.getByRole("region", { name: "Solution" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^next$/i }));
  expect(screen.getByText("Question 2 of 20")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /submit drill/i }));
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  await user.click(within(dialog).getByRole("button", { name: /^submit$/i }));

  expect(screen.getByTestId("location-pathname").textContent).toBe(
    `/drill/${drill.id}/results`,
  );
  const finished = readPersisted().drills[0];
  expect(finished.done).toBe(true);
  expect(typeof finished.finishedAt).toBe("number");
});

test("paper preset hydrates from the URL and drills the full published paper", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=paper&paper=ch1-3-lab");

  expect(screen.getByRole("combobox", { name: "Paper" })).toHaveValue("ch1-3-lab");
  expect(screen.getByText("49 questions match")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /start drill/i }));

  const drill = readPersisted().drills[0];
  expect(drill.qids).toEqual(questionsForPaper("ch1-3-lab").map((q) => q.id));
  expect(drill.name).toBe("Chapters 1–3 Lab");
});

test("the builder defaults to the diagnostic preset for a bare visit", () => {
  renderAt("/practice");

  expect(screen.getByText("20 questions match")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /diagnostic 20/i }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("unknown preset and paper params fall back to safe defaults", () => {
  const bogus = renderAt("/practice?preset=bogus");
  expect(screen.getByText("20 questions match")).toBeInTheDocument();
  bogus.unmount();

  renderAt("/practice?preset=paper&paper=nope");
  expect(screen.getByRole("combobox", { name: "Paper" })).toHaveValue("ch1-3-theory");
  expect(screen.getByText("49 questions match")).toBeInTheDocument();
});

test("weak and due presets are honestly empty on a fresh store", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=weak");

  expect(screen.getByText("0 questions match")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /start drill/i })).toBeDisabled();
  expect(screen.getByText(/no weak topics yet/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /due review/i }));

  expect(screen.getByText("0 questions match")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /start drill/i })).toBeDisabled();
  expect(screen.getByText(/nothing is due yet/i)).toBeInTheDocument();
});

test("weak preset drills whole topics under the accuracy threshold", async () => {
  const kinetics = QUESTIONS.filter((q) => q.topic === "Kinetics");
  seedStore({
    attempts: [
      { qid: kinetics[0].id, correct: false, answer: "A", ts: 1, elapsedSec: 1, mode: "single" },
      { qid: kinetics[1].id, correct: false, answer: "A", ts: 2, elapsedSec: 1, mode: "single" },
    ],
  });
  const user = userEvent.setup();
  renderAt("/practice?preset=weak");

  expect(
    screen.getByText(`${kinetics.length} questions match`),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /start drill/i }));

  expect(readPersisted().drills[0].qids).toEqual(kinetics.map((q) => q.id));
});

test("due preset drills the sorted due queue", async () => {
  const [a, b, c] = QUESTIONS;
  const now = Date.now();
  seedStore({
    review: [
      { qid: b.id, dueAt: now - 1000, step: 0, lastSeen: 0 },
      { qid: a.id, dueAt: now - 5000, step: 1, lastSeen: 0 },
      { qid: c.id, dueAt: now + 999_999, step: 0, lastSeen: 0 },
    ],
  });
  const user = userEvent.setup();
  renderAt("/practice?preset=due");

  expect(screen.getByText("2 questions match")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /start drill/i }));

  expect(readPersisted().drills[0].qids).toEqual([a.id, b.id]);
});

test("custom preset filters live and disables start at zero", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=custom");

  expect(
    screen.getByText(`${QUESTION_COUNT} questions match`),
  ).toBeInTheDocument();

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Domain" }),
    "Laboratory",
  );
  expect(
    screen.getByText(`${DOMAIN_COUNTS.Laboratory} questions match`),
  ).toBeInTheDocument();

  await user.type(
    screen.getByRole("searchbox", { name: /search questions/i }),
    "zzzz-no-match",
  );
  expect(screen.getByText("0 questions match")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /start drill/i })).toBeDisabled();
});

test("chapter preset hydrates and drills the selected chapter", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=chapter&chapter=3");

  expect(screen.getByRole("combobox", { name: "Chapter" })).toHaveValue("3");
  const count3 = QUESTIONS.filter((q) => q.chapter === 3).length;
  expect(screen.getByText(`${count3} questions match`)).toBeInTheDocument();

  await user.selectOptions(screen.getByRole("combobox", { name: "Chapter" }), "5");
  const count5 = QUESTIONS.filter((q) => q.chapter === 5).length;
  expect(screen.getByText(`${count5} questions match`)).toBeInTheDocument();
});

test("daily, random, and lab presets match their published scopes", () => {
  const daily = renderAt("/practice?preset=daily-10");
  expect(screen.getByText("10 questions match")).toBeInTheDocument();
  daily.unmount();

  const random = renderAt("/practice?preset=random-10");
  expect(screen.getByText("10 questions match")).toBeInTheDocument();
  random.unmount();

  renderAt("/practice?preset=lab");
  expect(
    screen.getByText(`${DOMAIN_COUNTS.Laboratory} questions match`),
  ).toBeInTheDocument();
});

test("timed mode keeps choices editable, records nothing until submit, then one attempt per answered item", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=random-10");

  await user.click(screen.getByRole("button", { name: /^timed$/i }));
  expect(screen.getByRole("button", { name: /^timed$/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await user.click(screen.getByRole("button", { name: /start drill/i }));

  const drill = readPersisted().drills[0];
  expect(drill.mode).toBe("timed");
  expect(drill.limitSec).toBe(10 * 90);
  expect(
    screen.queryByRole("button", { name: /^check$/i }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("timer")).toBeInTheDocument();

  const first = QUESTION_BY_ID.get(drill.qids[0])!;
  const second = QUESTION_BY_ID.get(drill.qids[1])!;

  await user.click(screen.getAllByRole("radio")[0]);
  await user.click(screen.getAllByRole("radio")[1]);
  expect(screen.getAllByRole("radio")[1]).toHaveAttribute("aria-checked", "true");
  expect(readPersisted().attempts).toEqual([]);

  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getAllByRole("radio")[second.answer]);
  expect(readPersisted().attempts).toEqual([]);

  await user.click(screen.getByRole("button", { name: /submit drill/i }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("8 unanswered · 0 flagged")).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: /^submit$/i }));

  expect(screen.getByTestId("location-pathname").textContent).toBe(
    `/drill/${drill.id}/results`,
  );
  const persisted = readPersisted();
  expect(persisted.attempts).toHaveLength(2);
  expect(persisted.attempts[0]).toMatchObject({
    qid: first.id,
    answer: "B",
    correct: first.answer === 1,
    mode: "timed",
  });
  expect(persisted.attempts[1]).toMatchObject({
    qid: second.id,
    answer: String.fromCharCode(65 + second.answer),
    correct: true,
    mode: "timed",
  });
  for (const a of persisted.attempts) {
    expect(typeof a.ts).toBe("number");
    expect(a.elapsedSec).toBe(persisted.drills[0].elapsedSec);
  }
});

test("a timed drill counts down and auto-submits at zero", () => {
  vi.useFakeTimers();
  try {
    const [a, b, c] = QUESTIONS;
    seedStore({
      drills: [
        {
          id: "auto-submit-test",
          name: "Short timed",
          mode: "timed",
          qids: [a.id, b.id, c.id],
          answers: { [a.id]: String.fromCharCode(65 + a.answer) },
          checked: {},
          flagged: {},
          strikes: {},
          index: 0,
          limitSec: 3,
          elapsedSec: 0,
          startedAt: Date.now(),
          done: false,
        },
      ],
    });
    renderAt("/drill/auto-submit-test");

    expect(screen.getByRole("timer")).toHaveTextContent("0:03");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("0:02");
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("location-pathname").textContent).toBe(
      "/drill/auto-submit-test/results",
    );
    const persisted = readPersisted();
    expect(persisted.drills[0]).toMatchObject({ done: true, elapsedSec: 3 });
    expect(typeof persisted.drills[0].finishedAt).toBe("number");
    expect(persisted.attempts).toHaveLength(1);
    expect(persisted.attempts[0]).toMatchObject({
      qid: a.id,
      mode: "timed",
      correct: true,
      elapsedSec: 3,
    });
  } finally {
    vi.useRealTimers();
  }
});

test("a timed drill resumes its persisted clock after a remount", () => {
  vi.useFakeTimers();
  try {
    seedStore({
      drills: [
        {
          id: "resume-clock",
          name: "Resumed timed",
          mode: "timed",
          qids: [QUESTIONS[0].id],
          answers: {},
          checked: {},
          flagged: {},
          strikes: {},
          index: 0,
          limitSec: 100,
          elapsedSec: 5,
          startedAt: Date.now(),
          done: false,
        },
      ],
    });
    renderAt("/drill/resume-clock");

    expect(screen.getByRole("timer")).toHaveTextContent("1:35");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("1:34");
    expect(readPersisted().drills[0].elapsedSec).toBe(6);
  } finally {
    vi.useRealTimers();
  }
});

test("keyboard a–d selects, Enter checks and advances, f flags, arrows navigate", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=diagnostic-20");
  await user.click(screen.getByRole("button", { name: /start drill/i }));
  const drill = readPersisted().drills[0];
  const first = QUESTION_BY_ID.get(drill.qids[0])!;

  fireEvent.keyDown(window, { key: "a" });
  expect(screen.getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "true");

  fireEvent.keyDown(window, { key: "Enter" });
  expect(screen.getByRole("status")).toHaveAttribute(
    "data-verdict",
    first.answer === 0 ? "correct" : "wrong",
  );

  fireEvent.keyDown(window, { key: "Enter" });
  expect(screen.getByText("Question 2 of 20")).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "ArrowLeft" });
  expect(screen.getByText("Question 1 of 20")).toBeInTheDocument();
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(screen.getByText("Question 2 of 20")).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "f" });
  expect(screen.getByRole("button", { name: /^flagged$/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(readPersisted().drills[0].flagged[drill.qids[1]]).toBe(true);

  fireEvent.keyDown(window, { key: "f" });
  expect(screen.getByRole("button", { name: /^flag$/i })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("shortcuts ignore inputs, selects, textareas, and contenteditable targets", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=diagnostic-20");
  await user.click(screen.getByRole("button", { name: /start drill/i }));

  for (const tag of ["input", "select", "textarea"] as const) {
    const field = document.createElement(tag);
    document.body.appendChild(field);
    field.focus();
    fireEvent.keyDown(field, { key: "a" });
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.keyDown(field, { key: "f" });
    fireEvent.keyDown(field, { key: "ArrowRight" });
    field.remove();
  }
  const editable = document.createElement("div");
  editable.setAttribute("contenteditable", "true");
  document.body.appendChild(editable);
  editable.focus();
  fireEvent.keyDown(editable, { key: "b" });
  editable.remove();

  expect(screen.getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "false");
  expect(screen.getAllByRole("radio")[1]).toHaveAttribute("aria-checked", "false");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByText("Question 1 of 20")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^flag$/i })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("the question map jumps and reflects answered, flagged, and current states", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=diagnostic-20");
  await user.click(screen.getByRole("button", { name: /start drill/i }));

  const map = screen.getByRole("group", { name: "Question map" });
  expect(within(map).getAllByRole("button")).toHaveLength(20);
  expect(
    within(map).getByRole("button", { name: "Question 1" }),
  ).toHaveAttribute("aria-current", "true");

  await user.click(within(map).getByRole("button", { name: "Question 5" }));
  expect(screen.getByText("Question 5 of 20")).toBeInTheDocument();
  expect(
    within(map).getByRole("button", { name: "Question 5" }),
  ).toHaveAttribute("aria-current", "true");

  await user.click(screen.getAllByRole("radio")[0]);
  expect(
    within(map).getByRole("button", { name: "Question 5, answered" }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^flag$/i }));
  expect(
    within(map).getByRole("button", { name: "Question 5, answered, flagged" }),
  ).toBeInTheDocument();
  expect(readPersisted().drills[0].index).toBe(4);
});

test("eliminations persist in the drill and toggle back", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=diagnostic-20");
  await user.click(screen.getByRole("button", { name: /start drill/i }));
  const drill = readPersisted().drills[0];
  const qid = drill.qids[0];

  await user.click(screen.getByRole("button", { name: "Eliminate A" }));
  expect(screen.getByRole("button", { name: "Undo A" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(readPersisted().drills[0].strikes[qid]).toEqual(["A"]);

  await user.click(screen.getByRole("button", { name: "Undo A" }));
  expect(readPersisted().drills[0].strikes[qid]).toEqual([]);
});

test("a drill resumes its index, answers, and flags after a remount", async () => {
  const user = userEvent.setup();
  const first = renderAt("/practice?preset=diagnostic-20");
  await user.click(screen.getByRole("button", { name: /start drill/i }));
  const drill = readPersisted().drills[0];

  await user.click(screen.getAllByRole("radio")[1]);
  await user.click(screen.getByRole("button", { name: /^flag$/i }));
  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getAllByRole("radio")[2]);
  first.unmount();

  renderAt(`/drill/${drill.id}`);
  expect(screen.getByText("Question 2 of 20")).toBeInTheDocument();
  expect(screen.getAllByRole("radio")[2]).toHaveAttribute("aria-checked", "true");

  await user.click(screen.getByRole("button", { name: /^previous$/i }));
  expect(screen.getAllByRole("radio")[1]).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("button", { name: /^flagged$/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const map = screen.getByRole("group", { name: "Question map" });
  expect(
    within(map).getByRole("button", { name: "Question 1, answered, flagged" }),
  ).toBeInTheDocument();
});

test("practice check records exactly one practice attempt and stays checked after resume", async () => {
  const user = userEvent.setup();
  const first = renderAt("/practice?preset=diagnostic-20");
  await user.click(screen.getByRole("button", { name: /start drill/i }));
  const drill = readPersisted().drills[0];
  const q = QUESTION_BY_ID.get(drill.qids[0])!;
  const letter = String.fromCharCode(65 + q.answer);

  await user.click(screen.getAllByRole("radio")[q.answer]);
  const check = screen.getByRole("button", { name: /^check$/i });
  await user.click(check);
  expect(check).toBeDisabled();
  expect(screen.getAllByRole("radio")[0]).toBeDisabled();

  const persisted = readPersisted();
  expect(persisted.attempts).toHaveLength(1);
  expect(persisted.attempts[0]).toMatchObject({
    qid: q.id,
    correct: true,
    answer: letter,
    mode: "practice",
  });
  expect(typeof persisted.attempts[0].ts).toBe("number");
  expect(persisted.attempts[0].elapsedSec).toBeGreaterThanOrEqual(0);

  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getByRole("button", { name: /^previous$/i }));
  expect(screen.getByRole("button", { name: /^check$/i })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveAttribute("data-verdict", "correct");
  first.unmount();

  renderAt(`/drill/${drill.id}`);
  expect(screen.getByRole("button", { name: /^check$/i })).toBeDisabled();
  expect(readPersisted().attempts).toHaveLength(1);
});

test("the submit modal reports unanswered and flagged counts and can be cancelled", async () => {
  const user = userEvent.setup();
  renderAt("/practice?preset=diagnostic-20");
  await user.click(screen.getByRole("button", { name: /start drill/i }));
  const drill = readPersisted().drills[0];

  await user.click(screen.getAllByRole("radio")[0]);
  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getAllByRole("radio")[1]);
  await user.click(screen.getByRole("button", { name: /^flag$/i }));

  const trigger = screen.getByRole("button", { name: /submit drill/i });
  await user.click(trigger);

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(
    within(dialog).getByText("18 unanswered · 1 flagged"),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByRole("button", { name: /keep working/i }),
  ).toHaveFocus();

  await user.click(
    within(dialog).getByRole("button", { name: /keep working/i }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(readPersisted().drills[0].done).toBe(false);

  await user.click(trigger);
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: /^submit$/i }),
  );
  expect(screen.getByTestId("location-pathname").textContent).toBe(
    `/drill/${drill.id}/results`,
  );
});

test("an unknown drill id shows an honest not-found state", () => {
  renderAt("/drill/does-not-exist");

  expect(
    screen.getByRole("heading", { level: 1, name: /drill not found/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /back to practice/i }),
  ).toHaveAttribute("href", "/practice");
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
});

test("a finished drill links to its results instead of replaying", () => {
  seedStore({
    drills: [
      {
        id: "done-drill",
        name: "Finished",
        mode: "practice",
        qids: [QUESTIONS[0].id],
        answers: {},
        checked: {},
        flagged: {},
        strikes: {},
        index: 0,
        limitSec: 0,
        elapsedSec: 0,
        startedAt: 1,
        finishedAt: 2,
        done: true,
      },
    ],
  });
  renderAt("/drill/done-drill");

  expect(
    screen.getByRole("heading", { level: 1, name: /drill finished/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /view results/i })).toHaveAttribute(
    "href",
    "/drill/done-drill/results",
  );
  expect(
    screen.getByRole("link", { name: /back to practice/i }),
  ).toHaveAttribute("href", "/practice");
});

/* ---------------------------------------------------------------
   Results, Progress, Review
   --------------------------------------------------------------- */

function mkAttempt(qid: string, correct: boolean, ts = 1): import("../src/data/types").Attempt {
  return { qid, correct, answer: correct ? "A" : "B", ts, elapsedSec: 1, mode: "single" };
}

const letterOf = (q: import("../src/data/types").Question) => String.fromCharCode(65 + q.answer);
const wrongOf = (q: import("../src/data/types").Question) => String.fromCharCode(65 + ((q.answer + 1) % 4));

function resultsFixture(overrides: Record<string, unknown> = {}) {
  const [a, b, c] = QUESTIONS;
  return {
    id: "results-drill",
    name: "Results fixture",
    mode: "practice",
    qids: [a.id, b.id, c.id],
    answers: { [a.id]: letterOf(a), [b.id]: wrongOf(b), [c.id]: letterOf(c) },
    checked: {},
    flagged: {},
    strikes: {},
    index: 0,
    limitSec: 0,
    elapsedSec: 65,
    startedAt: 1,
    finishedAt: 66,
    done: true,
    ...overrides,
  };
}

test("a finished drill shows score, accuracy, time, mode, and per-question review", () => {
  const [a, b, c] = QUESTIONS;
  seedStore({ drills: [resultsFixture()] });
  renderAt("/drill/results-drill/results");

  expect(screen.getByRole("heading", { level: 1, name: /results/i })).toBeInTheDocument();
  const score = within(document.querySelector(".results-score") as HTMLElement);
  expect(score.getByText("2/3")).toBeInTheDocument();
  expect(score.getByText("67%")).toBeInTheDocument();
  expect(score.getByText("1:05")).toBeInTheDocument();
  expect(score.getByText("Practice mode")).toBeInTheDocument();

  const items = document.querySelectorAll(".results-question");
  expect(items).toHaveLength(3);
  const wrongItem = document.querySelector(`.results-question[data-qid="${b.id}"]`) as HTMLElement;
  expect(wrongItem).toHaveAttribute("data-verdict", "wrong");
  expect(within(wrongItem).getByText(/Chosen/)).toHaveTextContent(wrongOf(b));
  expect(within(wrongItem).getByText(/Correct/)).toHaveTextContent(letterOf(b));
  expect(wrongItem.querySelectorAll("p.solution-paragraph").length).toBeGreaterThanOrEqual(1);
  expect(document.querySelector(`.results-question[data-qid="${a.id}"]`)).toHaveAttribute("data-verdict", "correct");
  expect(document.querySelector(`.results-question[data-qid="${c.id}"]`)).toHaveAttribute("data-verdict", "correct");
});

test("Repair wrong starts a practice drill of only the incorrect qids", async () => {
  const [, b] = QUESTIONS;
  seedStore({ drills: [resultsFixture()] });
  const user = userEvent.setup();
  renderAt("/drill/results-drill/results");

  await user.click(screen.getByRole("button", { name: /repair wrong/i }));

  const drills = readPersisted().drills;
  expect(drills).toHaveLength(2);
  const repair = drills[1];
  expect(repair.qids).toEqual([b.id]);
  expect(repair.mode).toBe("practice");
  expect(repair.limitSec).toBe(0);
  expect(screen.getByTestId("location-pathname").textContent).toBe(`/drill/${repair.id}`);
});

test("Repair wrong is hidden when every answer is correct", () => {
  const [a, b, c] = QUESTIONS;
  seedStore({
    drills: [resultsFixture({ answers: { [a.id]: letterOf(a), [b.id]: letterOf(b), [c.id]: letterOf(c) } })],
  });
  renderAt("/drill/results-drill/results");

  expect(screen.queryByRole("button", { name: /repair wrong/i })).not.toBeInTheDocument();
});

test("Retry reshuffles the same qids in the same mode and limit", async () => {
  const [a, b, c] = QUESTIONS;
  seedStore({ drills: [resultsFixture({ mode: "timed", limitSec: 270 })] });
  const user = userEvent.setup();
  renderAt("/drill/results-drill/results");

  await user.click(screen.getByRole("button", { name: /^retry$/i }));

  const drills = readPersisted().drills;
  expect(drills).toHaveLength(2);
  const retry = drills[1];
  expect([...retry.qids].sort()).toEqual([a.id, b.id, c.id].sort());
  expect(retry.mode).toBe("timed");
  expect(retry.limitSec).toBe(270);
  expect(retry.id).not.toBe("results-drill");
  expect(screen.getByTestId("location-pathname").textContent).toBe(`/drill/${retry.id}`);
});

test("an unfinished drill links back to the player from results", () => {
  seedStore({ drills: [resultsFixture({ done: false, finishedAt: undefined })] });
  renderAt("/drill/results-drill/results");

  expect(screen.getByRole("link", { name: /resume drill/i })).toHaveAttribute(
    "href",
    "/drill/results-drill",
  );
});

test("an unknown results id shows not-found with a way back to practice", () => {
  renderAt("/drill/nope/results");

  expect(screen.getByRole("heading", { level: 1, name: /not found/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /back to practice/i })).toHaveAttribute("href", "/practice");
});

test("progress shows KPIs, the accuracy ring, and the local-only sync line", () => {
  const [a, b] = QUESTIONS;
  seedStore({ attempts: [mkAttempt(a.id, true), mkAttempt(b.id, false)] });
  renderAt("/progress");

  expect(screen.getByRole("heading", { level: 1, name: /progress/i })).toBeInTheDocument();
  expect(screen.getByText("Local only — sync arrives in a later build")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Overall accuracy, 50%" })).toBeInTheDocument();
  expect(document.querySelector('[data-kpi="attempted"]')?.textContent).toContain("2");
  expect(document.querySelector('[data-kpi="due"]')?.textContent).toContain("0");
});

test("weakest topics offer a drill of the topic qids", async () => {
  const kinetics = QUESTIONS.filter((q) => q.topic === "Kinetics");
  seedStore({ attempts: [mkAttempt(kinetics[0].id, false), mkAttempt(kinetics[1].id, false)] });
  const user = userEvent.setup();
  renderAt("/progress");

  const buttons = screen.getAllByRole("button", { name: /drill this/i });
  expect(buttons).toHaveLength(1);
  await user.click(buttons[0]);

  const drill = readPersisted().drills[0];
  expect(drill.mode).toBe("practice");
  expect(drill.limitSec).toBe(0);
  expect(drill.qids).toEqual(kinetics.map((q) => q.id));
  expect(screen.getByTestId("location-pathname").textContent).toBe(`/drill/${drill.id}`);
});

test("a strong topic is not listed as weak", () => {
  const gases = QUESTIONS.filter((q) => q.topic === "Gases");
  seedStore({ attempts: [mkAttempt(gases[0].id, true), mkAttempt(gases[1].id, true)] });
  renderAt("/progress");

  expect(screen.queryByRole("button", { name: /drill this/i })).not.toBeInTheDocument();
});

test("progress lists the ten most recent attempts", () => {
  const attempts = QUESTIONS.slice(0, 12).map((q, i) => mkAttempt(q.id, i % 2 === 0, i + 1));
  seedStore({ attempts });
  renderAt("/progress");

  const recent = screen.getByRole("list", { name: /recent attempts/i });
  expect(within(recent).getAllByRole("listitem")).toHaveLength(10);
});

test("progress exports the store as a JSON download", async () => {
  seedStore({ attempts: [mkAttempt(QUESTIONS[0].id, true)] });
  const createObjectURL = vi.fn(() => "blob:chembank");
  const revokeObjectURL = vi.fn();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  try {
    const user = userEvent.setup();
    renderAt("/progress");
    await user.click(screen.getByRole("button", { name: /export/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

test("progress imports a valid file and reports failure on a bad one", async () => {
  const user = userEvent.setup();
  renderAt("/progress");
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).not.toBeNull();

  const payload = JSON.stringify({
    version: 1,
    attempts: [mkAttempt(QUESTIONS[0].id, true)],
    drills: [],
    review: [],
    stashed: [],
    theme: "auto",
    createdAt: 5,
  });
  await user.upload(input, new File([payload], "export.json", { type: "application/json" }));
  expect(await screen.findByText(/imported/i)).toBeInTheDocument();
  expect(readPersisted().attempts).toHaveLength(1);

  await user.upload(input, new File(["{not json"], "bad.json", { type: "application/json" }));
  expect(await screen.findByText(/import failed/i)).toBeInTheDocument();
  expect(readPersisted().attempts).toHaveLength(1);
});

test("progress reset asks for confirmation and clears the notebook", async () => {
  seedStore({ attempts: [mkAttempt(QUESTIONS[0].id, true)], stashed: [QUESTIONS[1].id] });
  const user = userEvent.setup();
  renderAt("/progress");

  await user.click(screen.getByRole("button", { name: /^reset$/i }));
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  await user.click(within(dialog).getByRole("button", { name: /keep/i }));
  expect(readPersisted().attempts).toHaveLength(1);

  await user.click(screen.getByRole("button", { name: /^reset$/i }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /reset everything/i }));
  expect(readPersisted().attempts).toEqual([]);
  expect(readPersisted().stashed).toEqual([]);
});

test("review tabs show counts and switch between wrong, flagged, and due", async () => {
  const [a, b, c] = QUESTIONS;
  const now = Date.now();
  seedStore({
    attempts: [mkAttempt(a.id, false), mkAttempt(b.id, true)],
    stashed: [c.id],
    review: [{ qid: a.id, dueAt: now - 1000, step: 0, lastSeen: now - 2000 }],
  });
  const user = userEvent.setup();
  renderAt("/review");

  expect(screen.getByRole("heading", { level: 1, name: /review/i })).toBeInTheDocument();
  const wrongTab = screen.getByRole("tab", { name: /wrong/i });
  expect(wrongTab).toHaveAttribute("aria-selected", "true");
  expect(wrongTab.textContent).toContain("1");
  expect(screen.getByRole("tab", { name: /flagged/i }).textContent).toContain("1");
  expect(screen.getByRole("tab", { name: /due/i }).textContent).toContain("1");

  await user.click(screen.getByRole("tab", { name: /flagged/i }));
  expect(screen.getByRole("tab", { name: /flagged/i })).toHaveAttribute("aria-selected", "true");
  await user.click(screen.getByRole("tab", { name: /due/i }));
  expect(screen.getByRole("tab", { name: /due/i })).toHaveAttribute("aria-selected", "true");
});

test("review items show a stem preview and the last result", () => {
  const a = QUESTIONS[0];
  seedStore({ attempts: [mkAttempt(a.id, false)] });
  renderAt("/review");

  const item = document.querySelector(`[data-qid="${a.id}"]`);
  expect(item).not.toBeNull();
  expect(item?.textContent).toContain(a.topic);
  expect(item?.textContent).toMatch(/wrong/i);
});

test("Remove on the flagged tab unstashes the item", async () => {
  const c = QUESTIONS[2];
  seedStore({ stashed: [c.id] });
  const user = userEvent.setup();
  renderAt("/review");

  await user.click(screen.getByRole("tab", { name: /flagged/i }));
  await user.click(screen.getByRole("button", { name: /remove/i }));
  expect(readPersisted().stashed).toEqual([]);
});

test("Remove on the due tab clears the review item", async () => {
  const a = QUESTIONS[0];
  const now = Date.now();
  seedStore({ review: [{ qid: a.id, dueAt: now - 1000, step: 0, lastSeen: 0 }] });
  const user = userEvent.setup();
  renderAt("/review");

  await user.click(screen.getByRole("tab", { name: /due/i }));
  await user.click(screen.getByRole("button", { name: /remove/i }));
  expect(readPersisted().review).toEqual([]);
});

test("Review due starts a practice drill of the due qids, oldest first", async () => {
  const [a, b] = QUESTIONS;
  const now = Date.now();
  seedStore({
    review: [
      { qid: b.id, dueAt: now - 1000, step: 0, lastSeen: 0 },
      { qid: a.id, dueAt: now - 5000, step: 0, lastSeen: 0 },
    ],
  });
  const user = userEvent.setup();
  renderAt("/review");

  const button = screen.getByRole("button", { name: /review due/i });
  expect(button).toBeEnabled();
  await user.click(button);

  const drill = readPersisted().drills[0];
  expect(drill.qids).toEqual([a.id, b.id]);
  expect(drill.mode).toBe("practice");
  expect(drill.limitSec).toBe(0);
  expect(screen.getByTestId("location-pathname").textContent).toBe(`/drill/${drill.id}`);
});

test("Review due is disabled when nothing is due", () => {
  renderAt("/review");
  expect(screen.getByRole("button", { name: /review due/i })).toBeDisabled();
});

test("review shows honest empty states on a fresh store", async () => {
  const user = userEvent.setup();
  renderAt("/review");

  expect(screen.getByText(/no wrong answers/i)).toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: /flagged/i }));
  expect(screen.getByText(/nothing stashed/i)).toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: /due/i }));
  expect(screen.getByText(/nothing is due/i)).toBeInTheDocument();
});
