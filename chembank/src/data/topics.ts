import type { Domain } from "./types";

/**
 * A canonical topic. `name` is the exact string stored on `Question.topic`;
 * `slug` is the kebab-case form used in URLs and filters. `chapter` is the
 * Chang chapter a topic sits in, omitted for topics that span chapters.
 */
export interface Topic {
  slug: string;
  name: string;
  chapter?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  domain: Domain;
}

/** The 13 canonical topics plus the "General chemistry" fallback. */
export const TOPICS: Topic[] = [
  { slug: "measurement-and-units", name: "Measurement and units", chapter: 1, domain: "General" },
  { slug: "atomic-structure", name: "Atomic structure", chapter: 2, domain: "General" },
  { slug: "nomenclature", name: "Nomenclature", chapter: 2, domain: "General" },
  { slug: "stoichiometry", name: "Stoichiometry", chapter: 3, domain: "General" },
  { slug: "aqueous-reactions", name: "Aqueous reactions", chapter: 4, domain: "Analytical" },
  { slug: "gases", name: "Gases", chapter: 5, domain: "Physical" },
  { slug: "thermochemistry", name: "Thermochemistry", chapter: 6, domain: "Physical" },
  {
    slug: "electronic-structure-and-spectroscopy",
    name: "Electronic structure and spectroscopy",
    chapter: 7,
    domain: "Physical",
  },
  { slug: "organic-chemistry", name: "Organic chemistry", domain: "Organic" },
  { slug: "equilibrium-acid-base", name: "Equilibrium and acid–base", domain: "Analytical" },
  { slug: "kinetics", name: "Kinetics", domain: "Physical" },
  { slug: "electrochemistry", name: "Electrochemistry", domain: "Analytical" },
  { slug: "laboratory-technique", name: "Laboratory technique", domain: "Laboratory" },
  { slug: "general-chemistry", name: "General chemistry", domain: "General" },
];

export const TOPIC_BY_SLUG: Map<string, Topic> = new Map(TOPICS.map((t) => [t.slug, t]));

/** Resolves a `Question.topic` string to its canonical topic, if it has one. */
export function topicByName(name: string): Topic | undefined {
  const needle = name.trim().toLowerCase();
  return TOPICS.find((t) => t.name.toLowerCase() === needle);
}
