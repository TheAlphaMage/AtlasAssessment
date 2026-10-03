"use client";

/** Crop flow: every allocated tonne from quality segment to client order, and what falls to the local market. */
import { LOCAL_STRIPES } from "@/components/app/localStripes";
import { PageHeader } from "@/components/app/PageHeader";
import { SegmentDot } from "@/components/app/SegmentDot";
import { Card } from "@/components/ui/card";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { SEGMENTS } from "@/lib/domain/constants";
import { FlowChart } from "./FlowChart";

export function FlowPage() {
  const { result } = useReadyPlan();

  return (
    <>
      <PageHeader title="Crop flow" info="Band width is tonnes. Point at a band or a node to follow it; click a node to open its details." />
      <Card className="gap-4 px-4 py-4">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Legend">
          {SEGMENTS.map((segment) => (
            <li key={segment}>
              <SegmentDot segment={segment} long />
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${LOCAL_STRIPES}`} aria-hidden="true" /> Local market
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border border-dashed border-warning bg-warning-soft" aria-hidden="true" /> Asked but not delivered
          </li>
        </ul>
        <FlowChart result={result} />
      </Card>
    </>
  );
}
