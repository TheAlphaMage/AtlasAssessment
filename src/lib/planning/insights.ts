/**
 * Explains the computed plan: links farm/segment gaps to client shortages and the
 * station limit to the local residual. Reads engine output only; adds no new policy.
 */
import { REASON_INSUFFICIENT_SEGMENT, REASON_STATION_CAPACITY, SEGMENTS } from "../domain/constants";
import type { ClientResult, GapImpact, PlanCore, PlanException } from "../domain/types";
import { fmtEur, fmtPct, fmtSignedT, fmtT } from "../format";

const TOP_FARMS = 3;

export function buildGapImpacts(plan: PlanCore): GapImpact[] {
  const shortClients = plan.clients.filter((c) => c.shortageReason === REASON_INSUFFICIENT_SEGMENT);
  const impacts = plan.segments
    .filter((s) => s.varianceT < 0)
    .map((s): GapImpact => {
      const affected = shortClients.filter((c) => c.compatibleSegments.includes(s.segment));
      const farmsBelowPlan = plan.farms
        .map((f) => ({ farmId: f.farmId, ...pick(f.segments[s.segment]) }))
        .filter((f) => f.varianceT < 0)
        .sort((a, b) => a.varianceT - b.varianceT || (a.farmId < b.farmId ? -1 : 1));
      return {
        segment: s.segment,
        expectedT: s.expectedT,
        actualT: s.actualT,
        varianceT: s.varianceT,
        affectedClientIds: affected.map((c) => c.clientId),
        affectedShortfallT: affected.reduce((t, c) => t + c.remainingT, 0),
        farmsBelowPlan,
      };
    });
  // Gaps that caused a client shortage first, then the largest gaps.
  return impacts.sort(
    (a, b) =>
      b.affectedShortfallT - a.affectedShortfallT ||
      a.varianceT - b.varianceT ||
      SEGMENTS.indexOf(a.segment) - SEGMENTS.indexOf(b.segment),
  );
}

export function buildExceptions(plan: PlanCore, gaps: GapImpact[]): PlanException[] {
  const { kpis } = plan;
  const exceptions: PlanException[] = plan.clients.filter((c) => c.atRisk).map((c) => clientException(plan, c));

  if (kpis.stationFull) {
    const blocked = plan.clients.filter((c) => c.shortageReason === REASON_STATION_CAPACITY);
    exceptions.push({
      kind: "STATION_FULL",
      severity: "medium",
      title: `Station fully used: ${fmtT(kpis.exportT)} of ${fmtT(kpis.stationCapacityT)} (${fmtPct(kpis.stationUtilization)})`,
      detail:
        `Export volume is capped by the station, not by the crop: ${fmtT(kpis.actualT)} arrived. ` +
        (blocked.length > 0
          ? `Orders that could not be fully exported because capacity ran out: ${blocked
              .map((c) => `${c.clientId} (${fmtT(c.remainingT)} short)`)
              .join(", ")}.`
          : "No client order was cut by capacity."),
      evidenceIds: blocked.map((c) => c.clientId),
    });
  }

  if (kpis.localT > 0) {
    const bySegment = plan.segments.filter((s) => s.localT > 0);
    const farms = [...new Set(plan.residuals.map((r) => r.farmId))];
    exceptions.push({
      kind: "LOCAL_RESIDUAL",
      severity: "high",
      title: `${fmtT(kpis.localT)} fall back to the local market — worth ${fmtEur(kpis.localValueEur)}`,
      detail:
        `Unexported after all client orders: ${bySegment.map((s) => `${s.segment} ${fmtT(s.localT)}`).join(", ")} ` +
        `from ${plan.residuals.map((r) => `${r.farmId} ${r.segment} ${fmtT(r.tonnes)}`).join(", ")}. ` +
        `Local value is ${fmtPct(kpis.localMarketRatio, 0)} of the segment reference price; ` +
        `at reference export prices this fruit is worth ${fmtEur(kpis.localReferenceExportValueEur)}.`,
      evidenceIds: [...bySegment.map((s) => s.segment), ...farms],
    });
  }

  for (const gap of gaps) {
    const farms = gap.farmsBelowPlan.slice(0, TOP_FARMS);
    const farmText = farms.map((f) => `${f.farmId} ${fmtSignedT(f.varianceT)}`).join(", ");
    exceptions.push({
      kind: "SEGMENT_BELOW_PLAN",
      severity: gap.affectedClientIds.length > 0 ? "high" : "info",
      title: `Segment ${gap.segment} below plan: ${fmtT(gap.actualT)} vs ${fmtT(gap.expectedT)} (${fmtSignedT(gap.varianceT)})`,
      detail:
        (gap.affectedClientIds.length > 0
          ? `Contributes to the shortage of ${gap.affectedClientIds.join(", ")}. `
          : "No client is short of this segment today. ") +
        (farmText ? `Farms furthest below plan: ${farmText}.` : ""),
      evidenceIds: [gap.segment, ...gap.affectedClientIds, ...farms.map((f) => f.farmId)],
    });
  }
  return exceptions;
}

function clientException(plan: PlanCore, client: ClientResult): PlanException {
  const rule = `${client.acceptanceMode} ${client.requestedSegment}`;
  const head =
    `${rule} order received ${fmtT(client.allocatedT)} of ${fmtT(client.demandT)} ` +
    `(${fmtT(client.remainingT)} short, priority #${client.priorityRank} at ${fmtEur(client.pricePerT)}/t).`;
  const title = `${client.clientId} ${client.status} — ${fmtT(client.remainingT)} short`;

  if (client.shortageReason === REASON_STATION_CAPACITY) {
    const leftover = plan.residuals.filter((r) => client.compatibleSegments.includes(r.segment));
    const leftoverT = leftover.reduce((t, r) => t + r.tonnes, 0);
    return {
      kind: "CLIENT_AT_RISK",
      severity: "high",
      title,
      detail:
        `${head} The station reached its ${fmtT(plan.kpis.stationCapacityT)} export capacity first. ` +
        (leftoverT > 0
          ? `Compatible fruit was still available (${fmtT(leftoverT)} going local), so capacity — not supply — is the limit.`
          : "No compatible fruit was left either."),
      evidenceIds: [
        client.clientId,
        ...new Set(leftover.length ? leftover.map((r) => r.segment) : client.compatibleSegments),
        ...new Set(leftover.map((r) => r.farmId)),
      ],
    };
  }

  // INSUFFICIENT_COMPATIBLE_SEGMENT: show the compatible supply vs plan and who used it first.
  const segments = plan.segments.filter((s) => client.compatibleSegments.includes(s.segment));
  const supplyText = segments
    .map((s) => `${s.segment} ${fmtT(s.actualT)} actual vs ${fmtT(s.expectedT)} plan (${fmtSignedT(s.varianceT)})`)
    .join("; ");
  const earlier = higherPriorityUse(plan, client);
  const earlierText = earlier.length
    ? ` Higher-priced orders used it first: ${earlier.map((e) => `${e.clientId} ${fmtT(e.tonnes)}`).join(", ")}.`
    : "";
  const belowPlanFarms = plan.farms
    .flatMap((f) =>
      client.compatibleSegments.map((s) => ({ farmId: f.farmId, segment: s, varianceT: f.segments[s].varianceT })),
    )
    .filter((f) => f.varianceT < 0)
    .sort((a, b) => a.varianceT - b.varianceT || (a.farmId < b.farmId ? -1 : 1))
    .slice(0, TOP_FARMS);
  const farmText = belowPlanFarms.length
    ? ` Farms furthest below plan: ${belowPlanFarms.map((f) => `${f.farmId} ${f.segment} ${fmtSignedT(f.varianceT)}`).join(", ")}.`
    : "";
  return {
    kind: "CLIENT_AT_RISK",
    severity: "high",
    title,
    detail: `${head} Compatible supply: ${supplyText}.${earlierText}${farmText}`,
    evidenceIds: [
      client.clientId,
      ...client.compatibleSegments,
      ...earlier.map((e) => e.clientId),
      ...new Set(belowPlanFarms.map((f) => f.farmId)),
    ],
  };
}

/** Tonnes of this client's compatible segments allocated to higher-priority clients. */
function higherPriorityUse(plan: PlanCore, client: ClientResult): { clientId: string; tonnes: number }[] {
  const rank = new Map(plan.clients.map((c) => [c.clientId, c.priorityRank]));
  const used = new Map<string, number>();
  for (const a of plan.allocations) {
    if ((rank.get(a.clientId) ?? Infinity) < client.priorityRank && client.compatibleSegments.includes(a.segment)) {
      used.set(a.clientId, (used.get(a.clientId) ?? 0) + a.tonnes);
    }
  }
  return [...used].map(([clientId, tonnes]) => ({ clientId, tonnes }));
}

function pick(f: { expectedT: number; actualT: number; varianceT: number }) {
  return { expectedT: f.expectedT, actualT: f.actualT, varianceT: f.varianceT };
}
