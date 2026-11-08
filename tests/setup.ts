import "@testing-library/jest-dom/vitest";

class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error test stub
globalThis.IntersectionObserver = IO;
