import { describe, expect, it } from "vitest";
import { plan } from "@/lib/planning/engine";
import { loadDataset } from "@/lib/workbook/loadDataset";
import type { Dataset, PlanResult } from "@/lib/domain/types";
import { BASELINE_WORKBOOK, client, dataset, farm } from "./fixtures";

async function baseline(): Promise<Dataset> {
  const { dataset: data, issues } = await loadDataset(BASELINE_WORKBOOK);
  expect(issues).toEqual([]);
  return data!;
}

const byClient = (result: PlanResult, id: string) => result.clients.find((c) => c.clientId === id)!;
const rows = (result: PlanResult, id: string) =>
  result.allocations.filter((a) => a.clientId === id).map((a) => `${a.farmId}:${a.segment}:${a.tonnes}`);

describe("baseline workbook reproduces the public checks (computed, not hard-coded)", () => {
  it("matches every published KPI and client outcome", async () => {
    const result = plan(await baseline());
    const { kpis } = result;

    expect(kpis.expectedT).toBe(600);
    expect(kpis.actualT).toBe(560);
    expect(result.segments.map((s) => s.actualT)).toEqual([90, 160, 180, 130]);
    expect(kpis.stationCapacityT).toBe(500);
    expect(kpis.exportT).toBe(500);
    expect(kpis.localT).toBe(60);
    expect((kpis.exportRate * 100).toFixed(1)).toBe("89.3");
    expect(kpis.exportRevenueEur).toBe(549_500);
    expect(kpis.localValueEur).toBe(4_500);
    expect(kpis.totalValueEur).toBe(554_000);
    expect(kpis.atRiskCount).toBe(3);

    expect(byClient(result, "C02")).toMatchObject({ status: "PARTIAL", shortageReason: "INSUFFICIENT_COMPATIBLE_SEGMENT" });
    expect(byClient(result, "C09")).toMatchObject({ status: "PARTIAL", shortageReason: "INSUFFICIENT_COMPATIBLE_SEGMENT" });
    expect(byClient(result, "C08")).toMatchObject({ status: "PARTIAL", shortageReason: "STATION_CAPACITY_REACHED" });
    expect(result.clients.filter((c) => c.atRisk).map((c) => c.clientId).sort()).toEqual(["C02", "C08", "C09"]);

    // Segment A is 11.7 t below plan (brief, page 2).
    expect(result.segments.find((s) => s.segment === "A")!.varianceT).toBe(-11.7);
    expect(result.invariants.every((i) => i.passed)).toBe(true);
  });

  it("reacts to a changed valid input instead of returning fixed numbers", async () => {
    const data = await baseline();
    const changed: Dataset = {
      ...data,
      farms: data.farms.map((f) => (f.farmId === "F01" ? { ...f, actualT: { ...f.actualT, A: 35 } } : f)),
    };
    const before = plan(data);
    const after = plan(changed);
    expect(after.kpis.actualT).toBe(570);
    expect(byClient(after, "C02")).toMatchObject({ status: "COMPLETE", allocatedT: 50 });
    expect(after.kpis.exportRevenueEur).not.toBe(before.kpis.exportRevenueEur);
    expect(after.invariants.every((i) => i.passed)).toBe(true);
  });
});

describe("client ordering", () => {
  it("serves higher prices first and breaks price ties by client_id", () => {
    const result = plan(
      dataset(
        [farm("F01", { A: 15 })],
        [client("C2", "EXACT", "A", 10, 100), client("C1", "EXACT", "A", 10, 100), client("C3", "EXACT", "A", 10, 200)],
      ),
    );
    expect(result.clients.map((c) => c.clientId)).toEqual(["C3", "C1", "C2"]);
    expect(result.clients.map((c) => c.allocatedT)).toEqual([10, 5, 0]);
    expect(byClient(result, "C2")).toMatchObject({ status: "UNSERVED", shortageReason: "INSUFFICIENT_COMPATIBLE_SEGMENT" });
  });

  it("ignores segment reference prices for ordering and revenue; uses them only for local value", () => {
    const data = dataset([farm("F01", { B: 20 })], [client("C1", "EXACT", "B", 10, 900)]);
    const result = plan(data);
    expect(result.kpis.exportRevenueEur).toBe(10 * 900);
    expect(result.residuals).toEqual([
      { farmId: "F01", segment: "B", tonnes: 10, localPricePerT: 125, localValueEur: 10 * 0.1 * 1250 },
    ]);
  });
});

describe("quality compatibility", () => {
  it("EXACT accepts only the requested segment, even when better fruit is left over", () => {
    const result = plan(dataset([farm("F01", { A: 50, B: 10 })], [client("C1", "EXACT", "B", 30, 1000)]));
    expect(rows(result, "C1")).toEqual(["F01:B:10"]);
    expect(byClient(result, "C1")).toMatchObject({ status: "PARTIAL", shortageReason: "INSUFFICIENT_COMPATIBLE_SEGMENT" });
  });

  it("MINIMUM accepts better segments but never worse ones", () => {
    const result = plan(dataset([farm("F01", { A: 50, B: 10, C: 50 })], [client("C1", "MINIMUM", "B", 30, 1000)]));
    expect(rows(result, "C1")).toEqual(["F01:B:10", "F01:A:20"]);
    expect(result.allocations.map((a) => a.qualityUpgrade)).toEqual([0, 1]);
  });

  it("uses the smallest quality upgrade first, then farm_id", () => {
    const result = plan(
      dataset(
        [farm("F03", { C: 5 }), farm("F01", { A: 10, B: 10 }), farm("F02", { C: 5, B: 10 })],
        [client("C1", "MINIMUM", "C", 25, 1000)],
      ),
    );
    expect(rows(result, "C1")).toEqual(["F02:C:5", "F03:C:5", "F01:B:10", "F02:B:5"]);
    expect(result.allocations.map((a) => a.qualityUpgrade)).toEqual([0, 0, 1, 1]);
  });
});

describe("hard limits", () => {
  it("stops at station capacity and gives STATION_CAPACITY_REACHED", () => {
    const result = plan(
      dataset(
        [farm("F01", { D: 100 })],
        [client("C1", "EXACT", "D", 15, 300), client("C2", "EXACT", "D", 15, 200), client("C3", "EXACT", "D", 15, 100)],
        20,
      ),
    );
    expect(result.kpis.exportT).toBe(20);
    expect(byClient(result, "C1")).toMatchObject({ allocatedT: 15, status: "COMPLETE", shortageReason: null });
    expect(byClient(result, "C2")).toMatchObject({ allocatedT: 5, status: "PARTIAL", shortageReason: "STATION_CAPACITY_REACHED" });
    expect(byClient(result, "C3")).toMatchObject({ allocatedT: 0, status: "UNSERVED", shortageReason: "STATION_CAPACITY_REACHED" });
    expect(result.kpis.localT).toBe(80);
  });

  it("never exceeds client demand or farm-segment supply; leftovers go local", () => {
    const result = plan(
      dataset([farm("F01", { A: 30 }), farm("F02", { B: 5 })], [client("C1", "EXACT", "A", 10, 100), client("C2", "EXACT", "B", 10, 90)]),
    );
    expect(byClient(result, "C1")).toMatchObject({ allocatedT: 10, status: "COMPLETE" });
    expect(byClient(result, "C2")).toMatchObject({ allocatedT: 5, remainingT: 5, shortageReason: "INSUFFICIENT_COMPATIBLE_SEGMENT" });
    expect(result.residuals.map((r) => `${r.farmId}:${r.segment}:${r.tonnes}`)).toEqual(["F01:A:20"]);
    expect(result.kpis.exportT + result.kpis.localT).toBe(result.kpis.actualT);
    expect(result.invariants.every((i) => i.passed)).toBe(true);
  });
});

describe("determinism", () => {
  it("returns the same plan for the same input, regardless of row order", async () => {
    const data = await baseline();
    const shuffled: Dataset = { ...data, farms: [...data.farms].reverse(), clients: [...data.clients].reverse() };
    const a = plan(data);
    expect(plan(data)).toEqual(a);
    expect(plan(shuffled).allocations).toEqual(a.allocations);
    expect(plan(shuffled).kpis).toEqual(a.kpis);
  });
});
