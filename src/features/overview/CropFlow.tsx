"use client";

/** Card around the Crop Flow diagram: title, legend and the diagram itself. */
import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SegmentTag } from "@/components/ui/SegmentTag";
import { SEGMENTS } from "@/lib/domain/constants";
import { fmtEur, fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";
import styles from "./CropFlow.module.css";
import { CropFlowSvg, type FlowHeadings } from "./CropFlowSvg";
import { computeFlowLayout } from "./flowLayout";

interface CropFlowProps {
  result: PlanResult;
}

export function CropFlow({ result }: CropFlowProps) {
  const { kpis } = result;
  const layout = useMemo(() => computeFlowLayout(result), [result]);

  const demandT = result.clients.reduce((total, client) => total + client.demandT, 0);
  const stationNote = kpis.stationFull ? " · full" : "";
  const headings: FlowHeadings = {
    crop: `Actual crop · ${fmtT(kpis.actualT)}`,
    station: `Export station · ${fmtT(kpis.exportT)} of ${fmtT(kpis.stationCapacityT)}${stationNote}`,
    clients: `Client orders · ${fmtT(demandT)} asked`,
    localDetail: `${fmtT(kpis.localT)} · ${fmtEur(kpis.localValueEur)}`,
  };

  return (
    <Card label="Crop flow from segments to clients">
      <SectionHeader
        title="From crop to clients"
        hint="Every ribbon is real allocated tonnes. Point at a client, segment or farm to follow it. Click to trace it."
      />
      <ul className={styles.legend} aria-label="Legend">
        {SEGMENTS.map((segment) => (
          <li key={segment}>
            <SegmentTag segment={segment} /> quality {segment}
          </li>
        ))}
        <li>
          <span className={styles.swatchLocal} /> local market
        </li>
        <li>
          <span className={styles.swatchShort} /> asked but not delivered
        </li>
      </ul>
      <div className={styles.scroller}>
        <CropFlowSvg layout={layout} headings={headings} />
      </div>
    </Card>
  );
}
