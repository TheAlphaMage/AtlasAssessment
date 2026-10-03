"use client";

/**
 * Pages only render once a valid plan exists. Before that, this shows the loading skeleton,
 * the rejected-workbook view or the server-error view, all inside the normal app shell.
 */
import type { ReactNode } from "react";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { GlobalBanner } from "@/features/banner/GlobalBanner";
import { usePlan } from "./PlanProvider";
import { ServerErrorView } from "./states/ServerErrorView";
import { ValidationErrorView } from "./states/ValidationErrorView";

export function PlanGate({ children }: { children: ReactNode }) {
  const { phase, data, replan } = usePlan();

  if (data) {
    return (
      <>
        <GlobalBanner result={data.result} />
        {children}
      </>
    );
  }
  if (phase.kind === "invalid") {
    return <ValidationErrorView issues={phase.issues} workbookFile={phase.workbookFile} onRetry={replan} />;
  }
  if (phase.kind === "error") {
    return <ServerErrorView message={phase.message} during={phase.during} onRetry={replan} />;
  }
  return <PageSkeleton />;
}
