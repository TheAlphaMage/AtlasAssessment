/**
 * Turns the plan into "decisions for the committee": one entry per client at risk,
 * with the chain of causes that led to the shortage (farm gaps -> segment gap -> client).
 */
import type { ClientResult, GapImpact, PlanResult, Segment } from "@/lib/domain/types";

/** How many below-plan farms to show in a chain. The full list is in the Production view. */
const MAX_FARMS_IN_CHAIN = 3;

export type ChainStep =
  | { kind: "farms"; gaps: Array<{ farmId: string; varianceT: number }> }
  | { kind: "segment"; segment: Segment; varianceT: number }
  | { kind: "station"; usedT: number; capacityT: number }
  | { kind: "local"; tonnes: number }
  | { kind: "client"; clientId: string; shortT: number };

export interface Decision {
  clientId: string;
  shortT: number;
  steps: ChainStep[];
}

export function buildDecisions(result: PlanResult): Decision[] {
  return result.clients.filter((client) => client.atRisk).map((client) => buildDecision(client, result));
}

function buildDecision(client: ClientResult, result: PlanResult): Decision {
  const clientStep: ChainStep = { kind: "client", clientId: client.clientId, shortT: client.remainingT };
  const steps =
    client.shortageReason === "STATION_CAPACITY_REACHED"
      ? stationSteps(client, result)
      : supplySteps(client, result.gapImpacts);

  return { clientId: client.clientId, shortT: client.remainingT, steps: [...steps, clientStep] };
}

/** The station ran out of capacity, so compatible fruit went local instead. */
function stationSteps(client: ClientResult, result: PlanResult): ChainStep[] {
  const localTonnes = result.residuals
    .filter((residual) => client.compatibleSegments.includes(residual.segment))
    .reduce((total, residual) => total + residual.tonnes, 0);

  return [
    { kind: "station", usedT: result.kpis.exportT, capacityT: result.kpis.stationCapacityT },
    { kind: "local", tonnes: localTonnes },
  ];
}

/** Not enough compatible fruit arrived: show the biggest below-plan segment that this client accepts. */
function supplySteps(client: ClientResult, gapImpacts: GapImpact[]): ChainStep[] {
  const gapsForClient = gapImpacts.filter((gap) => gap.affectedClientIds.includes(client.clientId));
  if (gapsForClient.length === 0) return [];

  const biggestGap = [...gapsForClient].sort((a, b) => a.varianceT - b.varianceT)[0];
  const farmGaps = biggestGap.farmsBelowPlan.slice(0, MAX_FARMS_IN_CHAIN).map((farm) => ({
    farmId: farm.farmId,
    varianceT: farm.varianceT,
  }));

  return [
    { kind: "farms", gaps: farmGaps },
    { kind: "segment", segment: biggestGap.segment, varianceT: biggestGap.varianceT },
  ];
}
