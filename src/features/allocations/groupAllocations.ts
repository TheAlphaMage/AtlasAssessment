/** Groups ledger rows by client or farm, with tonnes and revenue subtotals. Pure, covered by tests. */
import type { Allocation } from "@/lib/domain/types";

export type GroupBy = "none" | "client" | "farm";

export interface AllocationGroup {
  key: string;
  rows: Allocation[];
  tonnes: number;
  revenueEur: number;
}

/** Keeps the engine's order: groups appear in the order of their first row. */
export function groupAllocations(rows: Allocation[], groupBy: Exclude<GroupBy, "none">): AllocationGroup[] {
  const groups = new Map<string, AllocationGroup>();
  for (const row of rows) {
    const key = groupBy === "client" ? row.clientId : row.farmId;
    const group = groups.get(key) ?? { key, rows: [], tonnes: 0, revenueEur: 0 };
    group.rows.push(row);
    group.tonnes += row.tonnes;
    group.revenueEur += row.revenueEur;
    groups.set(key, group);
  }
  return [...groups.values()];
}
