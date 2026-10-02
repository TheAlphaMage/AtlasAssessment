"use client";

/**
 * Per quality segment: planned versus received as bars, and where the fruit went.
 * The exact figures stay available in a table under "Show exact figures".
 */
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SegmentTag } from "@/components/ui/SegmentTag";
import { Variance } from "@/components/ui/Variance";
import { cssVariables } from "@/components/ui/cssVariables";
import { fmtT } from "@/lib/format";
import type { PlanResult, SegmentSummary } from "@/lib/domain/types";
import styles from "./SegmentBars.module.css";
import { SegmentTable } from "./SegmentTable";

interface SegmentBarsProps {
  result: PlanResult;
}

export function SegmentBars({ result }: SegmentBarsProps) {
  // Every bar uses the same scale: the biggest plan or actual number among the segments.
  const largestTonnes = Math.max(...result.segments.flatMap((segment) => [segment.expectedT, segment.actualT]), 1);

  return (
    <Card label="Planned versus received by segment">
      <SectionHeader
        title="Plan versus reality, by quality segment"
        hint="The outline is what Production planned. The solid bar is what arrived."
      />
      <ul className={styles.list}>
        {result.segments.map((segment) => (
          <li key={segment.segment} className={styles.row}>
            <div className={styles.name}>
              <SegmentTag segment={segment.segment} />
              <strong>Segment {segment.segment}</strong>
            </div>
            <SegmentBar segment={segment} largestTonnes={largestTonnes} />
            <div className={styles.figures}>
              <span>
                <strong>{fmtT(segment.actualT)}</strong> of {fmtT(segment.expectedT)} <Variance value={segment.varianceT} />
              </span>
              <span className={styles.split}>
                exported {fmtT(segment.exportedT)}
                {segment.localT > 0 && <span className={styles.local}> · local {fmtT(segment.localT)}</span>}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <details className={styles.details}>
        <summary>Show exact figures</summary>
        <SegmentTable result={result} />
      </details>
    </Card>
  );
}

function SegmentBar({ segment, largestTonnes }: { segment: SegmentSummary; largestTonnes: number }) {
  const planPercent = (segment.expectedT / largestTonnes) * 100;
  const actualPercent = (segment.actualT / largestTonnes) * 100;
  return (
    <div className={styles.track} aria-hidden="true">
      <div className={styles.plan} style={cssVariables({ "--percent": planPercent })} />
      <div
        className={`${styles.actual} ${styles[`segment${segment.segment}`]}`}
        style={cssVariables({ "--percent": actualPercent })}
      />
    </div>
  );
}
