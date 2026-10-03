"use client";

/** One quality segment: received versus plan, where it went, and which clients it served or left short. */
import { Delta } from "@/components/app/Delta";
import { PlanTickBar } from "@/components/app/PlanTickBar";
import { SEGMENT_BG, SegmentDot } from "@/components/app/SegmentDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityLink } from "@/features/entities/EntityLink";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";
import { fmtT } from "@/lib/format";
import type { GapImpact, SegmentSummary } from "@/lib/domain/types";

interface SegmentCardProps {
  summary: SegmentSummary;
  gap: GapImpact | undefined;
  /** Shared scale so the four cards' bars are comparable. */
  largestTonnes: number;
}

export function SegmentCard({ summary, gap, largestTonnes }: SegmentCardProps) {
  const { openEntity } = useEntityDrawer();
  const shortClients = gap?.affectedClientIds ?? [];
  // Served clients plus any client this segment left short (red), each listed once.
  const clientIds = [...new Set([...summary.servedClientIds, ...shortClients])];

  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <SegmentDot segment={summary.segment} long />
          {shortClients.length > 0 && <Badge variant="danger" className="rounded-md">Leaves {shortClients.length} short</Badge>}
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" onClick={() => openEntity(summary.segment)}>
            Details
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{fmtT(summary.actualT)}</span>
            <span className="text-muted-foreground tabular-nums">of {fmtT(summary.expectedT)} planned</span>
            <Delta value={summary.varianceT} className="ml-auto" />
          </p>
          <div className="mt-3">
            <PlanTickBar actual={summary.actualT} plan={summary.expectedT} max={largestTonnes} fillClass={SEGMENT_BG[summary.segment]} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t pt-4">
          <Figure label="Exported" value={fmtT(summary.exportedT)} />
          <Figure label="Local market" value={fmtT(summary.localT)} warning={summary.localT > 0} />
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Clients served</dt>
            <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {clientIds.length === 0 && <span className="text-muted-foreground">None</span>}
              {clientIds.map((clientId) => (
                <EntityLink key={clientId} id={clientId} className={shortClients.includes(clientId) ? "text-danger" : undefined} />
              ))}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function Figure({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={warning ? "mt-1 font-medium text-warning tabular-nums" : "mt-1 font-medium tabular-nums"}>{value}</dd>
    </div>
  );
}
