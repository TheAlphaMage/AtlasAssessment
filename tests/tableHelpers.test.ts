import { describe, expect, it } from "vitest";
import { groupAllocations } from "@/features/allocations/groupAllocations";
import { filterFarms, sortValue } from "@/features/farms/farmRows";
import { sortRows } from "@/hooks/useSort";
import type { PlanResult } from "@/lib/domain/types";
import { plan } from "@/lib/planning/engine";
import { loadDataset } from "@/lib/workbook/loadDataset";
import { BASELINE_WORKBOOK } from "./fixtures";

async function baseline(): Promise<PlanResult> {
  const { dataset } = await loadDataset(BASELINE_WORKBOOK);
  return plan(dataset!);
}

describe("sortRows", () => {
  it("sorts both ways and keeps the original order for ties", () => {
    const rows = [
      { id: "a", value: 2 },
      { id: "b", value: 1 },
      { id: "c", value: 2 },
    ];
    expect(sortRows(rows, (row) => row.value, "asc").map((row) => row.id)).toEqual(["b", "a", "c"]);
    expect(sortRows(rows, (row) => row.value, "desc").map((row) => row.id)).toEqual(["a", "c", "b"]);
    expect(rows.map((row) => row.id)).toEqual(["a", "b", "c"]); // the input is not changed
  });
});

describe("farm table", () => {
  it("filters by below-plan, local residual and search text", async () => {
    const { farms } = await baseline();
    expect(filterFarms(farms, "local", "").map((farm) => farm.farmId)).toEqual(["F15", "F16", "F19", "F20"]);
    expect(filterFarms(farms, "all", " f1 ").map((farm) => farm.farmId)).toEqual(["F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19"]);
    expect(filterFarms(farms, "below", "").every((farm) => farm.farmId !== "F02")).toBe(true);
  });

  it("sorts segment columns by the figure the cells currently show", async () => {
    const { farms } = await baseline();
    const f01 = farms.find((farm) => farm.farmId === "F01")!;
    expect(sortValue(f01, "A", "actual")).toBe(25);
    expect(sortValue(f01, "A", "variance")).toBe(-6.5);
    expect(sortValue(f01, "A", "mix")).toBe(0.9);
  });
});

describe("groupAllocations", () => {
  it("groups ledger rows by client with subtotals that add up to the plan", async () => {
    const result = await baseline();
    const groups = groupAllocations(result.allocations, "client");
    const c02 = groups.find((group) => group.key === "C02")!;

    expect(groups[0].key).toBe("C01"); // engine order: highest price first
    expect(c02.tonnes).toBe(40);
    expect(groups.reduce((total, group) => total + group.tonnes, 0)).toBe(result.kpis.exportT);
    expect(groups.reduce((total, group) => total + group.revenueEur, 0)).toBe(result.kpis.exportRevenueEur);
  });
});
