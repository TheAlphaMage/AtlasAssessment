/** Shown while the server loads the workbook and computes the plan. Shows which step is running. */
import { Icon } from "@/components/ui/Icon";
import { classNames } from "@/components/ui/classNames";
import styles from "./States.module.css";

type LoadingStep = "load" | "plan";

interface LoadingStateProps {
  step: LoadingStep;
}

type StepStatus = "done" | "active" | "waiting";

/** The server validates the workbook as part of loading, so both steps share one status. */
function statusOfSteps(step: LoadingStep): Array<{ label: string; status: StepStatus }> {
  const isPlanning = step === "plan";
  return [
    { label: "Load", status: isPlanning ? "done" : "active" },
    { label: "Validate", status: isPlanning ? "done" : "active" },
    { label: "Plan", status: isPlanning ? "active" : "waiting" },
  ];
}

const STEP_CLASS: Record<StepStatus, string | undefined> = {
  done: styles.stepDone,
  active: styles.stepActive,
  waiting: undefined,
};

export function LoadingState({ step }: LoadingStateProps) {
  const heading = step === "load" ? "Loading and validating the workbook…" : "Computing the deterministic export plan…";
  const description =
    step === "load"
      ? "Reading farms, clients and station data on the server and checking every field."
      : "Allocating actual farm supply to client orders by price, quality fit and station capacity.";

  return (
    <div className={styles.panel} aria-busy="true">
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.lead}>{description}</p>

      <ol className={styles.steps} aria-label="Progress">
        {statusOfSteps(step).map(({ label, status }) => (
          <li key={label} className={classNames(styles.step, STEP_CLASS[status])}>
            <span className={styles.dot}>{status === "done" && <Icon name="check" size={13} />}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className={styles.skeleton} style={{ width: "72%" }} />
      <div className={styles.skeleton} style={{ width: "90%" }} />
      <div className={styles.skeleton} style={{ width: "54%" }} />
    </div>
  );
}
