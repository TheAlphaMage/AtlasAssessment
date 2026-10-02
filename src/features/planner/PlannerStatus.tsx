/**
 * Everything shown while the plan is not ready: loading, rejected workbook or server error.
 * Also holds the invisible live region that announces changes to screen readers.
 */
import { LoadingState, ServerErrorState, ValidationErrorState } from "./states";
import type { Phase } from "./usePlanner";

interface PlannerStatusProps {
  phase: Phase;
  onRetry: () => void;
}

function announcementFor(phase: Phase): string {
  if (phase.kind === "loading") return phase.step === "load" ? "Loading workbook" : "Computing plan";
  if (phase.kind === "ready") return "Plan ready";
  if (phase.kind === "invalid") return `Workbook rejected with ${phase.issues.length} validation issues`;
  return "Server error";
}

export function PlannerStatus({ phase, onRetry }: PlannerStatusProps) {
  return (
    <>
      <div aria-live="polite" className="sr-only">
        {announcementFor(phase)}
      </div>

      {phase.kind === "loading" && <LoadingState step={phase.step} />}
      {phase.kind === "invalid" && (
        <ValidationErrorState issues={phase.issues} workbookFile={phase.workbookFile} onRetry={onRetry} />
      )}
      {phase.kind === "error" && <ServerErrorState message={phase.message} during={phase.during} onRetry={onRetry} />}
    </>
  );
}
