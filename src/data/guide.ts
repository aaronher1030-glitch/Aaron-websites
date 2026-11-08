/**
 * The PNCO guide. Every claim is deliberately dated and source-linked, and the
 * rules are framed as "verify against the current circular" because eligibility,
 * formats, and awards change between competition cycles. ChemBank is not an
 * organizer and never charges for access.
 */

export interface GuideSource {
  label: string;
  url: string;
  note?: string;
}

export interface GuideSection {
  id: string;
  title: string;
  summary?: string;
  body: string[];
  points?: string[];
  sources?: GuideSource[];
  lastVerified?: string;
}

export const GUIDE_LAST_VERIFIED = "2026-11-07";

const PFCS_GUIDELINES: GuideSource = {
  label: "PFCS 25th PNCO 2026 Guidelines and Mechanics",
  url: "https://www.depedbohol.org/wp-content/uploads/2026/01/DM-No.-048-s.-2026.pdf",
  note: "Circulated via DepEd Bohol Division Memorandum No. 048, s. 2026.",
};

const PFCS_NEWS: GuideSource = {
  label: "PFCS — IChO and PNCO news",
  url: "https://pfcs.org.ph/category/icho-pnco/",
  note: "Organizer announcements and results.",
};

const UPM_FINALS: GuideSource = {
  label: "UP Manila — 24th PNCO national finals",
  url: "https://www.upm.edu.ph/cpt_news/cas-hosts-national-finals-of-24th-philippine-national-chemistry-olympiad/",
  note: "Host announcement for the 24th finals.",
};

const ICHO_2026: GuideSource = {
  label: "International Chemistry Olympiad 2026",
  url: "https://www.icho2026.uz/",
  note: "Official IChO host site.",
};

const ICHO_PHILIPPINES: GuideSource = {
  label: "IChO — Philippines country results",
  url: "https://www.icho-official.org/results/country_info.php?country=Philippines",
  note: "Official delegation record and medal history.",
};

const ACHO: GuideSource = {
  label: "Ateneo Chemistry Society — projects",
  url: "https://ateneochemsoc.org/projects/",
  note: "Organizer page for the Ateneo Chemistry Olympiad.",
};

export const PNCO_GUIDE: GuideSection[] = [
  {
    id: "what-is-pnco",
    title: "What the PNCO is",
    summary:
      "The Philippine National Chemistry Olympiad is the country's national chemistry competition for secondary students.",
    body: [
      "The Philippine National Chemistry Olympiad (PNCO) is organized by the Philippine Federation of Chemistry Societies (PFCS) together with partner institutions. It selects and trains the country's representative team for the International Chemistry Olympiad (IChO).",
      "The competition is aimed at high-school students and is run through schools and regional networks. Students normally enter through their school's coach or science coordinator rather than by registering individually.",
      "ChemBank is an independent study resource. It is not the competition, not the registration portal, and not an official source of rules or results.",
    ],
    points: [
      "Organizer: Philippine Federation of Chemistry Societies (PFCS), with host universities and DepEd division offices.",
      "Audience: secondary-level students preparing for regional and national rounds.",
      "Entry route: through a school coach or coordinator, following the current official circular.",
    ],
    sources: [PFCS_NEWS, PFCS_GUIDELINES],
  },
  {
    id: "structure",
    title: "Two-tier structure and the 2026 finals",
    summary:
      "Regional eliminations feed a national finals that combines written theory, laboratory practical, and a quiz bee.",
    body: [
      "The PNCO runs as a two-tier competition: regional eliminations select students who advance to the national finals. The finals are hosted by a partner university and typically combine a written theory paper, a laboratory practical, and a quiz-bee round.",
      "The 2026 guidelines describe a finals sequence that begins with a two-hour theory paper of roughly 80–100 multiple-choice items; the top 20 scorers advance. The laboratory practical follows, with technique demerits as well as written answers; the top 10 advance. A three-round quiz bee then decides the final ranking, with items worth 3, 5, and 7 points.",
      "Those numbers are a snapshot of one cycle, not a permanent format. Hosts, item counts, advancement cut-offs, and scoring rules can change. Always read the current guidelines before planning travel or training.",
    ],
    points: [
      "Regional eliminations → national finals.",
      "2026 finals: theory paper (about 2 hours, 80–100 items) → top 20 advance.",
      "Laboratory practical with technique demerits → top 10 advance.",
      "Three-round quiz bee with 3-, 5-, and 7-point items.",
    ],
    sources: [PFCS_GUIDELINES, UPM_FINALS],
  },
  {
    id: "eligibility",
    title: "Eligibility, school limits, fees, and advancement",
    summary:
      "Eligibility and slot limits are set annually by the organizers; schools are the usual point of contact.",
    body: [
      "Eligibility rules, the number of students a school may field, and the advancement procedure are specified in the guidelines for each competition year. They are not universal constants. A student who was eligible last year is not automatically eligible this year.",
      "Any registration or participation fee is set by the organizing committee or the participating school. ChemBank does not charge a fee, does not require an account, and never asks for payment. If anyone asks you to pay ChemBank, that request is not from us.",
      "For a definite answer about your school's slots, ask your coach or science coordinator and quote the current official memorandum. Do not rely on a forum post, a screenshot, or this page for a deadline.",
    ],
    points: [
      "Read the current guidelines for eligibility and school quotas.",
      "Ask your school coach or coordinator about nomination and deadlines.",
      "ChemBank is free. It has no registration, subscription, or payment flow.",
      "Advancement cut-offs are announced by the organizers for that cycle.",
    ],
    sources: [PFCS_GUIDELINES, PFCS_NEWS],
  },
  {
    id: "awards",
    title: "Awards and what the published rules leave open",
    summary:
      "Medal recognition is part of the finals, but published summaries do not always pin down every tie-break.",
    body: [
      "The finals recognise top performers with medals and awards. Published summaries, however, do not always state every detail consistently: the exact number of medals, how ties are broken, and whether quiz-bee points are combined with the written and practical scores can differ between circulars and news reports.",
      "Where the public record is ambiguous, treat the official guidelines and the organizers' final announcement as authoritative. This guide flags the ambiguity instead of inventing a rule.",
      "The IChO relationship is clearer: the top four gold awardees are described as forming the Philippine delegation to the International Chemistry Olympiad, subject to the selection and training process in force that year.",
    ],
    points: [
      "Medals and special awards are presented at the national finals.",
      "Tie-breaks and combined-score rules should be checked in the current circular.",
      "Top four gold awardees form the IChO delegation, subject to that year's process.",
    ],
    sources: [PFCS_GUIDELINES, ICHO_PHILIPPINES],
  },
  {
    id: "scope",
    title: "Scope and depth: no single prescribed textbook",
    summary:
      "The syllabus is broad general chemistry with olympiad-level depth; no one textbook is mandated.",
    body: [
      "PNCO coverage is broad general chemistry: measurement, stoichiometry, atomic structure, bonding, gases, thermochemistry, equilibrium, acid–base chemistry, electrochemistry, kinetics, organic chemistry, and laboratory technique. Items can combine topics, so a question labelled “gases” may also test stoichiometry or error propagation.",
      "No single textbook is prescribed. Different coaches use different references, and the official guidelines are the closest thing to a syllabus. Olympiad-level items often go beyond a standard senior-high textbook, especially in equilibrium, organic reasoning, and laboratory design.",
      "ChemBank's chapter notes follow the seven-chapter structure of the supplied practice papers. That structure is a study aid, not an official PNCO syllabus.",
    ],
    points: [
      "Breadth first: every major general-chemistry area can appear.",
      "Depth second: multi-step and data-interpretation items are normal.",
      "The seven chapters on this site are an editorial organisation, not an official syllabus.",
    ],
    sources: [PFCS_GUIDELINES],
  },
  {
    id: "icho",
    title: "The IChO relationship",
    summary:
      "The PNCO is the national pathway to the International Chemistry Olympiad.",
    body: [
      "The International Chemistry Olympiad is the international competition that the PNCO feeds into. Each country sends a small delegation of students, usually four, accompanied by mentors.",
      "The Philippine delegation is drawn from the top performers at the national finals, with the top four gold awardees named in public descriptions. Selection, training, and travel arrangements are handled by the organizers and are subject to change.",
      "IChO papers are substantially harder and more laboratory-oriented than a national qualifying paper. Use them as extension reading, not as a substitute for the current PNCO guidelines.",
    ],
    points: [
      "PNCO is the national selection pathway; IChO is the international final.",
      "The delegation is small and is chosen from the national finals.",
      "IChO-level problems are useful extension material, not a syllabus substitute.",
    ],
    sources: [ICHO_2026, ICHO_PHILIPPINES],
  },
  {
    id: "acho",
    title: "The ACho distinction",
    summary:
      "The Ateneo Chemistry Olympiad is a separate competition with a separate organizer and format.",
    body: [
      "The Ateneo Chemistry Olympiad (ACho) is organized by the Ateneo Chemistry Society. It is a distinct competition with its own format, eligibility, and calendar. It is not the same event as the PNCO and is not an IChO qualifier.",
      "Because the two competitions attract the same students, ChemBank includes ACho-style practice alongside PNCO preparation. The question bank is labelled by topic and source, not by an official competition code, so you can use it for either.",
      "Always confirm ACho rules with the Ateneo Chemistry Society and PNCO rules with PFCS. A single study site cannot replace either organizer's instructions.",
    ],
    points: [
      "ACho: organized by the Ateneo Chemistry Society.",
      "Separate format and eligibility from the PNCO.",
      "ACho is not an IChO qualifying pathway.",
    ],
    sources: [ACHO],
  },
  {
    id: "how-to-use",
    title: "How to use ChemBank",
    summary:
      "Read a chapter, drill it untimed, then run a timed paper and review every miss.",
    body: [
      "Start with the chapter notes and the formula sheet for the topic you are studying. Work a few bank questions untimed, with the worked solution visible only after you commit to an answer. The goal is to notice the reasoning pattern, not to collect correct letters.",
      "When accuracy is comfortable, build a timed drill from the topics you have studied. A timed drill is diagnostic: it shows which errors survive time pressure. Afterward, open Review and re-work the items you missed. Spaced review brings them back after a short delay.",
      "Use the Progress page to find weak topics. A topic with few attempts is not necessarily weak; it is simply unmeasured. Aim for coverage before you chase a high percentage. Everything is stored locally in your browser, so exporting a backup before clearing site data is wise.",
    ],
    points: [
      "Notes → untimed bank questions → timed drill → review.",
      "Read the explanation even when you answer correctly.",
      "Coverage first, accuracy second, speed third.",
      "Progress is local-only; export a backup before clearing browser data.",
    ],
  },
  {
    id: "last-verified",
    title: "Rules change yearly — check the date",
    summary: `Guide last verified ${GUIDE_LAST_VERIFIED}. Re-check before every competition cycle.`,
    body: [
      "Competition rules, eligibility, formats, and awards change. This guide is a dated summary of public sources, not a live feed. The date at the top of this page records when the links and claims were last checked.",
      "If a circular, deadline, or result matters to you, open the official source linked below and confirm it yourself. If you find a factual error in this guide, use the About page to report it with the source you are relying on.",
    ],
    points: [
      `Last verified: ${GUIDE_LAST_VERIFIED}.`,
      "A newer official circular overrides this page.",
      "Report corrections with a source link so they can be checked.",
    ],
    sources: [PFCS_GUIDELINES, PFCS_NEWS, ACHO],
    lastVerified: GUIDE_LAST_VERIFIED,
  },
  {
    id: "not-affiliated",
    title: "Independent and not affiliated with any organizer",
    summary:
      "ChemBank is a student-built study site. It is not endorsed by PFCS, PNCO, DepEd, ACheS, or Ateneo.",
    body: [
      "ChemBank is not affiliated with the Philippine Federation of Chemistry Societies, the PNCO National Committee, the Department of Education, the Ateneo Chemistry Society, or Ateneo de Manila University. It is not an official publication and does not reproduce official past papers.",
      "All practice items are user-supplied or original, and every published answer carries a verification status. The site is free to use, has no ads, no accounts, and no payment flow. It does not collect payment information and has no premium tier.",
      "Names and marks belong to their owners and are used only to describe the competitions this independent reviewer is preparing students for.",
    ],
    points: [
      "No endorsement by PFCS, PNCO, DepEd, ACheS, or Ateneo.",
      "No official past papers are reproduced.",
      "Free, ad-free, account-free, and payment-free.",
      "Corrections are logged and linked from the About page.",
    ],
    sources: [PFCS_NEWS, ACHO],
  },
  {
    id: "sources",
    title: "Sources",
    summary:
      "Primary and secondary sources used for the guide, with the date they were checked.",
    body: [
      `The guide was last checked on ${GUIDE_LAST_VERIFIED}. Links open the organizer or host site in a new tab; ChemBank does not control their content.`,
      "Where a source is a PDF circular, download it and keep the copy you relied on: organizer pages are sometimes reorganised after a competition cycle.",
    ],
    sources: [PFCS_GUIDELINES, PFCS_NEWS, UPM_FINALS, ICHO_2026, ICHO_PHILIPPINES, ACHO],
    lastVerified: GUIDE_LAST_VERIFIED,
  },
];
