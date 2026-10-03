/** Sorting and filtering of the farm table. Pure functions, so they are easy to test. */
import { SEGMENTS } from "@/lib/domain/constants";
import type { FarmResult } from "@/lib/domain/types";

export type SortKey = "farm" | "shortfall" | "local";
export type FarmFilter = "all" | "below";

const compareFarmIds = (a: FarmResult, b: FarmResult) => (a.farmId < b.farmId ? -1 : 1);

/** True when the farm delivered less than planned in total or in any single segment. */
export function isBelowPlan(farm: FarmResult): boolean {
  return farm.varianceTotalT < 0 || SEGMENTS.some((segment) => farm.segments[segment].varianceT < 0);
}

export function selectFarms(farms: FarmResult[], sortKey: SortKey, filter: FarmFilter): FarmResult[] {
  const visible = filter === "below" ? farms.filter(isBelowPlan) : [...farms];

  if (sortKey === "local") {
    return visible.sort((a, b) => b.localT - a.localT || compareFarmIds(a, b));
  }
  if (sortKey === "shortfall") {
    return visible.sort((a, b) => a.varianceTotalT - b.varianceTotalT || compareFarmIds(a, b));
  }
  return visible.sort(compareFarmIds);
}

/** The biggest plan-versus-actual gap in any cell. The heat colours are scaled against it. */
export function largestSegmentGap(farms: FarmResult[]): number {
  const gaps = farms.flatMap((farm) => SEGMENTS.map((segment) => Math.abs(farm.segments[segment].varianceT)));
  return Math.max(...gaps, 1);
}
