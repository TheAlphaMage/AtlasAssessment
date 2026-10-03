/** Filtering for the Allocations view. Pure functions, so the rules are easy to read and test. */
import type { Allocation, Residual, Segment } from "@/lib/domain/types";
import type { Selection } from "@/features/entities/selection";

function matches(filter: Selection, farmId: string, segment: Segment, clientId?: string): boolean {
  if (filter.farmId && filter.farmId !== farmId) return false;
  if (filter.segment && filter.segment !== segment) return false;
  if (filter.clientId && filter.clientId !== clientId) return false;
  return true;
}

export function isFiltered(filter: Selection): boolean {
  return Boolean(filter.clientId || filter.farmId || filter.segment);
}

export function filterAllocations(allocations: Allocation[], filter: Selection): Allocation[] {
  return allocations.filter((allocation) => matches(filter, allocation.farmId, allocation.segment, allocation.clientId));
}

/** Residual rows belong to no client, so they are hidden while a client filter is active. */
export function filterResiduals(residuals: Residual[], filter: Selection): Residual[] {
  if (filter.clientId) return [];
  return residuals.filter((residual) => matches(filter, residual.farmId, residual.segment));
}
