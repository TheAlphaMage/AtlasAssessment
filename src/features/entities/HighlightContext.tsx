"use client";

/**
 * "What is the pointer on right now?" Any ID link sets it on hover/focus; the Crop flow chart reads it
 * to light up matching ribbons. Two contexts keep re-renders small: most components only need the setter.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Selection } from "./selection";

const HighlightValueContext = createContext<Selection>({});
const HighlightSetterContext = createContext<(selection: Selection) => void>(() => {});

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [highlight, setHighlight] = useState<Selection>({});
  return (
    <HighlightSetterContext.Provider value={setHighlight}>
      <HighlightValueContext.Provider value={highlight}>{children}</HighlightValueContext.Provider>
    </HighlightSetterContext.Provider>
  );
}

export function useHighlight(): Selection {
  return useContext(HighlightValueContext);
}

export function useSetHighlight(): (selection: Selection) => void {
  return useContext(HighlightSetterContext);
}
