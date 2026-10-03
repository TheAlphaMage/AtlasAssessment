"use client";

/** One farm: planned versus received for each segment, which clients its fruit serves, and what goes local. */
import Link from "next/link";
import { Delta } from "@/components/app/Delta";
import { SegmentDot } from "@/components/app/SegmentDot";
import { Button } from "@/components/ui/button";
import { HeadCell } from "@/components/app/TableCells";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { EntityLink } from "@/features/entities/EntityLink";
import { SEGMENTS } from "@/lib/domain/constants";
import { fmtEur, fmtNumber, fmtPct, fmtT } from "@/lib/format";
import type { FarmResult, PlanResult } from "@/lib/domain/types";
import { DrawerLayout, DrawerSection } from "./DrawerLayout";
import { DrawerStats } from "./DrawerStats";
import { StepButtons } from "./StepButtons";

export function FarmDrawer({ farm, result }: { farm: FarmResult; result: PlanResult }) {
  const allocations = result.allocations.filter((allocation) => allocation.farmId === farm.farmId);
  const farmIds = [...result.farms].map((candidate) => candidate.farmId).sort();

  return (
    <DrawerLayout
      eyebrow="Farm"
      title={`${farm.farmId} · ${farm.farmName}`}
      description={`Expected daily capacity ${fmtT(farm.expectedCapacityT)}`}
      footer={
        <>
          <StepButtons ids={farmIds} currentId={farm.farmId} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/allocations?farm=${farm.farmId}`}>Open in Allocations</Link>
          </Button>
        </>
      }
    >
      <DrawerStats
        stats={[
          { label: "Planned", value: fmtT(farm.expectedTotalT) },
          { label: "Received", value: fmtT(farm.actualTotalT) },
          { label: "Variance", value: <Delta value={farm.varianceTotalT} className="text-sm" /> },
          { label: "Local", value: <span className={farm.localT > 0 ? "text-warning" : ""}>{fmtT(farm.localT)}</span> },
        ]}
      />

      <DrawerSection title="By segment">
        <Table>
          <TableHeader>
            <TableRow>
              <HeadCell>Segment</HeadCell>
              <HeadCell numeric>Mix</HeadCell>
              <HeadCell numeric>Plan</HeadCell>
              <HeadCell numeric>Actual</HeadCell>
              <HeadCell numeric>Variance</HeadCell>
              <HeadCell numeric>Local</HeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SEGMENTS.map((segment) => {
              const figures = farm.segments[segment];
              return (
                <TableRow key={segment}>
                  <TableCell><SegmentDot segment={segment} /></TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{fmtPct(figures.mix, 0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNumber(figures.expectedT)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{fmtNumber(figures.actualT)}</TableCell>
                  <TableCell className="text-right"><Delta value={figures.varianceT} /></TableCell>
                  <TableCell className="text-right tabular-nums">{figures.localT > 0 ? fmtNumber(figures.localT) : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DrawerSection>

      <DrawerSection title="Clients served">
        {allocations.length === 0 && <p className="text-muted-foreground">No fruit from this farm is exported today.</p>}
        <ul className="divide-y rounded-lg border">
          {allocations.map((allocation) => (
            <li key={allocation.sequence} className="flex items-center justify-between px-3 py-2">
              <span className="flex items-center gap-3">
                <EntityLink id={allocation.clientId} /> <SegmentDot segment={allocation.segment} />
              </span>
              <span className="tabular-nums">
                {fmtT(allocation.tonnes)} <span className="text-muted-foreground">· {fmtEur(allocation.revenueEur)}</span>
              </span>
            </li>
          ))}
        </ul>
      </DrawerSection>
    </DrawerLayout>
  );
}
