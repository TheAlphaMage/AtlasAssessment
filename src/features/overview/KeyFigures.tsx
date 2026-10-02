/** Four money-and-volume figures under the hero. Plain columns with hairlines, not boxes. */
import { Variance } from "@/components/ui/Variance";
import { fmtEur, fmtPct, fmtT } from "@/lib/format";
import type { Kpis } from "@/lib/domain/types";
import styles from "./KeyFigures.module.css";

interface KeyFiguresProps {
  kpis: Kpis;
}

export function KeyFigures({ kpis }: KeyFiguresProps) {
  return (
    <dl className={styles.figures} aria-label="Key figures">
      <div className={styles.figure}>
        <dt>Crop received</dt>
        <dd className={styles.value}>{fmtT(kpis.actualT)}</dd>
        <dd className={styles.note}>
          plan {fmtT(kpis.expectedT)} · <Variance value={kpis.varianceT} />
        </dd>
      </div>
      <div className={styles.figure}>
        <dt>Export revenue</dt>
        <dd className={styles.value}>{fmtEur(kpis.exportRevenueEur)}</dd>
        <dd className={styles.note}>{fmtT(kpis.exportT)} sold to clients</dd>
      </div>
      <div className={styles.figure}>
        <dt>Local market value</dt>
        <dd className={`${styles.value} ${styles.local}`}>{fmtEur(kpis.localValueEur)}</dd>
        <dd className={styles.note}>
          {fmtPct(kpis.localMarketRatio, 0)} of the {fmtEur(kpis.localReferenceExportValueEur)} export value
        </dd>
      </div>
      <div className={styles.figure}>
        <dt>Total plan value</dt>
        <dd className={styles.value}>{fmtEur(kpis.totalValueEur)}</dd>
        <dd className={styles.note}>export + local</dd>
      </div>
    </dl>
  );
}
