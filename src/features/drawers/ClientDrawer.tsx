"use client";

/** Everything about one client order: figures, why it is short, and exactly which farms serve it. */
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { REASON_LABEL } from "@/components/app/reasons";
import { SegmentDot } from "@/components/app/SegmentDot";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HeadCell } from "@/components/app/TableCells";
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from "@/components/ui/table";
import { EntityLink } from "@/features/entities/EntityLink";
import { fmtEur, fmtT, reasonLabel } from "@/lib/format";
import type { ClientResult, PlanResult } from "@/lib/domain/types";
import { buildDecision } from "./buildDecisions";
import { DrawerLayout, DrawerSection } from "./DrawerLayout";
import { DrawerStats } from "./DrawerStats";
import { StepButtons } from "./StepButtons";
import { WhyTimeline } from "./WhyTimeline";

export function ClientDrawer({ client, result }: { client: ClientResult; result: PlanResult }) {
  const sources = result.allocations.filter((allocation) => allocation.clientId === client.clientId);
  const decision = client.atRisk ? buildDecision(client, result) : null;

  return (
    <DrawerLayout
      eyebrow={`Client · priority #${client.priorityRank}`}
      title={`${client.clientId} · ${client.clientName}`}
      description={`${client.acceptanceMode} ${client.requestedSegment} · accepts ${client.compatibleSegments.join(", ")} · ${fmtEur(client.pricePerT)}/t`}
      badge={<StatusBadge status={client.status} />}
      footer={
        <>
          <StepButtons ids={result.clients.map((candidate) => candidate.clientId)} currentId={client.clientId} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/allocations?client=${client.clientId}`}>Open in Allocations</Link>
          </Button>
        </>
      }
    >
      <DrawerStats
        stats={[
          { label: "Demand", value: fmtT(client.demandT) },
          { label: "Allocated", value: fmtT(client.allocatedT) },
          { label: "Short", value: <span className={client.remainingT > 0 ? "text-warning" : ""}>{fmtT(client.remainingT)}</span> },
          { label: "Revenue", value: fmtEur(client.revenueEur) },
        ]}
      />

      {client.shortageReason && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>{REASON_LABEL[client.shortageReason]}</AlertTitle>
          <AlertDescription>
            {reasonLabel(client.shortageReason)} <span className="font-mono text-[11px]">({client.shortageReason})</span>
          </AlertDescription>
        </Alert>
      )}

      {decision && (
        <DrawerSection title="Why">
          <WhyTimeline steps={decision.steps} />
        </DrawerSection>
      )}

      <DrawerSection title="Served from">
        <Table>
          <TableHeader>
            <TableRow>
              <HeadCell>Farm</HeadCell>
              <HeadCell>Segment</HeadCell>
              <HeadCell numeric>Tonnes</HeadCell>
              <HeadCell numeric>Revenue</HeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">Nothing allocated</TableCell>
              </TableRow>
            )}
            {sources.map((source) => (
              <TableRow key={source.sequence}>
                <TableCell><EntityLink id={source.farmId} /></TableCell>
                <TableCell><SegmentDot segment={source.segment} /></TableCell>
                <TableCell className="text-right tabular-nums">{fmtT(source.tonnes)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtEur(source.revenueEur)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {sources.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right tabular-nums">{fmtT(client.allocatedT)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtEur(client.revenueEur)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </DrawerSection>
    </DrawerLayout>
  );
}
