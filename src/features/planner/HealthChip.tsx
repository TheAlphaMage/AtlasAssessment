/** Small status chip in the top bar: is the workbook valid and did every plan check pass? */
import { Pill } from "@/components/ui/Pill";
import type { Phase } from "./usePlanner";

interface HealthChipProps {
  phase: Phase;
}

export function HealthChip({ phase }: HealthChipProps) {
  if (phase.kind === "loading") {
    return <Pill>Checking data…</Pill>;
  }
  if (phase.kind === "invalid") {
    return (
      <Pill tone="risk" icon="cross">
        Workbook invalid · {phase.issues.length} {phase.issues.length === 1 ? "issue" : "issues"}
      </Pill>
    );
  }
  if (phase.kind === "error") {
    return (
      <Pill tone="risk" icon="cross">
        Server error
      </Pill>
    );
  }

  const { summary, result, loadedAt } = phase.data;
  const passedChecks = result.invariants.filter((check) => check.passed).length;
  const totalChecks = result.invariants.length;
  const allPassed = passedChecks === totalChecks;
  const loadedTime = new Date(loadedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <Pill tone={allPassed ? "ok" : "risk"} icon={allPassed ? "check" : "cross"}>
      <span title={`${summary.workbookFile} loaded at ${loadedTime}`}>
        {summary.farmCount} farms · {summary.clientCount} clients · {passedChecks}/{totalChecks} plan checks
      </span>
    </Pill>
  );
}
