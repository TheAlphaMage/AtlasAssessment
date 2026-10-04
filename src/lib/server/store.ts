/**
 * In-memory session state (no database by design).
 * Source data and computed results are stored separately; reloading clears the
 * previous result so a stale plan can never be shown next to new data.
 *
 * Serverless hosts (e.g. Vercel) run each API route in its own short-lived instance, so what
 * /api/load stored is not visible to /api/plan. `ensurePlan` covers that case: when this
 * instance holds no plan, it loads the read-only workbook itself, so the result is identical.
 */
import path from "node:path";
import type { Dataset, LoadResponse, LoadSummary, PlanResponse, PlanResult } from "../domain/types";
import { plan } from "../planning/engine";
import { loadDataset } from "../workbook/loadDataset";
import { workbookPath } from "../workbook/readWorkbook";

interface Snapshot {
  dataset: Dataset | null;
  summary: LoadSummary | null;
  loadedAt: string | null;
  result: PlanResult | null;
  plannedAt: string | null;
}

const empty = (): Snapshot => ({ dataset: null, summary: null, loadedAt: null, result: null, plannedAt: null });

// Kept on globalThis so the dev server's hot reload does not drop state.
const holder = globalThis as typeof globalThis & { __atlasSnapshot?: Snapshot };
const state = (): Snapshot => (holder.__atlasSnapshot ??= empty());

export async function loadWorkbook(): Promise<LoadResponse> {
  const file = workbookPath();
  const workbookFile = path.basename(file);
  holder.__atlasSnapshot = empty();
  const { dataset, issues } = await loadDataset(file);
  if (!dataset) return { status: "invalid", issues, workbookFile };

  const summary: LoadSummary = {
    farmCount: dataset.farms.length,
    clientCount: dataset.clients.length,
    stationId: dataset.station.stationId,
    workbookFile,
  };
  const loadedAt = new Date().toISOString();
  holder.__atlasSnapshot = { ...empty(), dataset, summary, loadedAt };
  return { status: "valid", summary, loadedAt };
}

/** Runs the engine on the loaded dataset; null when nothing valid is loaded. */
export function runPlan(): PlanResponse | null {
  const s = state();
  if (!s.dataset || !s.summary || !s.loadedAt) return null;
  s.result = plan(s.dataset);
  s.plannedAt = new Date().toISOString();
  return { result: s.result, summary: s.summary, loadedAt: s.loadedAt, plannedAt: s.plannedAt };
}

/** Valid plan, or the validation issues when the workbook on disk is invalid. */
export type EnsuredPlan = { ok: true; plan: PlanResponse } | { ok: false; load: LoadResponse };

/** Returns this instance's plan; if there is none, loads and plans the workbook first. */
export async function ensurePlan(): Promise<EnsuredPlan> {
  const existing = currentPlan();
  if (existing) return { ok: true, plan: existing };

  if (!state().dataset) {
    const load = await loadWorkbook();
    if (load.status === "invalid") return { ok: false, load };
  }
  return { ok: true, plan: runPlan()! };
}

export function currentPlan(): PlanResponse | null {
  const s = state();
  if (!s.result || !s.summary || !s.loadedAt || !s.plannedAt) return null;
  return { result: s.result, summary: s.summary, loadedAt: s.loadedAt, plannedAt: s.plannedAt };
}
