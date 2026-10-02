/**
 * Hard-limit checks recomputed independently from the source data and the plan.
 * They are attached to every result (shown as "plan checks" in the UI) and asserted in tests.
 */
import { SEGMENTS, TONNE_STEP } from "../domain/constants";
import type { Dataset, Invariant, PlanCore } from "../domain/types";

export function checkInvariants(dataset: Dataset, plan: PlanCore): Invariant[] {
  const { allocations, residuals } = plan;
  const exported = total(allocations.map((a) => a.tonnes));
  const local = total(residuals.map((r) => r.tonnes));
  const actual = total(dataset.farms.flatMap((f) => SEGMENTS.map((s) => f.actualT[s])));
  const clientsById = new Map(dataset.clients.map((c) => [c.clientId, c]));

  const overDemand = dataset.clients.filter(
    (c) => total(allocations.filter((a) => a.clientId === c.clientId).map((a) => a.tonnes)) > c.demandT,
  );

  const farmSegmentBreaches: string[] = [];
  const negativeBalances: string[] = [];
  for (const farm of dataset.farms) {
    for (const s of SEGMENTS) {
      const used = total(allocations.filter((a) => a.farmId === farm.farmId && a.segment === s).map((a) => a.tonnes));
      const left = total(residuals.filter((r) => r.farmId === farm.farmId && r.segment === s).map((r) => r.tonnes));
      if (used > farm.actualT[s]) farmSegmentBreaches.push(`${farm.farmId}/${s}`);
      if (farm.actualT[s] - used < 0 || left < 0) negativeBalances.push(`${farm.farmId}/${s}`);
    }
  }

  const incompatible = allocations.filter((a) => {
    const client = clientsById.get(a.clientId);
    if (!client) return true;
    const offered = SEGMENTS.indexOf(a.segment);
    const requested = SEGMENTS.indexOf(client.requestedSegment);
    return client.acceptanceMode === "EXACT" ? offered !== requested : offered > requested;
  });

  const offStep = [...allocations.map((a) => a.tonnes), ...residuals.map((r) => r.tonnes)].filter(
    (t) => t <= 0 || t % TONNE_STEP !== 0,
  );

  return [
    check("Export ≤ station capacity", exported <= dataset.station.capacityT, `${exported} t exported, capacity ${dataset.station.capacityT} t`),
    check("Client export ≤ demand", overDemand.length === 0, list("over demand", overDemand.map((c) => c.clientId))),
    check("Farm-segment export ≤ actual", farmSegmentBreaches.length === 0, list("over supply", farmSegmentBreaches)),
    check("Every allocation is quality-compatible", incompatible.length === 0, list("incompatible rows", incompatible.map((a) => `#${a.sequence}`))),
    check("Export + local = actual received", exported + local === actual, `${exported} t + ${local} t = ${exported + local} t vs ${actual} t actual`),
    check("No negative balances", negativeBalances.length === 0, list("negative", negativeBalances)),
    check(`Quantities in ${TONNE_STEP} t steps`, offStep.length === 0, list("off-step quantities", offStep.map(String))),
  ];
}

function check(name: string, passed: boolean, detail: string): Invariant {
  return { name, passed, detail };
}

function list(label: string, items: string[]): string {
  return items.length === 0 ? "OK" : `${label}: ${items.join(", ")}`;
}

function total(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
