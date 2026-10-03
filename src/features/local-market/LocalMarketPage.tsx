"use client";

/** Local market: how much fruit cannot be exported today, why, where it comes from, and what it is worth. */
import { Banknote, Store, TriangleAlert, Ship } from "lucide-react";
import { KpiCard } from "@/components/app/KpiCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityLink } from "@/features/entities/EntityLink";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { fmtEur, fmtPct, fmtT } from "@/lib/format";
import type { Kpis } from "@/lib/domain/types";
import { ResidualTable } from "./ResidualTable";

export function LocalMarketPage() {
  const { result } = useReadyPlan();
  const { kpis } = result;
  const waiting = result.clients.filter((client) => client.shortageReason === "STATION_CAPACITY_REACHED");

  return (
    <>
      <PageHeader title="Local market" info={`Fruit that is not exported sells locally at ${fmtPct(kpis.localMarketRatio, 0)} of its segment reference price.`} />
      {kpis.localT > 0 && (
        <Alert variant="warning" className="mb-4 py-2.5">
          <TriangleAlert />
          <AlertTitle className="font-normal">{explainResidual(kpis)}</AlertTitle>
        </Alert>
      )}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <KpiCard label="Going local" icon={Store} tone="warning" value={fmtT(kpis.localT)} detail={`of ${fmtT(kpis.actualT)}`} />
        <KpiCard label="Local value" icon={Banknote} value={fmtEur(kpis.localValueEur)} detail={`${fmtPct(kpis.localMarketRatio, 0)} of reference price`} />
        <KpiCard label="At export prices" icon={Ship} value={fmtEur(kpis.localReferenceExportValueEur)} detail="if it could be exported" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-0 py-0 lg:col-span-2">
          <ResidualTable residuals={result.residuals} kpis={kpis} />
        </Card>
        <Card className="h-fit gap-3">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Waiting for capacity</CardTitle>
          </CardHeader>
          <CardContent>
            {waiting.length === 0 && <p className="text-muted-foreground">None.</p>}
            <ul className="space-y-2">
              {waiting.map((client) => (
                <li key={client.clientId} className="flex items-center justify-between">
                  <span>
                    <EntityLink id={client.clientId} /> <span className="text-muted-foreground">{client.clientName}</span>
                  </span>
                  <span className="font-medium text-warning tabular-nums">{fmtT(client.remainingT)} short</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function explainResidual(kpis: Kpis): string {
  if (kpis.stationFull) {
    return `Station full: ${fmtT(kpis.exportT)} of ${fmtT(kpis.stationCapacityT)} used while ${fmtT(kpis.actualT)} arrived.`;
  }
  return "No remaining client order accepts this fruit.";
}
