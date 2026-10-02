"use client";

/**
 * "Trace" lets any farm, client or segment ID on screen jump to its allocations
 * and light up the matching ribbons in the Crop Flow diagram.
 *
 * Two contexts are used on purpose:
 *  - TraceContext holds stable things (actions and ID lists), so most components never re-render on hover.
 *  - HighlightContext holds the changing "what is hovered right now" value; only the diagram reads it.
 */
import { createContext, useContext } from "react";
import type { Segment } from "@/lib/domain/types";

/** One thing the user is pointing at. Fields are optional because a filter may use any combination. */
export interface Selection {
  clientId?: string;
  farmId?: string;
  segment?: Segment;
}

interface TraceContextValue {
  /** Open the Allocations view filtered to this selection. */
  traceTo: (selection: Selection) => void;
  /** Mark something as hovered/focused so the diagram can highlight it. Pass {} to clear. */
  setHighlight: (selection: Selection) => void;
  farmIds: Set<string>;
  clientIds: Set<string>;
}

export const TraceContext = createContext<TraceContextValue>({
  traceTo: () => {},
  setHighlight: () => {},
  farmIds: new Set(),
  clientIds: new Set(),
});

export const HighlightContext = createContext<Selection>({});

export function useTrace(): TraceContextValue {
  return useContext(TraceContext);
}

export function useHighlight(): Selection {
  return useContext(HighlightContext);
}
