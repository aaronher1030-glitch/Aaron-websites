export interface Competition {
  slug: string;
  short: string;
  name: string;
  organizer: string;
  region: string;
  style: "Proof" | "Short answer" | "Mixed" | "Primary";
  format: string;
  duration: string;
  marks: string;
  eligibility: string;
  rounds: string;
  topics: string;
  accent: string;
  source: string;
  sourceLabel: string;
  note?: string;
}

export const COMPETITIONS: Competition[] = [
  {
    slug: "australian-amo",
    short: "Australian AMO",
    name: "Australian Mathematical Olympiad",
    organizer: "Australian Maths Trust (AMT) / AMOC",
    region: "Australia · invitation only",
    style: "Proof",
    format: "6 proof problems on the Summer and Winter papers; Finals are 2 papers of 4 problems.",
    duration: "3 hours (Summer/Winter) · 4 hours per Finals paper",
    marks: "42 marks (Summer/Winter)",
    eligibility: "Year 11 or below, invited students",
    rounds: "Summer → Winter → Finals → IMO/EGMO selection pathway",
    topics:
      "Algebra, number theory, combinatorics, and geometry, all as full written proofs. Recent papers reward inequalities, Diophantine arguments, cyclic quadrilaterals, invariants, and extremal combinatorics.",
    accent: "#155e4b",
    source: "https://amt.edu.au/amo",
    sourceLabel: "AMT",
    note: "The 2026 structure is new: a single 3-hour, 6-problem paper for Summer and Winter, with a separate Finals. Re-verify dates and marks with AMT each year.",
  },
  {
    slug: "american-amo",
    short: "American AMO",
    name: "American Mathematics Olympiad (SIMCC)",
    organizer: "SIMCC with Southern Illinois University",
    region: "50+ countries · open entry",
    style: "Mixed",
    format:
      "25 questions: Section A, 15 multiple choice (3 marks each); Section B, 5 open-ended (5 marks each); Section C, 5 open-ended (6 marks each).",
    duration: "90 minutes",
    marks: "100 marks · no negative marking · no calculators",
    eligibility: "Grades 2–12",
    rounds: "One paper. Strong results can qualify for separate SIMCC events, not a next AMO round.",
    topics:
      "Arithmetic, geometry and mensuration, word problems, patterns, divisibility, spatial reasoning, logic, and later algebra, graphs, Pythagoras, trigonometry, and probability.",
    accent: "#355c9a",
    source: "https://amo.simcc.org/",
    sourceLabel: "SIMCC",
    note: "Award bands are set by local partners, so a Gold in one country may not use the same cut-off as a Gold in another.",
  },
  {
    slug: "asia-amo",
    short: "Asia AMO",
    name: "Asia (Asian) Mathematics Olympiad",
    organizer: "Japan-based Asia Mathematics Olympiad organisation",
    region: "Asia-Pacific · grades 1–8",
    style: "Primary",
    format:
      "2026 preliminary: 10 multiple-choice plus 5 short-answer questions. Finals are held in Tokyo by invitation.",
    duration: "75 minutes (KidBee / KidBee Open) · 90 minutes (Senior / Senior Open)",
    marks: "Short-answer and multiple-choice scoring; no proof paper",
    eligibility: "Grades 1–8, split into KidBee, KidBee Open, Senior, and Senior Open",
    rounds: "Online preliminary → Tokyo finals",
    topics:
      "Arithmetic, patterns, logic, geometry, counting, and gentle algebra, pitched at primary and early secondary level.",
    accent: "#c25a2a",
    source: "https://asiamathsalliance.com/amo-asia-mathematics-olympics-by-japan",
    sourceLabel: "Asia Maths Alliance",
    note: "Organiser names vary across country partners and MEXT is a supporter, not the organiser. Treat format details as year-specific.",
  },
  {
    slug: "asmo",
    short: "ASMO",
    name: "Asian Science and Mathematics Olympiad",
    organizer: "Olympic Education Sdn Bhd (Malaysia) and country partners",
    region: "ASEAN and Asia · grades 1–12",
    style: "Mixed",
    format:
      "25 questions worth 3, 4, or 5 marks, total 100. Format shifts by grade from multiple choice to short answer.",
    duration: "75–120 minutes depending on grade",
    marks: "100 marks",
    eligibility: "Grades 1–12",
    rounds: "National/State Round → ASMO International/Global Round by invitation",
    topics:
      "Grade-level number, algebra, geometry, measurement, statistics, and problem solving — plus Science, and in some rounds English or Bahasa Melayu.",
    accent: "#8a5a00",
    source: "https://www.asmo2u.com/",
    sourceLabel: "ASMO",
    note: "ASMO is not the Asian Mathematical Olympiad. Its official name is the Asian Science and Mathematics Olympiad, and it is multi-subject.",
  },
  {
    slug: "pamo",
    short: "PAMO",
    name: "Pan-African Mathematics Olympiad",
    organizer: "African Mathematical Union / AMUPAMOC",
    region: "Africa · national teams",
    style: "Proof",
    format: "3 proof problems per day on each of two days.",
    duration: "4.5 hours per day",
    marks: "7 marks per problem · 42 total · no calculators",
    eligibility: "Secondary students under 20, up to 6 per country",
    rounds: "Single annual team event",
    topics:
      "IMO-style algebra, geometry, combinatorics, and number theory, all requiring complete proofs.",
    accent: "#6b3f8c",
    source: "https://www.pamoofficial.org/",
    sourceLabel: "PAMO",
    note: "National team selection is handled by each country's mathematical olympiad body.",
  },
];

export const AMO_FAQ = [
  {
    q: "Which AMO does Lemma prepare me for?",
    a: "All of the main ones, but not with one generic paper. The problem bank trains the underlying olympiad skills — proof, number theory, combinatorics, geometry, algebra — and the AMO Guide tells you which format you are actually sitting. Use the Australian or PAMO track if your contest is proof-based; use the short-answer track for SIMCC or Asia AMO.",
  },
  {
    q: "Are these real AMO past papers?",
    a: "Some are. The official collection contains all 40 questions from the Australian AMO papers 2016–2020, transcribed with attribution to the Australian Mathematics Trust. Everything else is original Lemma content. The outlines and rubrics for official questions are Lemma's own, not official solutions.",
  },
  {
    q: "Is Lemma affiliated with AMT, SIMCC, ASMO, or PAMO?",
    a: "No. Lemma is independent. It uses the competition names only to describe formats and help students choose the right practice. All trademarks belong to their owners.",
  },
  {
    q: "How current is the competition information?",
    a: "The comparison was last checked in November 2026 against the organisers' public pages. Formats change — the Australian AMO restructured in 2026 and the Asia AMO changed its paper in 2026 — so always confirm dates and rules with the official organiser before you rely on them.",
  },
  {
    q: "Why are some problems marked Challenge / Proof?",
    a: "Proofs are self-assessed. Write your solution, reveal the model proof for an original prompt or the Lemma outline for an official question, and mark yourself against a four-point rubric. There is no automatic proof grader.",
  },
  {
    q: "Do I need an account?",
    a: "No. Progress is stored in your browser with localStorage. You can export it as JSON and import it on another device. Clearing your browser data will clear your progress unless you export first.",
  },
];

export const STUDY_PLAN = [
  {
    week: "Week 1",
    focus: "Diagnose",
    detail:
      "Take the 5-problem diagnostic and one 10-problem mixed set. Do not chase speed. Mark every question you could not start, not just the ones you got wrong.",
  },
  {
    week: "Week 2",
    focus: "Algebra foundations",
    detail:
      "Drill Vieta, functional equations, and inequalities. Write the equality case before you write the proof. Aim for 80% accuracy on Medium before moving to Hard.",
  },
  {
    week: "Week 3",
    focus: "Number theory",
    detail:
      "Work through divisibility, modular arithmetic, and Diophantine equations. For every solution, name the key move: factorization, a modulus, a bound, or descent.",
  },
  {
    week: "Week 4",
    focus: "Geometry",
    detail:
      "Angle chase daily. Do one cyclic-quadrilateral problem and one area-ratio problem per session. Redraw the figure yourself; never trust the provided diagram.",
  },
  {
    week: "Week 5",
    focus: "Combinatorics",
    detail:
      "Alternate counting and invariants. Before calculating, write the sample space or the state. If a count feels long, look for a complement or a bijection.",
  },
  {
    week: "Week 6",
    focus: "Proof writing",
    detail:
      "Do three Proof Lab prompts. Use the rubric: claim, justification, conclusion. Have someone else read one proof for gaps you cannot see.",
  },
  {
    week: "Week 7",
    focus: "Timed simulation",
    detail:
      "Run the AMO proof paper preset (6 problems, 3 hours) or the short-answer sprint. Stop when the timer stops. Mark honestly, then review every unfinished problem.",
  },
  {
    week: "Week 8",
    focus: "Repair and taper",
    detail:
      "Only review mistakes and stashed problems. Re-solve each one from a blank page. Do not start new topics in the last week before a contest.",
  },
];

export const SOURCES = [
  {
    label: "Australian Maths Trust — AMO",
    url: "https://amt.edu.au/amo",
    note: "Format, eligibility, dates, and awards for the Australian AMO.",
  },
  {
    label: "AMT — Olympiad program update",
    url: "https://amt.edu.au/olympiad-program-update",
    note: "2026 restructuring of the Australian olympiad pathway.",
  },
  {
    label: "SIMCC — American Mathematics Olympiad",
    url: "https://amo.simcc.org/",
    note: "Paper structure, sections, marks, and eligibility.",
  },
  {
    label: "Asia Maths Alliance — Asia AMO",
    url: "https://asiamathsalliance.com/amo-asia-mathematics-olympics-by-japan",
    note: "Categories and 2026 preliminary format.",
  },
  {
    label: "ASMO official",
    url: "https://www.asmo2u.com/",
    note: "Rounds, subjects, and grade bands.",
  },
  {
    label: "PAMO official",
    url: "https://www.pamoofficial.org/",
    note: "Regulations and two-day proof format.",
  },
];

export const VERIFIED = "November 2026";
