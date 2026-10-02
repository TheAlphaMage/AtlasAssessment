import type { ACCEPTANCE_MODES, REASON_INSUFFICIENT_SEGMENT, REASON_STATION_CAPACITY, SEGMENTS } from "./constants";

export type Segment = (typeof SEGMENTS)[number];
export type AcceptanceMode = (typeof ACCEPTANCE_MODES)[number];
export type ClientStatus = "COMPLETE" | "PARTIAL" | "UNSERVED";
export type ShortageReason = typeof REASON_STATION_CAPACITY | typeof REASON_INSUFFICIENT_SEGMENT;
export type PerSegment<T> = Record<Segment, T>;

// ------------------------------------------------------------------ source data (validated)

export interface Farm {
  farmId: string;
  farmName: string;
  expectedCapacityT: number;
  expectedMix: PerSegment<number>;
  actualT: PerSegment<number>;
}

export interface Client {
  clientId: string;
  clientName: string;
  acceptanceMode: AcceptanceMode;
  requestedSegment: Segment;
  demandT: number;
  pricePerT: number;
}

export interface Station {
  stationId: string;
  capacityT: number;
  localMarketRatio: number;
  referencePricePerT: PerSegment<number>;
}

export interface Dataset {
  farms: Farm[];
  clients: Client[];
  station: Station;
}

export interface ValidationIssue {
  sheet: string;
  row: number | null;
  entityId: string | null;
  field: string | null;
  problem: string;
  fix: string;
}

// ------------------------------------------------------------------ computed result

export interface FarmSegmentFigures {
  mix: number;
  expectedT: number;
  actualT: number;
  varianceT: number;
  exportedT: number;
  localT: number;
}

export interface FarmResult {
  farmId: string;
  farmName: string;
  expectedCapacityT: number;
  segments: PerSegment<FarmSegmentFigures>;
  expectedTotalT: number;
  actualTotalT: number;
  varianceTotalT: number;
  exportedT: number;
  localT: number;
  localValueEur: number;
}

export interface SegmentSummary {
  segment: Segment;
  expectedT: number;
  actualT: number;
  varianceT: number;
  exportedT: number;
  localT: number;
  referencePricePerT: number;
  localValueEur: number;
  servedClientIds: string[];
}

export interface ClientResult {
  clientId: string;
  clientName: string;
  priorityRank: number;
  acceptanceMode: AcceptanceMode;
  requestedSegment: Segment;
  compatibleSegments: Segment[];
  pricePerT: number;
  demandT: number;
  allocatedT: number;
  remainingT: number;
  revenueEur: number;
  status: ClientStatus;
  shortageReason: ShortageReason | null;
  atRisk: boolean;
}

export interface Allocation {
  sequence: number;
  clientId: string;
  farmId: string;
  segment: Segment;
  tonnes: number;
  /** Quality steps above the requested segment (0 = exact fit). */
  qualityUpgrade: number;
  pricePerT: number;
  revenueEur: number;
}

export interface Residual {
  farmId: string;
  segment: Segment;
  tonnes: number;
  localPricePerT: number;
  localValueEur: number;
}

export interface Invariant {
  name: string;
  passed: boolean;
  detail: string;
}

export interface Kpis {
  expectedT: number;
  actualT: number;
  varianceT: number;
  stationCapacityT: number;
  exportT: number;
  exportRate: number;
  stationUtilization: number;
  localT: number;
  localMarketRatio: number;
  exportRevenueEur: number;
  localValueEur: number;
  totalValueEur: number;
  /** What the local residual would be worth at segment reference export prices (context only). */
  localReferenceExportValueEur: number;
  atRiskCount: number;
  clientCount: number;
  farmCount: number;
}

export interface FarmGap {
  farmId: string;
  expectedT: number;
  actualT: number;
  varianceT: number;
}

/** Links a segment's plan-vs-actual gap to the clients it affected (Production ↔ Commercial). */
export interface GapImpact {
  segment: Segment;
  expectedT: number;
  actualT: number;
  varianceT: number;
  /** Clients short for INSUFFICIENT_COMPATIBLE_SEGMENT that accept this segment. */
  affectedClientIds: string[];
  affectedShortfallT: number;
  /** Farms below plan in this segment, largest shortfall first. */
  farmsBelowPlan: FarmGap[];
}

export type ExceptionKind = "CLIENT_AT_RISK" | "SEGMENT_BELOW_PLAN" | "STATION_FULL" | "LOCAL_RESIDUAL";

export interface PlanException {
  kind: ExceptionKind;
  severity: "high" | "medium" | "info";
  title: string;
  detail: string;
  evidenceIds: string[];
}

/** The engine's direct output, before derived checks and explanations are attached. */
export type PlanCore = Omit<PlanResult, "invariants" | "gapImpacts" | "exceptions">;

export interface PlanResult {
  kpis: Kpis;
  segments: SegmentSummary[];
  farms: FarmResult[];
  clients: ClientResult[];
  allocations: Allocation[];
  residuals: Residual[];
  invariants: Invariant[];
  gapImpacts: GapImpact[];
  exceptions: PlanException[];
}

// ------------------------------------------------------------------ API DTOs

export interface LoadSummary {
  farmCount: number;
  clientCount: number;
  stationId: string;
  workbookFile: string;
}

export type LoadResponse =
  | { status: "valid"; summary: LoadSummary; loadedAt: string }
  | { status: "invalid"; issues: ValidationIssue[]; workbookFile: string };

export interface PlanResponse {
  result: PlanResult;
  summary: LoadSummary;
  loadedAt: string;
  plannedAt: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export type AssistantStatus =
  | "ok"
  | "no_provider"
  | "timeout"
  | "provider_error"
  | "invalid_output"
  | "unsupported";

export interface AssistantResponse {
  status: AssistantStatus;
  source: "llm" | "deterministic" | "none";
  provider: string | null;
  model: string | null;
  notice: string | null;
  answer: string;
  evidenceIds: string[];
}

export interface AssistantProviderStatus {
  configured: boolean;
  provider: string | null;
  model: string | null;
}
