"use client";

/** Allocations: every exported tonne, traced to farm, segment and client. Filters come from the URL. */
import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardFooter } from "@/components/ui/card";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { fmtEur, fmtT } from "@/lib/format";
import { AllocationFilters } from "./AllocationFilters";
import { ClientFocusStrip } from "./ClientFocusStrip";
import { filterAllocations, isFiltered } from "./filterAllocations";
import type { GroupBy } from "./groupAllocations";
import { LedgerTable } from "./LedgerTable";
import { useAllocationFilter } from "./useAllocationFilter";

export function AllocationsPage() {
  const { result } = useReadyPlan();
  const { kpis } = result;
  const { filter } = useAllocationFilter();
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const rows = filterAllocations(result.allocations, filter);
  const focusedClient = result.clients.find((client) => client.clientId === filter.clientId);

  const summary = isFiltered(filter)
    ? `Showing ${rows.length} of ${result.allocations.length} rows`
    : `${result.allocations.length} rows · ${fmtT(kpis.exportT)} · ${fmtEur(kpis.exportRevenueEur)}`;

  return (
    <>
      <PageHeader title="Allocations" info="Every exported tonne, traced to one farm, segment and client." meta={summary} />
      <Card className="gap-0 py-0">
        <AllocationFilters result={result} groupBy={groupBy} onGroupBy={setGroupBy} />
        {focusedClient && <ClientFocusStrip client={focusedClient} />}
        <LedgerTable rows={rows} clients={result.clients} groupBy={groupBy} />
        {kpis.localT > 0 && !filter.clientId && (
          <CardFooter className="justify-between text-sm">
            <span className="text-muted-foreground">
              Not exported: <span className="font-medium text-warning">{fmtT(kpis.localT)}</span> goes to the local market
            </span>
            <Link href="/local-market" className="inline-flex items-center gap-1 font-medium hover:underline">
              Local market <ChevronRight className="size-4" />
            </Link>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
