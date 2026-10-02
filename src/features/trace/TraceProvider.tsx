"use client";

/** Wires the two trace contexts. Lives once at the top of the app. */
import { useMemo, useState, type ReactNode } from "react";
import type { PlanResult } from "@/lib/domain/types";
import { HighlightContext, TraceContext, type Selection } from "./TraceContext";

interface TraceProviderProps {
  /** The current plan, used to know which IDs are farms and which are clients. Null before the plan is ready. */
  result: PlanResult | null;
  onTrace: (selection: Selection) => void;
  children: ReactNode;
}

export function TraceProvider({ result, onTrace, children }: TraceProviderProps) {
  const [highlight, setHighlight] = useState<Selection>({});

  const traceValue = useMemo(
    () => ({
      traceTo: onTrace,
      setHighlight,
      farmIds: new Set(result?.farms.map((farm) => farm.farmId) ?? []),
      clientIds: new Set(result?.clients.map((client) => client.clientId) ?? []),
    }),
    [result, onTrace],
  );

  return (
    <TraceContext.Provider value={traceValue}>
      <HighlightContext.Provider value={highlight}>{children}</HighlightContext.Provider>
    </TraceContext.Provider>
  );
}
