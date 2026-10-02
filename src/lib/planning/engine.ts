/**
 * Deterministic daily planning engine — the reference policy from the brief, in order:
 *  1. Supply = each farm's ACTUAL A/B/C/D tonnes (expected values are for comparison only).
 *  2. Clients processed by export price descending, then client_id ascending.
 *  3. Per client: compatible farm-segment supply with positive balance
 *     (EXACT = requested segment only; MINIMUM = requested or better),
 *     sorted by smallest quality upgrade, then farm_id.
 *  4. Allocate in 5 t steps until demand, compatible supply or station capacity is exhausted.
 *  5. Every unexported actual tonne goes local at ratio × the segment reference price.
 *
 * Pure function: no I/O, clock or randomness. Same input → same output.
 */
import { REASON_INSUFFICIENT_SEGMENT, REASON_STATION_CAPACITY, SEGMENTS, TONNE_STEP } from "../domain/constants";
import type {
  Allocation,
  Client,
  ClientResult,
  Dataset,
  FarmResult,
  Kpis,
  PlanResult,
  Residual,
  Segment,
  SegmentSummary,
} from "../domain/types";
import { buildExceptions, buildGapImpacts } from "./insights";
import { checkInvariants } from "./invariants";

/** Quality rank: A = 0 (best) … D = 3. */
export const qualityRank = (segment: Segment): number => SEGMENTS.indexOf(segment);

/** Segments a client accepts, closest fit first (= smallest quality upgrade first). */
export function compatibleSegments(client: Pick<Client, "acceptanceMode" | "requestedSegment">): Segment[] {
  if (client.acceptanceMode === "EXACT") return [client.requestedSegment];
  const requested = qualityRank(client.requestedSegment);
  return SEGMENTS.filter((s) => qualityRank(s) <= requested).sort((a, b) => qualityRank(b) - qualityRank(a));
}

/** Plain code-unit comparison: locale-independent, so ordering is reproducible everywhere. */
export const compareIds = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export function orderClients(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => b.pricePerT - a.pricePerT || compareIds(a.clientId, b.clientId));
}

const balanceKey = (farmId: string, segment: Segment) => `${farmId}|${segment}`;
const floorToStep = (t: number) => Math.floor(t / TONNE_STEP) * TONNE_STEP;
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function plan(dataset: Dataset): PlanResult {
  const { farms, station } = dataset;

  // Step 1: available supply from actual receipts only.
  const balance = new Map<string, number>();
  for (const farm of farms) for (const s of SEGMENTS) balance.set(balanceKey(farm.farmId, s), farm.actualT[s]);
  const farmIdsSorted = farms.map((f) => f.farmId).sort(compareIds);

  let stationRemaining = station.capacityT;
  const allocations: Allocation[] = [];
  const clientResults: ClientResult[] = [];

  // Step 2: client priority.
  orderClients(dataset.clients).forEach((client, index) => {
    const segments = compatibleSegments(client);
    const requestedRank = qualityRank(client.requestedSegment);
    let remaining = client.demandT;

    // Step 3: compatible supply, smallest upgrade first, then farm_id.
    // `segments` is already ordered by upgrade, so iterate segment-major, farm-minor.
    supply: for (const segment of segments) {
      for (const farmId of farmIdsSorted) {
        const key = balanceKey(farmId, segment);
        const available = balance.get(key) ?? 0;
        if (available <= 0) continue;
        // Step 4: allocate in whole 5 t steps within all three limits.
        const tonnes = floorToStep(Math.min(available, remaining, stationRemaining));
        if (tonnes <= 0) break supply; // demand met or station full
        balance.set(key, available - tonnes);
        remaining -= tonnes;
        stationRemaining -= tonnes;
        allocations.push({
          sequence: allocations.length + 1,
          clientId: client.clientId,
          farmId,
          segment,
          tonnes,
          qualityUpgrade: requestedRank - qualityRank(segment),
          pricePerT: client.pricePerT,
          revenueEur: round2(tonnes * client.pricePerT),
        });
      }
    }

    const allocated = client.demandT - remaining;
    const status = allocated === client.demandT ? "COMPLETE" : allocated > 0 ? "PARTIAL" : "UNSERVED";
    // Capacity is checked first: if the station is full, that is the binding reason.
    const reason =
      status === "COMPLETE"
        ? null
        : stationRemaining < TONNE_STEP
          ? REASON_STATION_CAPACITY
          : REASON_INSUFFICIENT_SEGMENT;
    clientResults.push({
      clientId: client.clientId,
      clientName: client.clientName,
      priorityRank: index + 1,
      acceptanceMode: client.acceptanceMode,
      requestedSegment: client.requestedSegment,
      compatibleSegments: segments,
      pricePerT: client.pricePerT,
      demandT: client.demandT,
      allocatedT: allocated,
      remainingT: remaining,
      revenueEur: round2(allocated * client.pricePerT),
      status,
      shortageReason: reason,
      atRisk: status !== "COMPLETE",
    });
  });

  // Step 5: local residual = every unexported actual tonne.
  const residuals: Residual[] = [];
  for (const farmId of farmIdsSorted) {
    for (const segment of SEGMENTS) {
      const tonnes = balance.get(balanceKey(farmId, segment)) ?? 0;
      if (tonnes <= 0) continue;
      const localPrice = station.localMarketRatio * station.referencePricePerT[segment];
      residuals.push({
        farmId,
        segment,
        tonnes,
        localPricePerT: round2(localPrice),
        localValueEur: round2(tonnes * localPrice),
      });
    }
  }

  const farmResults = buildFarmResults(dataset, allocations, residuals);
  const segmentSummaries = buildSegmentSummaries(dataset, farmResults, allocations, residuals);
  const kpis = buildKpis(dataset, farmResults, allocations, residuals, clientResults);

  const core = { kpis, segments: segmentSummaries, farms: farmResults, clients: clientResults, allocations, residuals };
  const gapImpacts = buildGapImpacts(core);
  return {
    ...core,
    invariants: checkInvariants(dataset, core),
    gapImpacts,
    exceptions: buildExceptions(core, gapImpacts),
  };
}

function buildFarmResults(dataset: Dataset, allocations: Allocation[], residuals: Residual[]): FarmResult[] {
  return dataset.farms.map((farm) => {
    const segments = {} as FarmResult["segments"];
    for (const s of SEGMENTS) {
      const expected = farm.expectedCapacityT * farm.expectedMix[s];
      const exported = sum(allocations.filter((a) => a.farmId === farm.farmId && a.segment === s).map((a) => a.tonnes));
      const local = sum(residuals.filter((r) => r.farmId === farm.farmId && r.segment === s).map((r) => r.tonnes));
      segments[s] = {
        mix: farm.expectedMix[s],
        expectedT: round2(expected),
        actualT: farm.actualT[s],
        varianceT: round2(farm.actualT[s] - expected),
        exportedT: exported,
        localT: local,
      };
    }
    const expectedTotal = sum(SEGMENTS.map((s) => farm.expectedCapacityT * farm.expectedMix[s]));
    const actualTotal = sum(SEGMENTS.map((s) => farm.actualT[s]));
    const farmResiduals = residuals.filter((r) => r.farmId === farm.farmId);
    return {
      farmId: farm.farmId,
      farmName: farm.farmName,
      expectedCapacityT: farm.expectedCapacityT,
      segments,
      expectedTotalT: round2(expectedTotal),
      actualTotalT: actualTotal,
      varianceTotalT: round2(actualTotal - expectedTotal),
      exportedT: sum(SEGMENTS.map((s) => segments[s].exportedT)),
      localT: sum(farmResiduals.map((r) => r.tonnes)),
      localValueEur: round2(sum(farmResiduals.map((r) => r.localValueEur))),
    };
  });
}

function buildSegmentSummaries(
  dataset: Dataset,
  farms: FarmResult[],
  allocations: Allocation[],
  residuals: Residual[],
): SegmentSummary[] {
  return SEGMENTS.map((segment) => {
    const expected = sum(dataset.farms.map((f) => f.expectedCapacityT * f.expectedMix[segment]));
    const actual = sum(farms.map((f) => f.segments[segment].actualT));
    const segmentAllocations = allocations.filter((a) => a.segment === segment);
    const segmentResiduals = residuals.filter((r) => r.segment === segment);
    return {
      segment,
      expectedT: round2(expected),
      actualT: actual,
      varianceT: round2(actual - expected),
      exportedT: sum(segmentAllocations.map((a) => a.tonnes)),
      localT: sum(segmentResiduals.map((r) => r.tonnes)),
      referencePricePerT: dataset.station.referencePricePerT[segment],
      localValueEur: round2(sum(segmentResiduals.map((r) => r.localValueEur))),
      servedClientIds: unique(segmentAllocations.map((a) => a.clientId)),
    };
  });
}

function buildKpis(
  dataset: Dataset,
  farms: FarmResult[],
  allocations: Allocation[],
  residuals: Residual[],
  clients: ClientResult[],
): Kpis {
  const { station } = dataset;
  const expected = sum(dataset.farms.flatMap((f) => SEGMENTS.map((s) => f.expectedCapacityT * f.expectedMix[s])));
  const actual = sum(farms.map((f) => f.actualTotalT));
  const exported = sum(allocations.map((a) => a.tonnes));
  const local = sum(residuals.map((r) => r.tonnes));
  const exportRevenue = round2(sum(allocations.map((a) => a.revenueEur)));
  const localValue = round2(sum(residuals.map((r) => r.localValueEur)));
  return {
    expectedT: round2(expected),
    actualT: actual,
    varianceT: round2(actual - expected),
    stationCapacityT: station.capacityT,
    exportT: exported,
    exportRate: actual > 0 ? exported / actual : 0,
    stationUtilization: exported / station.capacityT,
    stationFull: station.capacityT - exported < TONNE_STEP,
    localT: local,
    localMarketRatio: station.localMarketRatio,
    exportRevenueEur: exportRevenue,
    localValueEur: localValue,
    totalValueEur: round2(exportRevenue + localValue),
    localReferenceExportValueEur: round2(sum(residuals.map((r) => r.tonnes * station.referencePricePerT[r.segment]))),
    atRiskCount: clients.filter((c) => c.atRisk).length,
    clientCount: clients.length,
    farmCount: farms.length,
  };
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
