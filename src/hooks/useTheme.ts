"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "./themeStorage";

export type Theme = "light" | "dark";

/**
 * Light/dark theme. The first value is set before the page paints by the small script in layout.tsx,
 * so this hook only reads it and lets the user flip it.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode). The theme still changes for this visit.
    }
  }, [theme]);

  return { theme, toggleTheme };
}
