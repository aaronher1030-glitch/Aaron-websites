/* Runs before first paint so a stored or system dark theme never flashes light.
   Kept as a same-origin file because the CSP forbids inline scripts. */
(function () {
  try {
    var stored = window.localStorage.getItem("chembank:theme");
    var theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#121212" : "#f4f1e8");
    }
  } catch (error) {
    /* Blocked storage: fall back to the light CSS defaults. */
  }
})();
