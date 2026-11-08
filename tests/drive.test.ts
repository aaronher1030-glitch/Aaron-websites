import { imageThumb, imageFull, docThumb } from "../shared/drive";

test("uses Drive conversion for HEIC and lh3 for JPEG", () => {
  expect(imageThumb("abc", "image/heic")).toContain("drive.google.com/thumbnail");
  expect(imageThumb("abc", "image/jpeg")).toBe("https://lh3.googleusercontent.com/d/abc=w800");
  expect(imageFull("abc", "image/png")).toContain("=w2000");
  expect(docThumb("abc")).toContain("sz=w600");
});
