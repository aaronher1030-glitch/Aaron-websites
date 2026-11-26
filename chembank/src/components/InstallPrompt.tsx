import { useEffect, useState } from "react";

const DISMISS_KEY = "chembank:install-dismissed";

/** Chromium's non-standard install event; absent in unsupported browsers. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Quiet, opt-in PWA install affordance for the header tools. Renders nothing
 * unless the browser fires `beforeinstallprompt`, and never nags: dismissing
 * (here or in the native dialog) is persisted and hides it for good.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      // Suppress the browser's automatic mini-infobar; we offer our own.
      event.preventDefault();
      if (readDismissed()) return;
      setDeferred(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* Storage unavailable: still hide for this session. */
    }
    setDismissed(true);
    setDeferred(null);
  }

  async function handleInstall() {
    if (!deferred) return;
    const event = deferred;
    // Hide immediately so a double-click cannot call prompt() twice.
    setDeferred(null);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "dismissed") dismiss();
    } catch {
      /* Prompt unavailable or already consumed: stay quiet. */
    }
  }

  if (!deferred || dismissed) return null;

  return (
    <div className="install-prompt">
      <button
        type="button"
        className="install-prompt-action"
        onClick={handleInstall}
        aria-label="Install ChemBank"
        title="Install ChemBank for offline use"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3.5v10.5M7.5 9.5 12 14l4.5-4.5" />
            <path d="M4.5 16.5v2.6a1.4 1.4 0 0 0 1.4 1.4h12.2a1.4 1.4 0 0 0 1.4-1.4v-2.6" />
          </g>
        </svg>
        <span>Install ChemBank</span>
      </button>
      <button
        type="button"
        className="install-prompt-dismiss"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        title="Dismiss"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M6.5 6.5l11 11M17.5 6.5l-11 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}