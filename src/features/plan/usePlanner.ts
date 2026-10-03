"use client";

import { useCallback, useEffect, useState } from "react";
import type { LoadResponse, PlanResponse, ValidationIssue } from "@/lib/domain/types";
import { describeFailure, postJson } from "./api";

/** Everything the screen can be showing, as one value, so impossible combinations cannot happen. */
export type Phase =
  | { kind: "loading"; step: "load" | "plan" }
  | { kind: "invalid"; issues: ValidationIssue[]; workbookFile: string }
  | { kind: "error"; message: string; during: "load" | "plan" }
  | { kind: "ready"; data: PlanResponse };

/**
 * Runs the two server steps in order: 1. load + validate the workbook, 2. compute the plan.
 * Starts automatically on first render. Call `reload` to run both steps again.
 */
export function usePlanner() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading", step: "load" });

  const reload = useCallback(async () => {
    setPhase({ kind: "loading", step: "load" });
    try {
      // 1. Load and validate the workbook.
      const load = await postJson<LoadResponse>("/api/load");
      const loaded = load.body as LoadResponse | null;

      if (load.status === 422 && loaded?.status === "invalid") {
        setPhase({ kind: "invalid", issues: loaded.issues, workbookFile: loaded.workbookFile });
        return;
      }
      if (load.status !== 200 || loaded?.status !== "valid") {
        setPhase({ kind: "error", message: describeFailure(load.status, load.body), during: "load" });
        return;
      }

      // 2. Compute the plan.
      setPhase({ kind: "loading", step: "plan" });
      const planned = await postJson<PlanResponse>("/api/plan");
      if (planned.status !== 200 || !planned.body || !("result" in planned.body)) {
        setPhase({ kind: "error", message: describeFailure(planned.status, planned.body), during: "plan" });
        return;
      }
      setPhase({ kind: "ready", data: planned.body });
    } catch (error) {
      setPhase({ kind: "error", message: (error as Error).message, during: "load" });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { phase, reload: () => void reload() };
}
