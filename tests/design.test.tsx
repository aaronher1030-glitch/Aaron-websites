import { render, screen } from "@testing-library/react";
import { Band, CtaBar, SectionTitle } from "../src/components/Band";

test("a band exposes its variant, title and lead", () => {
  const { container } = render(
    <Band variant="mint">
      <SectionTitle title="Latest" lead="Stay updated." />
    </Band>,
  );
  // An unnamed <section> is not exposed as a landmark, so query the class.
  const band = container.querySelector(".band") as HTMLElement;
  expect(band.className).toContain("band--mint");
  expect(screen.getByRole("heading", { level: 2, name: "Latest" })).toBeInTheDocument();
  expect(screen.getByText("Stay updated.")).toBeInTheDocument();
});

test("a CTA bar is a link with one accessible name", () => {
  render(<CtaBar href="/accomplishments">Read more accomplishment reports</CtaBar>);
  const link = screen.getByRole("link", { name: "Read more accomplishment reports" });
  expect(link).toHaveAttribute("href", "/accomplishments");
  expect(link.className).toContain("cta-bar");
});
