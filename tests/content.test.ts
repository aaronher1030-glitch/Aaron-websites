import { ACTIVITIES } from "../src/content/activities";
import { DOCUMENT_GROUPS } from "../src/content/documents";
import { OFFICERS } from "../src/content/officers";
import { DUTIES, OBJECTIVES } from "../src/content/site";

test("slugs are unique and every activity has copy", () => {
  const slugs = ACTIVITIES.map((a) => a.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const a of ACTIVITIES) {
    expect(a.title.length).toBeGreaterThan(3);
    expect(a.caption.length).toBeGreaterThan(30);
    expect(a.caption).not.toMatch(/=formally|who now serves/);
  }
});

test("album covers reference a known album id", () => {
  for (const a of ACTIVITIES.filter((x) => x.cover.kind === "album")) {
    expect(a.album).toMatch(/^[A-Za-z0-9_-]{20,}$/);
  }
});

test("every officer has a published name and role", () => {
  expect(OFFICERS.length).toBe(27);
  for (const o of OFFICERS) {
    expect(o.name.trim().length).toBeGreaterThan(0);
    expect(o.role.trim().length).toBeGreaterThan(0);
  }
});

test("keeps the published activity and officer inventory", () => {
  expect(ACTIVITIES).toHaveLength(10);
  const albumCovers = ACTIVITIES.filter((a) => a.cover.kind === "album");
  expect(albumCovers).toHaveLength(7);
  for (const a of albumCovers) {
    expect(a.cover.kind === "album" && a.cover.album).toBe(a.album);
  }
  expect(ACTIVITIES.filter((a) => a.featured).map((a) => a.slug)).toEqual([
    "world-teachers-day-2026",
  ]);
  const tinig = ACTIVITIES.find((a) => a.slug === "project-tinig");
  expect(tinig?.cover.kind).toBe("none");
  expect(tinig?.album).toBeUndefined();
  expect(tinig?.reportUrl).toBeUndefined();
  for (const a of ACTIVITIES.filter((x) => x.reportUrl)) {
    expect(a.reportUrl).toMatch(/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]{20,}\/view$/);
  }

  expect(new Set(OFFICERS.map((o) => o.name)).size).toBe(27);
  expect(OFFICERS[0]).toMatchObject({
    name: "Hon. Rhian Jade L. Castro",
    role: "SSLG President",
    group: "executive",
  });
  const groups = OFFICERS.reduce<Record<string, number>>((count, o) => {
    count[o.group] = (count[o.group] ?? 0) + 1;
    return count;
  }, {});
  expect(groups).toEqual({ executive: 7, grade: 12, school: 8 });
});

test("keeps the published document groups and About copy", () => {
  expect(DOCUMENT_GROUPS.map((g) => g.key)).toEqual([
    "minutes", "notices", "elections", "proposals", "memorandums", "finance",
  ]);
  expect(OBJECTIVES).toHaveLength(5);
  expect(DUTIES).toHaveLength(3);
});
