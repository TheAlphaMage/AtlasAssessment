"use client";

/** Export station usage, and which orders are still waiting for capacity. */
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EntityLink } from "@/features/entities/EntityLink";
import { fmtT } from "@/lib/format";
import type { PlanResponse } from "@/lib/domain/types";

export function StationCard({ data }: { data: PlanResponse }) {
  const { kpis, clients } = data.result;
  const waiting = clients.filter((client) => client.shortageReason === "STATION_CAPACITY_REACHED");

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Export station</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {fmtT(kpis.exportT)} <span className="text-base font-normal text-muted-foreground">of {fmtT(kpis.stationCapacityT)}</span>
        </p>
        <Progress value={Math.min(100, kpis.stationUtilization * 100)} className="h-2" aria-label="Station capacity used" />
        {waiting.length > 0 && (
          <p className="text-sm">
            <span className="text-muted-foreground">Waiting:</span>{" "}
            {waiting.map((client) => (
              <span key={client.clientId} className="mr-2 inline-flex gap-1">
                <EntityLink id={client.clientId} />
                <span className="text-muted-foreground">{fmtT(client.remainingT)}</span>
              </span>
            ))}
          </p>
        )}
      </CardContent>
      <CardFooter className="mt-auto bg-transparent py-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/local-market">
            Local market <ChevronRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
