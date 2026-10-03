/**
 * Supported assistant topics: question classification, the minimal fact context
 * sent to a model, and the deterministic (no-AI) summary for each topic.
 * Every number here is read from the computed PlanResult and only formatted.
 */
import { REASON_STATION_CAPACITY, SEGMENTS } from "../domain/constants";
import type { PlanResult } from "../domain/types";
import { fmtEur, fmtPct, fmtSignedT, fmtT } from "../format";

export type Topic = "at_risk" | "farm_gaps" | "local_residual";

export const SUPPORTED_QUESTIONS: Record<Topic, string> = {
  at_risk: "Which clients are at risk and why?",
  farm_gaps: "Which farm/segment gaps matter most today?",
  local_residual: "Why is fruit going to the local market and what is its estimated value?",
};

/** Requests to act on the plan are out of scope for a read-only assistant. */
const ACTION_REQUEST = /\b(approve|approval|confirm|execute|send|e-?mail|reallocate|reassign|override|modify|book|order more)\b/i;

const TOPIC_PATTERNS: [Topic, RegExp][] = [
  ["local_residual", /\b(local|residual|unexported|left ?over|waste[ds]?)\b/i],
  ["farm_gaps", /\b(gaps?|below plan|above plan|under plan|behind plan|vs\.? plan|variances?|shortfalls?|missed|deviations?)\b/i],
  ["at_risk", /\b(risk|at-risk|partial|unserved|short|shortages?|status|served)\b/i],
];

/** Greetings, thanks and "what can you do?" get a short friendly reply instead of "unavailable". */
const SMALL_TALK = /^(hi|hello|hey|hiya|good (morning|afternoon|evening)|thanks?|thank you|ok(ay)?|help|who are you|what can you do)\b[\s!.?]*$/i;

export function isSmallTalk(question: string): boolean {
  return SMALL_TALK.test(question.trim());
}

export function isActionRequest(question: string): boolean {
  return ACTION_REQUEST.test(question);
}

export function classify(question: string): Topic | null {
  return TOPIC_PATTERNS.find(([, pattern]) => pattern.test(question))?.[0] ?? null;
}

export interface TopicContext {
  topic: Topic;
  facts: string[];
  /** Every ID an answer may cite: farms, clients, segments, station. */
  knownIds: Set<string>;
}

export interface DeterministicAnswer {
  answer: string;
  evidenceIds: string[];
}

export function knownIds(result: PlanResult): Set<string> {
  return new Set([
    ...result.farms.map((f) => f.farmId),
    ...result.clients.map((c) => c.clientId),
    ...SEGMENTS,
  ]);
}

// ------------------------------------------------------------------ fact context (sent to a model)

export function buildContext(topic: Topic, result: PlanResult): TopicContext {
  const facts =
    topic === "at_risk" ? atRiskFacts(result) : topic === "farm_gaps" ? gapFacts(result) : localFacts(result);
  return { topic, facts, knownIds: knownIds(result) };
}

function atRiskFacts(r: PlanResult): string[] {
  const { kpis } = r;
  const facts = [
    `${kpis.atRiskCount} of ${kpis.clientCount} clients are at risk (PARTIAL or UNSERVED).`,
    `Station export capacity ${fmtT(kpis.stationCapacityT)}; exported ${fmtT(kpis.exportT)}.`,
  ];
  for (const c of r.clients.filter((x) => x.atRisk)) {
    facts.push(
      `${c.clientId}: ${c.acceptanceMode} ${c.requestedSegment}, demand ${fmtT(c.demandT)}, allocated ${fmtT(c.allocatedT)}, ` +
        `remaining ${fmtT(c.remainingT)}, status ${c.status}, reason ${c.shortageReason}.`,
    );
    const cause = r.exceptions.find((e) => e.kind === "CLIENT_AT_RISK" && e.evidenceIds[0] === c.clientId);
    if (cause) facts.push(`${c.clientId} cause: ${cause.detail}`);
  }
  return facts;
}

function gapFacts(r: PlanResult): string[] {
  const { kpis } = r;
  const facts = [`Expected ${fmtT(kpis.expectedT)}, actual ${fmtT(kpis.actualT)} (${fmtSignedT(kpis.varianceT)}).`];
  for (const g of r.gapImpacts) {
    const farms = g.farmsBelowPlan.slice(0, 5).map((f) => `${f.farmId} ${fmtSignedT(f.varianceT)}`).join(", ");
    const affected = g.affectedClientIds
      .map((id) => `${id} (${fmtT(r.clients.find((c) => c.clientId === id)!.remainingT)} short)`)
      .join(", ");
    facts.push(
      `Segment ${g.segment}: actual ${fmtT(g.actualT)} vs plan ${fmtT(g.expectedT)} (${fmtSignedT(g.varianceT)}). ` +
        (affected ? `Clients short of compatible supply: ${affected}. ` : "No client is short of this segment. ") +
        `Farms below plan: ${farms || "none"}.`,
    );
  }
  for (const s of r.segments.filter((x) => x.varianceT >= 0)) {
    facts.push(
      `Segment ${s.segment}: actual ${fmtT(s.actualT)} vs plan ${fmtT(s.expectedT)} (${fmtSignedT(s.varianceT)}); ` +
        `${fmtT(s.localT)} of ${s.segment} goes local.`,
    );
  }
  return facts;
}

function localFacts(r: PlanResult): string[] {
  const { kpis } = r;
  const facts = [
    `Actual received ${fmtT(kpis.actualT)}; exported ${fmtT(kpis.exportT)} of ${fmtT(kpis.stationCapacityT)} station capacity ` +
      `(${fmtPct(kpis.stationUtilization)} used); local ${fmtT(kpis.localT)}.`,
    `Local value ${fmtEur(kpis.localValueEur)} = local tonnes × ${fmtPct(kpis.localMarketRatio, 0)} × segment reference export price. ` +
      `At reference export prices the same fruit is worth ${fmtEur(kpis.localReferenceExportValueEur)}.`,
  ];
  for (const s of r.segments.filter((x) => x.localT > 0)) {
    facts.push(
      `Segment ${s.segment}: ${fmtT(s.localT)} local, reference price ${fmtEur(s.referencePricePerT)}/t, local value ${fmtEur(s.localValueEur)}.`,
    );
  }
  for (const x of r.residuals) {
    facts.push(`${x.farmId} ${x.segment}: ${fmtT(x.tonnes)} local at ${fmtEur(x.localPricePerT)}/t = ${fmtEur(x.localValueEur)}.`);
  }
  for (const c of r.clients.filter((x) => x.shortageReason === REASON_STATION_CAPACITY)) {
    facts.push(`${c.clientId} (${c.acceptanceMode} ${c.requestedSegment}) is ${fmtT(c.remainingT)} short: ${c.shortageReason}.`);
  }
  return facts;
}

// ------------------------------------------------------------------ deterministic summaries (no AI)

export function deterministicAnswer(topic: Topic, result: PlanResult): DeterministicAnswer {
  if (topic === "at_risk") return atRiskAnswer(result);
  if (topic === "farm_gaps") return gapAnswer(result);
  return localAnswer(result);
}

function atRiskAnswer(r: PlanResult): DeterministicAnswer {
  const atRisk = r.clients.filter((c) => c.atRisk);
  if (atRisk.length === 0) {
    return { answer: `All ${r.kpis.clientCount} clients are COMPLETE; no client is at risk.`, evidenceIds: [] };
  }
  const lines = atRisk.map((c) => {
    const cause = r.exceptions.find((e) => e.kind === "CLIENT_AT_RISK" && e.evidenceIds[0] === c.clientId);
    return `• ${c.clientId} — ${c.status}, ${c.shortageReason}. ${cause?.detail ?? ""}`.trim();
  });
  return {
    answer: [`${atRisk.length} of ${r.kpis.clientCount} clients are at risk:`, ...lines].join("\n"),
    evidenceIds: unique(
      atRisk.flatMap((c) => r.exceptions.find((e) => e.kind === "CLIENT_AT_RISK" && e.evidenceIds[0] === c.clientId)?.evidenceIds ?? [c.clientId]),
    ),
  };
}

function gapAnswer(r: PlanResult): DeterministicAnswer {
  const { kpis } = r;
  const lines = [`Farms delivered ${fmtT(kpis.actualT)} against a plan of ${fmtT(kpis.expectedT)} (${fmtSignedT(kpis.varianceT)}).`];
  const evidence: string[] = [];
  const impactful = r.gapImpacts.filter((g) => g.affectedClientIds.length > 0);
  const harmless = r.gapImpacts.filter((g) => g.affectedClientIds.length === 0);

  if (impactful.length) lines.push("Gaps that cost client volume today:");
  for (const g of impactful) {
    const farms = g.farmsBelowPlan.slice(0, 3);
    const short = g.affectedClientIds
      .map((id) => `${id} ${fmtT(r.clients.find((c) => c.clientId === id)!.remainingT)} short`)
      .join(", ");
    lines.push(
      `• Segment ${g.segment}: ${fmtT(g.actualT)} vs ${fmtT(g.expectedT)} plan (${fmtSignedT(g.varianceT)}) → ${short}. ` +
        `Largest farm gaps: ${farms.map((f) => `${f.farmId} ${fmtSignedT(f.varianceT)}`).join(", ")}.`,
    );
    evidence.push(g.segment, ...g.affectedClientIds, ...farms.map((f) => f.farmId));
  }
  if (harmless.length) lines.push("Below plan but no client shortage today:");
  for (const g of harmless) {
    const farms = g.farmsBelowPlan.slice(0, 3);
    lines.push(
      `• Segment ${g.segment}: ${fmtT(g.actualT)} vs ${fmtT(g.expectedT)} plan (${fmtSignedT(g.varianceT)}); ` +
        `largest farm gaps: ${farms.map((f) => `${f.farmId} ${fmtSignedT(f.varianceT)}`).join(", ")}.`,
    );
    evidence.push(g.segment, ...farms.map((f) => f.farmId));
  }
  for (const s of r.segments.filter((x) => x.varianceT > 0)) {
    lines.push(`Segment ${s.segment} is above plan: ${fmtT(s.actualT)} vs ${fmtT(s.expectedT)} (${fmtSignedT(s.varianceT)}).`);
    evidence.push(s.segment);
  }
  if (r.gapImpacts.length === 0) lines.push("No segment is below plan today.");
  return { answer: lines.join("\n"), evidenceIds: unique(evidence) };
}

function localAnswer(r: PlanResult): DeterministicAnswer {
  const { kpis } = r;
  if (kpis.localT === 0) {
    return { answer: `No fruit goes to the local market today: all ${fmtT(kpis.actualT)} received are exported.`, evidenceIds: [] };
  }
  const blocked = r.clients.filter((c) => c.shortageReason === REASON_STATION_CAPACITY);
  const why = kpis.stationFull
    ? `The station's export capacity of ${fmtT(kpis.stationCapacityT)} is fully used, while ${fmtT(kpis.actualT)} arrived.`
    : "No remaining client order accepts this fruit, although the station still had spare capacity.";
  const lines = [
    `${fmtT(kpis.localT)} go to the local market. ${why}`,
    `Residual by farm and segment: ${r.residuals.map((x) => `${x.farmId} ${x.segment} ${fmtT(x.tonnes)}`).join(", ")}.`,
    `Estimated local value: ${fmtEur(kpis.localValueEur)} (${fmtPct(kpis.localMarketRatio, 0)} of the segment reference price: ` +
      `${r.segments
        .filter((s) => s.localT > 0)
        .map((s) => `${s.segment} at ${fmtEur(r.residuals.find((x) => x.segment === s.segment)!.localPricePerT)}/t`)
        .join(", ")}). At reference export prices this fruit would be worth ${fmtEur(kpis.localReferenceExportValueEur)}.`,
  ];
  if (blocked.length) {
    lines.push(
      `Still waiting for capacity: ${blocked.map((c) => `${c.clientId} (${c.acceptanceMode} ${c.requestedSegment}) ${fmtT(c.remainingT)} short`).join(", ")}.`,
    );
  }
  return {
    answer: lines.join("\n"),
    evidenceIds: unique([...r.residuals.map((x) => x.segment), ...r.residuals.map((x) => x.farmId), ...blocked.map((c) => c.clientId)]),
  };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
