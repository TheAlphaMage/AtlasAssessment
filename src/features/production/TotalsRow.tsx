"use client";

/** The "All farms" row at the bottom of the production table. */
import { fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";
import { PlanTotal } from "./PlanTotal";
import styles from "./ProductionView.module.css";

export function TotalsRow({ result }: { result: PlanResult }) {
  const { kpis } = result;
  return (
    <tr>
      <th scope="row">All farms</th>
      <td />
      {result.segments.map((segment) => (
        <td key={segment.segment} className={styles.numeric}>
          <PlanTotal actualT={segment.actualT} expectedT={segment.expectedT} varianceT={segment.varianceT} />
        </td>
      ))}
      <td className={styles.numeric}>
        <PlanTotal actualT={kpis.actualT} expectedT={kpis.expectedT} varianceT={kpis.varianceT} />
      </td>
      <td className={styles.numeric}>{fmtT(kpis.exportT)}</td>
      <td className={`${styles.numeric} ${styles.local}`}>{fmtT(kpis.localT)}</td>
    </tr>
  );
}
