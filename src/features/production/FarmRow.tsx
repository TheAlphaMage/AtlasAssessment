"use client";

/** One farm: capacity, a heat cell for each segment, the farm total, and what was exported or went local. */
import { SEGMENTS } from "@/lib/domain/constants";
import { fmtT } from "@/lib/format";
import type { FarmResult, Segment } from "@/lib/domain/types";
import { IdLink } from "@/features/trace";
import { HeatCell } from "./HeatCell";
import { PlanTotal } from "./PlanTotal";
import styles from "./ProductionView.module.css";

interface FarmRowProps {
  farm: FarmResult;
  largestGap: number;
  /** Which clients are short because of a gap in each segment. */
  affectedClients: Map<Segment, string[]>;
}

export function FarmRow({ farm, largestGap, affectedClients }: FarmRowProps) {
  return (
    <tr>
      <th scope="row" className={styles.farmCell}>
        <div className={styles.farmInfo}>
          <IdLink id={farm.farmId} />
          <span className={styles.farmName}>{farm.farmName}</span>
        </div>
      </th>
      <td className={styles.numeric}>{fmtT(farm.expectedCapacityT)}</td>
      {SEGMENTS.map((segment) => (
        <HeatCell
          key={segment}
          figures={farm.segments[segment]}
          largestGap={largestGap}
          affectedClientIds={affectedClients.get(segment) ?? []}
        />
      ))}
      <td className={styles.numeric}>
        <PlanTotal actualT={farm.actualTotalT} expectedT={farm.expectedTotalT} varianceT={farm.varianceTotalT} />
      </td>
      <td className={styles.numeric}>{fmtT(farm.exportedT)}</td>
      <td className={`${styles.numeric} ${farm.localT > 0 ? styles.local : styles.muted}`}>
        {farm.localT > 0 ? fmtT(farm.localT) : "—"}
      </td>
    </tr>
  );
}
