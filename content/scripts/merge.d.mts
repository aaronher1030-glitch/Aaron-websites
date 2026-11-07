export interface TopicMetaEntry {
  name: string;
  chapter?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  domain: "General" | "Physical" | "Analytical" | "Organic" | "Laboratory";
}

export const TOPIC_META: TopicMetaEntry[];
export function resolveTopic(text: string): { topic: string; matched: boolean };
