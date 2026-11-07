import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { RichText } from "../src/components/RichText";

test("renders inline and display math with mhchem", () => {
  render(<RichText text="Water is $\\ce{H2O}$ and $x^2$." />);
  expect(document.querySelector(".katex")).toBeTruthy();
  expect(screen.getByText(/Water is/)).toBeInTheDocument();
});

test("renders the allowed chemistry HTML subset", () => {
  render(<RichText text="H<sub>2</sub>O and Fe<sup>3+</sup>" />);
  expect(document.querySelector("sub")?.textContent).toBe("2");
  expect(document.querySelector("sup")?.textContent).toBe("3+");
});

test("strips scripts and event handlers", () => {
  const { container } = render(
    <RichText text={'<script>alert(1)</script><img src=x onerror="alert(2)">safe'} />,
  );
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toContain("safe");
});

test("renders display math inside a centered math block", () => {
  const { container } = render(<RichText text={"$$\\frac{1}{2}$$"} />);
  const block = container.querySelector(".math-block");
  expect(block).toBeTruthy();
  expect(block?.querySelector(".katex")).toBeTruthy();
  expect(block?.classList.contains("rich-text")).toBe(false);
});

test("drops attributes from allowed markup", () => {
  const { container } = render(
    <RichText text={'<b onclick="alert(1)">bold</b>'} />,
  );
  const strong = container.querySelector("strong");
  expect(strong).toBeTruthy();
  expect(strong?.textContent).toBe("bold");
  expect(strong?.hasAttribute("onclick")).toBe(false);
  expect(strong?.attributes.length).toBe(0);
  expect(container.innerHTML).not.toContain("onclick");
});

test("renders mhchem chemical formulas through KaTeX", () => {
  const { container } = render(<RichText text={"$\\ce{H2O}$"} />);
  const katex = container.querySelector(".katex");
  expect(katex).toBeTruthy();
  expect(container.querySelector(".katex-error")).toBeNull();
  expect(katex?.textContent).toContain("H");
  expect(katex?.textContent).toContain("O");
});
