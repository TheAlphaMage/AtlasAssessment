"use client";

/** Planned versus received tonnes for each quality segment, as thin bars with a plan tick. */
import { Delta } from "@/components/app/Delta";
import { InfoTip } from "@/components/app/InfoTip";
import { PlanTickBar } from "@/components/app/PlanTickBar";
import { SEGMENT_BG } from "@/components/app/SegmentDot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityLink } from "@/features/entities/EntityLink";
import { fmtNumber } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";

export function SupplyVsPlanCard({ result }: { result: PlanResult }) {
  // Same scale for every bar: the largest planned or actual tonnage.
  const largest = Math.max(...result.segments.flatMap((segment) => [segment.expectedT, segment.actualT]), 1);

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          Supply vs plan
          <InfoTip>Bar = tonnes received. Tick = planned tonnes (expected capacity × expected mix).</InfoTip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.segments.map((segment) => (
          <div key={segment.segment} className="grid grid-cols-[2rem_minmax(0,1fr)_auto_4.5rem] items-center gap-3">
            <EntityLink id={segment.segment} />
            <PlanTickBar actual={segment.actualT} plan={segment.expectedT} max={largest} fillClass={SEGMENT_BG[segment.segment]} />
            <span className="whitespace-nowrap text-right tabular-nums">
              {fmtNumber(segment.actualT)}
              <span className="text-muted-foreground"> / {fmtNumber(segment.expectedT)} t</span>
            </span>
            <Delta value={segment.varianceT} className="justify-end whitespace-nowrap" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
