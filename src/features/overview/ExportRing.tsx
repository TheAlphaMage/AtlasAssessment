/** Donut chart of the day's crop: how much is exported (light) and how much goes local (amber). */
import { cssVariables } from "@/components/ui/cssVariables";
import { fmtPct } from "@/lib/format";
import styles from "./ExportRing.module.css";

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ExportRingProps {
  exportRate: number;
}

export function ExportRing({ exportRate }: ExportRingProps) {
  const exportLength = CIRCUMFERENCE * exportRate;
  const localLength = CIRCUMFERENCE - exportLength;

  return (
    <figure className={styles.figure}>
      <svg viewBox="0 0 160 160" className={styles.ring} role="img" aria-label={`${fmtPct(exportRate)} of the crop is exported`}>
        <circle cx="80" cy="80" r={RADIUS} className={styles.track} />
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          className={styles.exportArc}
          style={cssVariables({ "--arc-length": exportLength, "--circumference": CIRCUMFERENCE })}
        />
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          className={styles.localArc}
          style={cssVariables({ "--arc-length": localLength, "--circumference": CIRCUMFERENCE, "--arc-offset": -exportLength })}
        />
      </svg>
      <figcaption className={styles.center}>
        <span className={styles.percent}>{fmtPct(exportRate)}</span>
        <span className={styles.caption}>exported</span>
      </figcaption>
    </figure>
  );
}
