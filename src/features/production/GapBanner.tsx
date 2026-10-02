"use client";

/** Strip above the farm table: which segment gaps left clients short. Links the farm view to the client view. */
import { Icon } from "@/components/ui/Icon";
import { Variance } from "@/components/ui/Variance";
import { IdLink } from "@/features/trace";
import type { GapImpact } from "@/lib/domain/types";
import styles from "./GapBanner.module.css";

interface GapBannerProps {
  gaps: GapImpact[];
}

export function GapBanner({ gaps }: GapBannerProps) {
  const harmfulGaps = gaps.filter((gap) => gap.affectedClientIds.length > 0);
  if (harmfulGaps.length === 0) return null;

  return (
    <div className={styles.banner}>
      <strong className={styles.title}>
        <Icon name="alert" size={15} /> Gaps that hurt clients today
      </strong>
      <ul className={styles.list}>
        {harmfulGaps.map((gap) => (
          <li key={gap.segment} className={styles.item}>
            <IdLink id={gap.segment} /> <Variance value={gap.varianceT} />
            <Icon name="arrow-right" size={13} />
            {gap.affectedClientIds.map((clientId) => (
              <IdLink key={clientId} id={clientId} />
            ))}
            <span>short</span>
          </li>
        ))}
      </ul>
      <span className={styles.legend}>Red-framed cells below show where.</span>
    </div>
  );
}
