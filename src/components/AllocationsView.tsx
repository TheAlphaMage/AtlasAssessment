"use client";

import { SEGMENTS } from "@/lib/domain/constants";
import type { PlanResult, Segment } from "@/lib/domain/types";
import { fmtEur, fmtT } from "@/lib/format";
import { IdLink, StatusBadge, type TraceFilter } from "./common";
import { EmptyRow } from "./StateViews";

export function AllocationsView({
  result,
  filter,
  onFilter,
}: {
  result: PlanResult;
  filter: TraceFilter;
  onFilter: (f: TraceFilter) => void;
}) {
  const { kpis } = result;
  const matches = (farmId: string, segment: Segment, clientId?: string) =>
    (!filter.farmId || filter.farmId === farmId) &&
    (!filter.segment || filter.segment === segment) &&
    (!filter.clientId || filter.clientId === clientId);
  const rows = result.allocations.filter((a) => matches(a.farmId, a.segment, a.clientId));
  // Residual rows have no client: hide them when filtering by client.
  const residuals = filter.clientId ? [] : result.residuals.filter((r) => matches(r.farmId, r.segment));
  const focusedClient = filter.clientId ? result.clients.find((c) => c.clientId === filter.clientId) : undefined;
  const filtered = Boolean(filter.clientId || filter.farmId || filter.segment);
  const set = (patch: Partial<TraceFilter>) => onFilter({ ...filter, ...patch });

  return (
    <>
      <section className="card" aria-label="Allocation trace">
        <div className="card-head">
          <h2>Allocations — farm → segment → client</h2>
          <p>
            Every exported tonne resolves to one farm, segment and client; every unexported tonne goes local. Export{" "}
            {fmtT(kpis.exportT)} + local {fmtT(kpis.localT)} = actual {fmtT(kpis.actualT)}.
          </p>
        </div>
        <div className="toolbar" role="search" aria-label="Filter allocations">
          <label>
            Client
            <select value={filter.clientId ?? ""} onChange={(e) => set({ clientId: e.target.value || undefined })}>
              <option value="">All clients</option>
              {result.clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.clientId} · {c.acceptanceMode} {c.requestedSegment} · {c.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Farm
            <select value={filter.farmId ?? ""} onChange={(e) => set({ farmId: e.target.value || undefined })}>
              <option value="">All farms</option>
              {[...result.farms]
                .sort((a, b) => (a.farmId < b.farmId ? -1 : 1))
                .map((f) => (
                  <option key={f.farmId} value={f.farmId}>
                    {f.farmId}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Segment
            <select value={filter.segment ?? ""} onChange={(e) => set({ segment: (e.target.value || undefined) as Segment | undefined })}>
              <option value="">All segments</option>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {filtered && (
            <button type="button" className="btn" onClick={() => onFilter({})}>
              Clear filters
            </button>
          )}
          <span className="legend" aria-live="polite">
            Showing {rows.length} of {result.allocations.length} allocation rows
          </span>
        </div>

        {focusedClient && (
          <div className="card-body" style={{ borderBottom: "1px solid var(--border)" }}>
            <IdLink id={focusedClient.clientId} /> <strong>{focusedClient.clientName}</strong> · {focusedClient.acceptanceMode}{" "}
            {focusedClient.requestedSegment} (accepts {focusedClient.compatibleSegments.join(", ")}) · priority #
            {focusedClient.priorityRank} at {fmtEur(focusedClient.pricePerT)}/t · {fmtT(focusedClient.allocatedT)} of{" "}
            {fmtT(focusedClient.demandT)} · <StatusBadge status={focusedClient.status} />{" "}
            {focusedClient.shortageReason && <span className={`reason ${focusedClient.shortageReason}`}>{focusedClient.shortageReason}</span>}
          </div>
        )}

        <div className="table-wrap">
          <table>
            <caption className="sr-only">Allocation rows in the order the engine created them</caption>
            <thead>
              <tr>
                <th scope="col" className="num">Step</th>
                <th scope="col">Client</th>
                <th scope="col">Farm</th>
                <th scope="col">Segment</th>
                <th scope="col" className="num">Tonnes</th>
                <th scope="col">Quality fit</th>
                <th scope="col" className="num">Price / t</th>
                <th scope="col" className="num">Export revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <EmptyRow colSpan={8}>
                  {result.allocations.length === 0
                    ? "The plan contains no export allocations: no compatible supply matched any client order."
                    : "No export allocation matches these filters."}
                </EmptyRow>
              )}
              {rows.map((a) => {
                const client = result.clients.find((c) => c.clientId === a.clientId)!;
                return (
                  <tr key={a.sequence}>
                    <td className="num muted">{a.sequence}</td>
                    <td>
                      <IdLink id={a.clientId} />{" "}
                      <span className="small muted">
                        {client.acceptanceMode} {client.requestedSegment}
                      </span>
                    </td>
                    <td>
                      <IdLink id={a.farmId} />
                    </td>
                    <td>
                      <strong>{a.segment}</strong>
                    </td>
                    <td className="num">
                      <strong>{fmtT(a.tonnes)}</strong>
                    </td>
                    <td>
                      {a.qualityUpgrade === 0 ? (
                        <span className="muted">Exact fit</span>
                      ) : (
                        <span>
                          ▲ Upgrade +{a.qualityUpgrade} ({client.requestedSegment} → {a.segment})
                        </span>
                      )}
                    </td>
                    <td className="num">{fmtEur(a.pricePerT)}</td>
                    <td className="num">{fmtEur(a.revenueEur)}</td>
                  </tr>
                );
              })}
            </tbody>
            {!filtered && rows.length > 0 && (
              <tfoot>
                <tr>
                  <th scope="row" colSpan={4}>
                    Total export
                  </th>
                  <td className="num">{fmtT(kpis.exportT)}</td>
                  <td colSpan={2} />
                  <td className="num">{fmtEur(kpis.exportRevenueEur)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className="card local-card" aria-label="Unexported residual">
        <div className="card-head">
          <h2>Unexported → local market</h2>
          <p>Supply left after all client orders were processed, valued at {Math.round(kpis.localMarketRatio * 100)}% of the segment reference price.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Farm</th>
                <th scope="col">Segment</th>
                <th scope="col" className="num">Tonnes</th>
                <th scope="col" className="num">Local price / t</th>
                <th scope="col" className="num">Local value</th>
              </tr>
            </thead>
            <tbody>
              {residuals.length === 0 && (
                <EmptyRow colSpan={5}>
                  {filter.clientId ? "Local residual is not tied to a client — clear the client filter to see it." : "No local residual for this selection."}
                </EmptyRow>
              )}
              {residuals.map((r) => (
                <tr key={`${r.farmId}-${r.segment}`}>
                  <td>
                    <IdLink id={r.farmId} />
                  </td>
                  <td>
                    <strong>{r.segment}</strong>
                  </td>
                  <td className="num local-cell">{fmtT(r.tonnes)}</td>
                  <td className="num">{fmtEur(r.localPricePerT)}</td>
                  <td className="num">{fmtEur(r.localValueEur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-label="How the plan is built">
        <div className="card-body">
          <details>
            <summary>How the plan is built (deterministic policy) and plan checks</summary>
            <ol className="policy">
              <li>Available supply = each farm&apos;s actual A/B/C/D tonnes. Planned tonnes are for comparison only.</li>
              <li>Client orders are processed by export price per tonne, highest first; equal prices by client ID.</li>
              <li>EXACT accepts only the requested segment; MINIMUM accepts the requested segment or better (A &gt; B &gt; C &gt; D).</li>
              <li>Compatible supply is used closest quality first (smallest upgrade), then by farm ID.</li>
              <li>Allocation moves in 5 t steps until the order, the compatible supply or the station capacity is exhausted.</li>
              <li>Everything not exported goes local at the local-market ratio × the segment reference price.</li>
            </ol>
            <h3 style={{ margin: "12px 0 6px" }}>Plan checks (recomputed on the server for every plan)</h3>
            <ul className="checks">
              {result.invariants.map((i) => (
                <li key={i.name}>
                  <span className={i.passed ? "pass" : "fail"}>{i.passed ? "✓ PASS" : "✕ FAIL"}</span> {i.name}{" "}
                  <span className="muted small">({i.detail})</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    </>
  );
}
