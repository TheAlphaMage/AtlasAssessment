/** A total with its plan and variance underneath. Used for the farm, segment and grand totals. */
import { Variance } from "@/components/ui/Variance";
import { fmtNumber } from "@/lib/format";
import styles from "./PlanTotal.module.css";

interface PlanTotalProps {
  actualT: number;
  expectedT: number;
  varianceT: number;
}

export function PlanTotal({ actualT, expectedT, varianceT }: PlanTotalProps) {
  return (
    <div className={styles.total}>
      <strong>{fmtNumber(actualT)}</strong>
      <span className={styles.plan}>plan {fmtNumber(expectedT)}</span>
      <Variance value={varianceT} />
    </div>
  );
}
