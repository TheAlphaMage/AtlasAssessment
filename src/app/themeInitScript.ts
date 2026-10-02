import { THEME_STORAGE_KEY } from "@/hooks/themeStorage";

/**
 * Runs in the page <head> before anything is painted, so the right theme shows from the first frame
 * (no white flash in dark mode). Uses the saved choice, or the visitor's system setting on first visit.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("${THEME_STORAGE_KEY}");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;
