"use client";

/**
 * Allocations view: trace any exported tonne to its farm, segment and client,
 * and see the residual that goes local. Filters can be set here or by clicking any ID in the app.
 */
import { ResidualTable } from "@/components/ResidualTable";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Selection } from "@/features/trace";
import { fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";
import { AllocationFilters } from "./AllocationFilters";
import { FocusCard } from "./FocusCard";
import { LedgerTable } from "./LedgerTable";
import { PlanPolicy } from "./PlanPolicy";
import { filterAllocations, filterResiduals, isFiltered } from "./filterAllocations";

interface AllocationsViewProps {
  result: PlanResult;
  filter: Selection;
  onFilterChange: (filter: Selection) => void;
}

export function AllocationsView({ result, filter, onFilterChange }: AllocationsViewProps) {
  const { kpis } = result;
  const rows = filterAllocations(result.allocations, filter);
  const residuals = filterResiduals(result.residuals, filter);
  const focusedClient = filter.clientId ? result.clients.find((client) => client.clientId === filter.clientId) : undefined;

  return (
    <>
      <Card label="Allocation trace">
        <SectionHeader
          title="Allocations: farm → segment → client"
          hint={`Every exported tonne resolves to one farm, segment and client. Every unexported tonne goes local. Export ${fmtT(kpis.exportT)} + local ${fmtT(kpis.localT)} = actual ${fmtT(kpis.actualT)}.`}
        />
        <AllocationFilters result={result} filter={filter} onChange={onFilterChange} visibleCount={rows.length} />
        {focusedClient && <FocusCard client={focusedClient} />}
        <LedgerTable
          rows={rows}
          clients={result.clients}
          kpis={kpis}
          showTotal={!isFiltered(filter)}
          emptyMessage={ledgerEmptyMessage(result.allocations.length)}
        />
      </Card>

      <Card tone="local" label="Unexported residual">
        <SectionHeader
          title="Unexported → local market"
          hint={`Supply left after all client orders were processed, valued at ${Math.round(kpis.localMarketRatio * 100)}% of the segment reference price.`}
        />
        <ResidualTable residuals={residuals} emptyMessage={residualEmptyMessage(filter)} />
      </Card>

      <PlanPolicy invariants={result.invariants} />
    </>
  );
}

function ledgerEmptyMessage(totalAllocationCount: number): string {
  if (totalAllocationCount === 0) {
    return "The plan contains no export allocations: no compatible supply matched any client order.";
  }
  return "No export allocation matches these filters.";
}

function residualEmptyMessage(filter: Selection): string {
  if (filter.clientId) return "Local residual is not tied to a client. Clear the client filter to see it.";
  return "No local residual for this selection.";
}
