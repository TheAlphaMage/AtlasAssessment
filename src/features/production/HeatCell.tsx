"use client";

/**
 * One farm + segment cell. The background tint grows with the size of the gap
 * (red below plan, green above). The numbers and arrow say the same thing, so colour is never the only signal.
 */
import { Variance, isOnPlan } from "@/components/ui/Variance";
import { classNames } from "@/components/ui/classNames";
import { cssVariables } from "@/components/ui/cssVariables";
import { fmtNumber, fmtPct } from "@/lib/format";
import type { FarmSegmentFigures } from "@/lib/domain/types";
import styles from "./HeatCell.module.css";

interface HeatCellProps {
  figures: FarmSegmentFigures;
  /** The largest gap anywhere in the table, used to scale the tint. */
  largestGap: number;
  /** Client IDs that are short because of a gap in this segment. Empty when none. */
  affectedClientIds: string[];
}

export function HeatCell({ figures, largestGap, affectedClientIds }: HeatCellProps) {
  const isBelowPlan = figures.varianceT < 0;
  const isAbovePlan = figures.varianceT > 0;
  const strength = Math.min(1, Math.abs(figures.varianceT) / largestGap);
  const drivesClientShortage = isBelowPlan && affectedClientIds.length > 0;

  return (
    <td
      className={classNames(
        styles.cell,
        isBelowPlan && styles.below,
        isAbovePlan && styles.above,
        drivesClientShortage && styles.drivesShortage,
      )}
      style={cssVariables({ "--strength": strength })}
    >
      <div className={styles.content}>
        <div className={styles.topLine}>
          <span className={styles.actual}>{fmtNumber(figures.actualT)}</span>
          {!isOnPlan(figures.varianceT) && <Variance value={figures.varianceT} />}
        </div>
        <span className={styles.plan}>
          plan {fmtNumber(figures.expectedT)} ({fmtPct(figures.mix, 0)})
        </span>
        {drivesClientShortage && <span className={styles.drives}>short: {affectedClientIds.join(", ")}</span>}
      </div>
    </td>
  );
}
