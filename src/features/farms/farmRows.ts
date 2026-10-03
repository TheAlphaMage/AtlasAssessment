/** Filtering and sort values for the farm table. Pure functions, so they are easy to test. */
import { SEGMENTS } from "@/lib/domain/constants";
import type { FarmResult, Segment } from "@/lib/domain/types";

export type FarmFilter = "all" | "below" | "local";
/** Which figure the A–D cells show. */
export type CellMode = "actual" | "plan" | "variance" | "mix";
export type FarmSortKey = "farm" | "capacity" | Segment | "total" | "variance" | "exported" | "local";

/** True when the farm delivered less than planned in total or in any single segment. */
export function isBelowPlan(farm: FarmResult): boolean {
  return farm.varianceTotalT < 0 || SEGMENTS.some((segment) => farm.segments[segment].varianceT < 0);
}

export function filterFarms(farms: FarmResult[], filter: FarmFilter, search: string): FarmResult[] {
  const needle = search.trim().toLowerCase();
  return farms.filter((farm) => {
    if (filter === "below" && !isBelowPlan(farm)) return false;
    if (filter === "local" && farm.localT <= 0) return false;
    if (!needle) return true;
    return `${farm.farmId} ${farm.farmName}`.toLowerCase().includes(needle);
  });
}

/** The number one segment cell shows in the chosen mode. */
export function cellValue(farm: FarmResult, segment: Segment, mode: CellMode): number {
  const figures = farm.segments[segment];
  if (mode === "plan") return figures.expectedT;
  if (mode === "variance") return figures.varianceT;
  if (mode === "mix") return figures.mix;
  return figures.actualT;
}

/** The value a column sorts by. Segment columns sort by whatever the cells currently show. */
export function sortValue(farm: FarmResult, key: FarmSortKey, mode: CellMode): number | string {
  if (key === "farm") return farm.farmId;
  if (key === "capacity") return farm.expectedCapacityT;
  if (key === "total") return farm.actualTotalT;
  if (key === "variance") return farm.varianceTotalT;
  if (key === "exported") return farm.exportedT;
  if (key === "local") return farm.localT;
  return cellValue(farm, key, mode);
}
