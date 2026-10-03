"use client";

/** Segments: the four quality segments side by side. Red client IDs are orders left short by that segment's gap. */
import { PageHeader } from "@/components/app/PageHeader";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { SegmentCard } from "./SegmentCard";

export function SegmentsPage() {
  const { result } = useReadyPlan();
  const largestTonnes = Math.max(...result.segments.flatMap((segment) => [segment.expectedT, segment.actualT]), 1);

  return (
    <>
      <PageHeader title="Segments" info="A is the best quality, D the lowest. Tick = production plan. Red client IDs are short because of that segment." />
      <div className="grid gap-4 md:grid-cols-2">
        {result.segments.map((summary) => (
          <SegmentCard
            key={summary.segment}
            summary={summary}
            gap={result.gapImpacts.find((gap) => gap.segment === summary.segment)}
            largestTonnes={largestTonnes}
          />
        ))}
      </div>
    </>
  );
}
