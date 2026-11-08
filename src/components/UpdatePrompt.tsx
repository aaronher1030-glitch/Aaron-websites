import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * The update prompt is deliberately manual: a service-worker refresh in the
 * middle of a timed drill would lose the elapsed clock and the current answer,
 * so the student decides when to reload.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) return null;

  return (
    <div className="update-toast" role="status" aria-live="polite">
      <p>
        <strong>A new ChemBank build is ready.</strong> Reload when you are not
        in the middle of a drill.
      </p>
      <div className="update-toast-actions">
        <button
          type="button"
          className="home-button home-button-primary"
          onClick={() => void updateServiceWorker(true)}
        >
          Reload
        </button>
        <button
          type="button"
          className="home-button home-button-secondary"
          onClick={() => setNeedRefresh(false)}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
