"use client";

/** One quality segment: plan versus actual, which farms fell short, and which clients it serves or leaves short. */
import Link from "next/link";
import { Delta } from "@/components/app/Delta";
import { Button } from "@/components/ui/button";
import { EntityLink } from "@/features/entities/EntityLink";
import { SEGMENTS } from "@/lib/domain/constants";
import { fmtEur, fmtT } from "@/lib/format";
import type { PlanResult, Segment } from "@/lib/domain/types";
import { DrawerLayout, DrawerSection } from "./DrawerLayout";
import { DrawerStats } from "./DrawerStats";
import { StepButtons } from "./StepButtons";

/** How many below-plan farms to list. */
const MAX_FARMS = 5;

export function SegmentDrawer({ segment, result }: { segment: Segment; result: PlanResult }) {
  const summary = result.segments.find((candidate) => candidate.segment === segment)!;
  const gap = result.gapImpacts.find((candidate) => candidate.segment === segment);
  const farmsBelowPlan = gap?.farmsBelowPlan.slice(0, MAX_FARMS) ?? [];
  const shortClients = gap?.affectedClientIds ?? [];

  return (
    <DrawerLayout
      eyebrow="Quality segment"
      title={`Segment ${segment}`}
      description={`Reference export price ${fmtEur(summary.referencePricePerT)}/t`}
      footer={
        <>
          <StepButtons ids={[...SEGMENTS]} currentId={segment} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/allocations?segment=${segment}`}>Open in Allocations</Link>
          </Button>
        </>
      }
    >
      <DrawerStats
        stats={[
          { label: "Planned", value: fmtT(summary.expectedT) },
          { label: "Received", value: fmtT(summary.actualT) },
          { label: "Exported", value: fmtT(summary.exportedT) },
          { label: "Local", value: <span className={summary.localT > 0 ? "text-warning" : ""}>{fmtT(summary.localT)}</span> },
        ]}
      />

      <DrawerSection title="Variance">
        <p className="flex items-center gap-2">
          <Delta value={summary.varianceT} className="text-sm" /> versus the production plan
        </p>
      </DrawerSection>

      {shortClients.length > 0 && (
        <DrawerSection title="Clients short because of this segment">
          <p className="flex flex-wrap gap-3">
            {shortClients.map((clientId) => (
              <EntityLink key={clientId} id={clientId} className="text-danger" />
            ))}
          </p>
        </DrawerSection>
      )}

      <DrawerSection title="Clients served">
        <p className="flex flex-wrap gap-3">
          {summary.servedClientIds.length === 0 && <span className="text-muted-foreground">None</span>}
          {summary.servedClientIds.map((clientId) => (
            <EntityLink key={clientId} id={clientId} />
          ))}
        </p>
      </DrawerSection>

      {farmsBelowPlan.length > 0 && (
        <DrawerSection title="Farms furthest below plan">
          <ul className="divide-y rounded-lg border">
            {farmsBelowPlan.map((farm) => (
              <li key={farm.farmId} className="flex items-center justify-between px-3 py-2">
                <EntityLink id={farm.farmId} />
                <span className="flex items-center gap-3 tabular-nums">
                  <span className="text-muted-foreground">{fmtT(farm.actualT)} of {fmtT(farm.expectedT)}</span>
                  <Delta value={farm.varianceT} />
                </span>
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}
    </DrawerLayout>
  );
}
