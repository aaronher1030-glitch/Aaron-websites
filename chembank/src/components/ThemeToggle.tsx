import { useStore } from "../store";
import { systemTheme } from "../theme";

export function ThemeToggle() {
  const { store, setTheme } = useStore();
  const effective = store.theme === "auto" ? systemTheme() : store.theme;
  const dark = effective === "dark";

  function handleToggle() {
    setTheme(dark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleToggle}
      aria-label="Dark theme"
      aria-pressed={dark}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {dark ? (
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="4.1" />
            <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5" />
          </g>
        ) : (
          <path
            d="M20.2 14.3A8.4 8.4 0 0 1 9.7 3.8 8.4 8.4 0 1 0 20.2 14.3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
