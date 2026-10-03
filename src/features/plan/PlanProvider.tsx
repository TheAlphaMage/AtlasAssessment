"use client";

/**
 * Loads and plans the workbook once, then shares the result with every page.
 * While a re-plan runs, the previous plan stays on screen (no flicker); if the re-plan fails,
 * the old figures are removed so nobody acts on stale numbers.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { PlanResponse, PlanResult } from "@/lib/domain/types";
import { usePlanner, type Phase } from "./usePlanner";

interface PlanContextValue {
  phase: Phase;
  /** The plan on screen: the latest ready plan, or the previous one while re-planning. */
  data: PlanResponse | null;
  isRefreshing: boolean;
  replan: () => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { phase, reload } = usePlanner();
  const [lastReady, setLastReady] = useState<PlanResponse | null>(null);
  const isManualReplan = useRef(false);

  useEffect(() => {
    if (phase.kind === "ready") {
      setLastReady(phase.data);
      if (isManualReplan.current) announceReplan(phase.data.result);
      isManualReplan.current = false;
    }
    if (phase.kind === "invalid" || phase.kind === "error") {
      setLastReady(null);
      isManualReplan.current = false;
    }
  }, [phase]);

  const replan = useCallback(() => {
    isManualReplan.current = true;
    reload();
  }, [reload]);

  const value = useMemo<PlanContextValue>(() => {
    const data = planOnScreen(phase, lastReady);
    return { phase, data, isRefreshing: phase.kind === "loading" && lastReady !== null, replan };
  }, [phase, lastReady, replan]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

/** Ready: the new plan. Loading: keep showing the previous plan. Failed: nothing. */
function planOnScreen(phase: Phase, lastReady: PlanResponse | null): PlanResponse | null {
  if (phase.kind === "ready") return phase.data;
  if (phase.kind === "loading") return lastReady;
  return null;
}

function announceReplan(result: PlanResult) {
  const passed = result.invariants.filter((check) => check.passed).length;
  toast.success("Plan recomputed", { description: `${passed}/${result.invariants.length} plan checks passed` });
}

export function usePlan(): PlanContextValue {
  const context = useContext(PlanContext);
  if (!context) throw new Error("usePlan must be used inside <PlanProvider>.");
  return context;
}

/** For page components, which only render once a plan is ready (see PlanGate). */
export function useReadyPlan(): { data: PlanResponse; result: PlanResult } {
  const { data } = usePlan();
  if (!data) throw new Error("useReadyPlan must be used inside <PlanGate>.");
  return { data, result: data.result };
}
