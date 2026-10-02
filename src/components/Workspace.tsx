"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { ApiError, LoadResponse, PlanResponse, ValidationIssue } from "@/lib/domain/types";
import { AllocationsView } from "./AllocationsView";
import { AssistantPanel } from "./AssistantPanel";
import { CommercialView } from "./CommercialView";
import { TraceContext, type TraceFilter } from "./common";
import { Overview } from "./Overview";
import { ProductionView } from "./ProductionView";
import { LoadingState, ServerErrorState, ValidationErrorState } from "./StateViews";

type Phase =
  | { kind: "loading"; step: "load" | "plan" }
  | { kind: "invalid"; issues: ValidationIssue[]; workbookFile: string }
  | { kind: "error"; message: string; during: "load" | "plan" }
  | { kind: "ready"; data: PlanResponse };

const TABS = [
  { id: "overview", label: "Overview", step: "Decide" },
  { id: "production", label: "Production", step: "Compare" },
  { id: "commercial", label: "Commercial", step: "Client service" },
  { id: "allocations", label: "Allocations", step: "Trace" },
  { id: "assistant", label: "Assistant", step: "Explain" },
] as const;
type TabId = (typeof TABS)[number]["id"];

class RequestFailed extends Error {}

async function postJson<T>(url: string): Promise<{ status: number; body: T | ApiError | null }> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST" });
  } catch {
    throw new RequestFailed("The server could not be reached. Check that the app is running, then retry.");
  }
  const body = (await response.json().catch(() => null)) as T | ApiError | null;
  return { status: response.status, body };
}

function errorMessage(status: number, body: unknown): string {
  const message = (body as ApiError | null)?.message;
  return message ? `${message} (HTTP ${status})` : `The server returned an unexpected response (HTTP ${status}).`;
}

export function Workspace() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading", step: "load" });
  const [tab, setTabState] = useState<TabId>("overview");
  // Deep link: #production, #commercial, … opens that view.
  const setTab = useCallback((next: TabId) => {
    setTabState(next);
    window.history.replaceState(null, "", `#${next}`);
  }, []);
  useEffect(() => {
    const fromHash = TABS.find((t) => `#${t.id}` === window.location.hash);
    if (fromHash) setTabState(fromHash.id);
  }, []);
  const [filter, setFilter] = useState<TraceFilter>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const run = useCallback(async () => {
    setPhase({ kind: "loading", step: "load" });
    try {
      const load = await postJson<LoadResponse>("/api/load");
      const loaded = load.body as LoadResponse | null;
      if (load.status === 422 && loaded?.status === "invalid") {
        setPhase({ kind: "invalid", issues: loaded.issues, workbookFile: loaded.workbookFile });
        return;
      }
      if (load.status !== 200 || loaded?.status !== "valid") {
        setPhase({ kind: "error", message: errorMessage(load.status, load.body), during: "load" });
        return;
      }
      setPhase({ kind: "loading", step: "plan" });
      const planned = await postJson<PlanResponse>("/api/plan");
      if (planned.status !== 200 || !planned.body || !("result" in planned.body)) {
        setPhase({ kind: "error", message: errorMessage(planned.status, planned.body), during: "plan" });
        return;
      }
      setPhase({ kind: "ready", data: planned.body });
    } catch (error) {
      setPhase({ kind: "error", message: (error as Error).message, during: "load" });
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const data = phase.kind === "ready" ? phase.data : null;
  const trace = useMemo(
    () => ({
      trace: (f: TraceFilter) => {
        setFilter(f);
        setTab("allocations");
        window.scrollTo({ top: 0 });
      },
      farmIds: new Set(data?.result.farms.map((f) => f.farmId) ?? []),
      clientIds: new Set(data?.result.clients.map((c) => c.clientId) ?? []),
    }),
    [data, setTab],
  );

  // ARIA tabs pattern: arrow keys move between tabs.
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((t) => t.id === tab);
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const target = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + delta + TABS.length) % TABS.length;
    if (delta === 0 && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    setTab(TABS[target].id);
    tabRefs.current[TABS[target].id]?.focus();
  };

  return (
    <TraceContext.Provider value={trace}>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-name">Atlas Fresh</span>
            <h1 className="brand-sub">Daily Export Planner</h1>
            <span className="brand-date">Production × Commercial committee</span>
          </div>
          <Journey phase={phase} />
          <HealthBadge phase={phase} />
          <button type="button" className="btn primary" onClick={() => void run()} disabled={phase.kind === "loading"}>
            <span aria-hidden="true">↻</span> Reload workbook &amp; re-plan
          </button>
        </div>
      </header>

      <main className="shell">
        <p className="hitl" role="note">
          <strong>Decision support only.</strong> This plan is prepared for the Production and Commercial committee to review and
          approve. Nothing is executed, confirmed or sent to farms, clients or other systems.
        </p>

        <div aria-live="polite" className="sr-only">
          {phase.kind === "loading" ? (phase.step === "load" ? "Loading workbook" : "Computing plan") : ""}
          {phase.kind === "ready" ? "Plan ready" : ""}
          {phase.kind === "invalid" ? `Workbook rejected with ${phase.issues.length} validation issues` : ""}
          {phase.kind === "error" ? "Server error" : ""}
        </div>

        {phase.kind === "loading" && <LoadingState step={phase.step} />}
        {phase.kind === "invalid" && (
          <ValidationErrorState issues={phase.issues} workbookFile={phase.workbookFile} onRetry={() => void run()} />
        )}
        {phase.kind === "error" && <ServerErrorState message={phase.message} during={phase.during} onRetry={() => void run()} />}

        {data && (
          <>
            <div className="tabs" role="tablist" aria-label="Planning views" onKeyDown={onTabKey}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  className="tab"
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  <span className="step">{t.step}</span>
                  {t.id === "commercial" && data.result.kpis.atRiskCount > 0 && (
                    <span className="count" aria-label={`${data.result.kpis.atRiskCount} at risk`}>
                      {data.result.kpis.atRiskCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="panel" tabIndex={-1}>
              {tab === "overview" && <Overview result={data.result} onOpen={setTab} />}
              {tab === "production" && <ProductionView result={data.result} />}
              {tab === "commercial" && <CommercialView result={data.result} />}
              {tab === "allocations" && <AllocationsView result={data.result} filter={filter} onFilter={setFilter} />}
              {tab === "assistant" && <AssistantPanel result={data.result} />}
            </section>
          </>
        )}
      </main>
    </TraceContext.Provider>
  );
}

function Journey({ phase }: { phase: Phase }) {
  const loadState =
    phase.kind === "invalid" || (phase.kind === "error" && phase.during === "load")
      ? "failed"
      : phase.kind === "loading" && phase.step === "load"
        ? "active"
        : "done";
  const planState =
    phase.kind === "ready" ? "done" : phase.kind === "loading" && phase.step === "plan" ? "active" : phase.kind === "error" && phase.during === "plan" ? "failed" : "";
  const mark = (s: string) => (s === "done" ? "✓" : s === "failed" ? "✕" : s === "active" ? "…" : "");
  return (
    <ol className="journey" aria-label="Daily workflow">
      <li className={loadState}>Load {mark(loadState)}</li>
      <li className={loadState}>Validate {mark(loadState)}</li>
      <li className={planState}>Plan {mark(planState)}</li>
      <li className={phase.kind === "ready" ? "active" : ""}>Decide</li>
      <li className={phase.kind === "ready" ? "active" : ""}>Explain</li>
    </ol>
  );
}

function HealthBadge({ phase }: { phase: Phase }) {
  if (phase.kind === "loading") return <span className="health busy">Checking data…</span>;
  if (phase.kind === "invalid") return <span className="health bad">✕ Workbook invalid · {phase.issues.length} issue(s)</span>;
  if (phase.kind === "error") return <span className="health bad">✕ Server error</span>;
  const { summary, result, loadedAt } = phase.data;
  const passed = result.invariants.filter((i) => i.passed).length;
  const allPassed = passed === result.invariants.length;
  const time = new Date(loadedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <span className={`health ${allPassed ? "ok" : "bad"}`} title={`${summary.workbookFile} loaded at ${time}`}>
      {allPassed ? "✓" : "✕"} Workbook valid · {summary.farmCount} farms · {summary.clientCount} clients · {passed}/
      {result.invariants.length} plan checks · {time}
    </span>
  );
}
