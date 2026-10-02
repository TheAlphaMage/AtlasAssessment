/** Plan-versus-actual difference with an arrow, so meaning does not rely on colour. */
import { fmtNumber } from "@/lib/format";
import { Icon } from "./Icon";
import styles from "./Variance.module.css";
import { classNames } from "./classNames";

/** Differences smaller than this are treated as "on plan". */
const ON_PLAN_TOLERANCE = 0.005;

/** True when a plan-versus-actual difference is too small to matter. */
export function isOnPlan(value: number): boolean {
  return Math.abs(value) < ON_PLAN_TOLERANCE;
}

interface VarianceProps {
  value: number;
  unit?: string;
}

export function Variance({ value, unit = "t" }: VarianceProps) {
  if (isOnPlan(value)) {
    return (
      <span className={classNames(styles.variance, styles.onPlan)} aria-label="on plan">
        on plan
      </span>
    );
  }

  const isBelowPlan = value < 0;
  const direction = isBelowPlan ? "below" : "above";
  return (
    <span
      className={classNames(styles.variance, isBelowPlan ? styles.below : styles.above)}
      aria-label={`${fmtNumber(Math.abs(value))} ${unit} ${direction} plan`}
    >
      <Icon name={isBelowPlan ? "arrow-down" : "arrow-up"} size={12} />
      {value > 0 ? "+" : ""}
      {fmtNumber(value)}
    </span>
  );
}
