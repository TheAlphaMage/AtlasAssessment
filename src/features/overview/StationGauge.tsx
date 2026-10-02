/** The export station as a row of crate slots. Filled slots show how much of today's capacity is used. */
import { classNames } from "@/components/ui/classNames";
import { fmtPct, fmtT } from "@/lib/format";
import type { Kpis } from "@/lib/domain/types";
import styles from "./StationGauge.module.css";

const SLOT_COUNT = 20;

interface StationGaugeProps {
  kpis: Kpis;
}

export function StationGauge({ kpis }: StationGaugeProps) {
  const filledSlots = Math.round(kpis.stationUtilization * SLOT_COUNT);
  const slots = Array.from({ length: SLOT_COUNT }, (_, index) => index);

  return (
    <div className={styles.gauge}>
      <div className={styles.header}>
        <span className={styles.title}>Export station</span>
        {kpis.stationFull && <span className={styles.stamp}>Full</span>}
      </div>
      <div
        className={styles.slots}
        role="meter"
        aria-label="Station capacity used"
        aria-valuemin={0}
        aria-valuemax={kpis.stationCapacityT}
        aria-valuenow={kpis.exportT}
        aria-valuetext={`${fmtT(kpis.exportT)} of ${fmtT(kpis.stationCapacityT)}`}
      >
        {slots.map((slot) => (
          <span key={slot} className={classNames(styles.slot, slot < filledSlots && styles.filled)} />
        ))}
      </div>
      <p className={styles.numbers}>
        <strong>{fmtT(kpis.exportT)}</strong> of {fmtT(kpis.stationCapacityT)} · {fmtPct(kpis.stationUtilization)} used
      </p>
    </div>
  );
}
