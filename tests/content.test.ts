import { ACTIVITIES } from "../src/content/activities";
import { OFFICERS } from "../src/content/officers";

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
