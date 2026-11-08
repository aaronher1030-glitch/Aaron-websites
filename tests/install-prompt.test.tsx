import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { InstallPrompt } from "../src/components/InstallPrompt";

const DISMISS_KEY = "chembank:install-dismissed";

/** Stubs the browser boundary: a plain Event carrying prompt()/userChoice. */
function makePromptEvent(outcome: "accepted" | "dismissed" = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn(() => Promise.resolve());
  Object.assign(event, {
    prompt,
    userChoice: Promise.resolve({ outcome, platform: "web" }),
  });
  return { event, prompt };
}

function offer(event: Event) {
  act(() => {
    window.dispatchEvent(event);
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

test("renders nothing when the browser never offers installation", () => {
  const { container } = render(<InstallPrompt />);
  expect(container).toBeEmptyDOMElement();
});

test("renders nothing when dismissal was already persisted", () => {
  window.localStorage.setItem(DISMISS_KEY, "1");
  const { container } = render(<InstallPrompt />);
  offer(makePromptEvent().event);
  expect(container).toBeEmptyDOMElement();
});

test("shows the install button when beforeinstallprompt fires", () => {
  render(<InstallPrompt />);
  const { event } = makePromptEvent();
  offer(event);

  expect(
    screen.getByRole("button", { name: /install chembank/i }),
  ).toBeInTheDocument();
  expect(event.defaultPrevented).toBe(true);
});

test("clicking install calls prompt() once and hides after userChoice", async () => {
  const user = userEvent.setup();
  render(<InstallPrompt />);
  const { event, prompt } = makePromptEvent("accepted");
  offer(event);

  await user.click(screen.getByRole("button", { name: /install chembank/i }));
  expect(prompt).toHaveBeenCalledTimes(1);
  await waitFor(() => {
    expect(
      screen.queryByRole("button", { name: /install chembank/i }),
    ).toBeNull();
  });
});

test("dismiss hides the prompt and persists the choice across mounts", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<InstallPrompt />);
  offer(makePromptEvent().event);

  await user.click(
    screen.getByRole("button", { name: /dismiss install prompt/i }),
  );
  expect(
    screen.queryByRole("button", { name: /install chembank/i }),
  ).toBeNull();
  expect(window.localStorage.getItem(DISMISS_KEY)).toBe("1");

  unmount();
  render(<InstallPrompt />);
  offer(makePromptEvent().event);
  expect(
    screen.queryByRole("button", { name: /install chembank/i }),
  ).toBeNull();
});

test("appinstalled hides the prompt", () => {
  render(<InstallPrompt />);
  offer(makePromptEvent().event);
  expect(
    screen.getByRole("button", { name: /install chembank/i }),
  ).toBeInTheDocument();

  act(() => {
    window.dispatchEvent(new Event("appinstalled"));
  });
  expect(
    screen.queryByRole("button", { name: /install chembank/i }),
  ).toBeNull();
});

test("declining the native prompt does not nag on the next offer", async () => {
  const user = userEvent.setup();
  render(<InstallPrompt />);
  offer(makePromptEvent("dismissed").event);

  await user.click(screen.getByRole("button", { name: /install chembank/i }));
  await waitFor(() => {
    expect(window.localStorage.getItem(DISMISS_KEY)).toBe("1");
  });

  offer(makePromptEvent().event);
  expect(
    screen.queryByRole("button", { name: /install chembank/i }),
  ).toBeNull();
});