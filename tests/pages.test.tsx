import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "../src/App";
import {
  DOMAIN_COUNTS,
  QUESTIONS,
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
