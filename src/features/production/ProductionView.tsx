"use client";

/**
 * Production view: 20 farms x 4 segments as a heat table of planned versus actual tonnes.
 * Cells that caused a client shortage carry a red frame, linking this view to Commercial.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyRow } from "@/components/ui/EmptyRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SegmentTag } from "@/components/ui/SegmentTag";
import { Segmented } from "@/components/ui/Segmented";
import { SEGMENTS } from "@/lib/domain/constants";
import type { PlanResult, Segment } from "@/lib/domain/types";
import { FarmRow } from "./FarmRow";
import { GapBanner } from "./GapBanner";
import styles from "./ProductionView.module.css";
import { TotalsRow } from "./TotalsRow";
import { largestSegmentGap, selectFarms, type FarmFilter, type SortKey } from "./farmRows";

interface ProductionViewProps {
  result: PlanResult;
}

export function ProductionView({ result }: ProductionViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("farm");
  const [filter, setFilter] = useState<FarmFilter>("all");

  const farms = useMemo(() => selectFarms(result.farms, sortKey, filter), [result.farms, sortKey, filter]);
  const largestGap = useMemo(() => largestSegmentGap(result.farms), [result.farms]);

  // Which clients are short because of a gap in each segment (from the server's gap analysis).
  const affectedClients = useMemo(() => {
    const bySegment = new Map<Segment, string[]>();
    for (const gap of result.gapImpacts) bySegment.set(gap.segment, gap.affectedClientIds);
    return bySegment;
  }, [result.gapImpacts]);

  return (
    <Card label="Production: plan versus actual by farm">
      <SectionHeader
        title="Production: plan versus actual"
        hint="Expected tonnes = expected daily capacity × expected mix. Variance = actual − expected. Only actual tonnes can be allocated."
      />
      <GapBanner gaps={result.gapImpacts} />

      <div className={styles.toolbar}>
        <Segmented
          label="Sort farms by"
          value={sortKey}
          onChange={setSortKey}
          options={[
            { value: "farm", label: "Farm ID" },
            { value: "shortfall", label: "Biggest shortfall" },
            { value: "local", label: "Most local residual" },
          ]}
        />
        <Segmented
          label="Show farms"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All farms" },
            { value: "below", label: "Below plan only" },
          ]}
        />
      </div>

      <div className={styles.scroller}>
        <table className={styles.table}>
          <caption className="sr-only">Farms: expected capacity, actual tonnes and variance per segment, export and local residual</caption>
          <thead>
            <tr>
              <th scope="col">Farm</th>
              <th scope="col" className={styles.numeric}>Capacity</th>
              {SEGMENTS.map((segment) => (
                <th key={segment} scope="col" className={styles.numeric}>
                  <span className={styles.segmentHeading}>
                    <SegmentTag segment={segment} /> actual
                  </span>
                </th>
              ))}
              <th scope="col" className={styles.numeric}>Total</th>
              <th scope="col" className={styles.numeric}>Exported</th>
              <th scope="col" className={styles.numeric}>Local</th>
            </tr>
          </thead>
          <tbody>
            {farms.length === 0 && <EmptyRow columnCount={9}>No farm is below plan in any segment.</EmptyRow>}
            {farms.map((farm) => (
              <FarmRow key={farm.farmId} farm={farm} largestGap={largestGap} affectedClients={affectedClients} />
            ))}
          </tbody>
          <tfoot>
            <TotalsRow result={result} />
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
