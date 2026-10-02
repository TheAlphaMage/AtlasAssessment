"use client";

import { useContext } from "react";
import type { PlanResult } from "@/lib/domain/types";
import { fmtEur, fmtT } from "@/lib/format";
import { IdLink, Reason, StatusBadge, TraceContext } from "./common";

export function CommercialView({ result }: { result: PlanResult }) {
  const { trace } = useContext(TraceContext);
  const { kpis } = result;
  return (
    <section className="card" aria-label="Commercial: client service">
      <div className="card-head">
        <h2>Commercial — client service in processing order</h2>
        <p>
          Orders are served by export price (highest first, ties by client ID). Demand is a maximum; each order receives the
          closest acceptable quality first.
        </p>
      </div>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Clients: rule, demand, allocation, revenue, status and shortage reason</caption>
          <thead>
            <tr>
              <th scope="col">Priority · client</th>
              <th scope="col">Quality rule</th>
              <th scope="col" className="num">Price / t</th>
              <th scope="col" className="num">Demand</th>
              <th scope="col" className="num">Allocated</th>
              <th scope="col" className="num">Remaining</th>
              <th scope="col" className="num">Revenue</th>
              <th scope="col">Status</th>
              <th scope="col">Shortage reason</th>
              <th scope="col">Served from (farm, segment, t)</th>
            </tr>
          </thead>
          <tbody>
            {result.clients.map((c) => {
              const rows = result.allocations.filter((a) => a.clientId === c.clientId);
              const share = c.demandT > 0 ? c.allocatedT / c.demandT : 1;
              return (
                <tr key={c.clientId} className={c.atRisk ? "at-risk" : ""}>
                  <th scope="row">
                    <span className="muted small">#{c.priorityRank}</span> <IdLink id={c.clientId} />
                    <div className="small muted">{c.clientName}</div>
                  </th>
                  <td>
                    <strong className="nowrap">
                      {c.acceptanceMode} {c.requestedSegment}
                    </strong>
                    <div className="small muted">accepts {c.compatibleSegments.join(", ")}</div>
                  </td>
                  <td className="num">{fmtEur(c.pricePerT)}</td>
                  <td className="num">{fmtT(c.demandT)}</td>
                  <td className="num">
                    {fmtT(c.allocatedT)}
                    <div className={`bar ${c.atRisk ? "partial" : ""}`} aria-hidden="true">
                      <span style={{ width: `${share * 100}%` }} />
                    </div>
                  </td>
                  <td className={`num ${c.remainingT > 0 ? "" : "muted"}`}>
                    {c.remainingT > 0 ? <strong>{fmtT(c.remainingT)}</strong> : "—"}
                  </td>
                  <td className="num">{fmtEur(c.revenueEur)}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="reason-cell">
                    <Reason reason={c.shortageReason} />
                  </td>
                  <td className="served">
                    {rows.length === 0 ? (
                      <span className="muted">nothing allocated</span>
                    ) : (
                      <div className="chips">
                        {rows.map((a) => (
                          <span key={a.sequence} className="small nowrap">
                            <IdLink id={a.farmId} /> {a.segment} {a.tonnes}
                          </span>
                        ))}
                        <button type="button" className="btn small" style={{ padding: "0 6px" }} onClick={() => trace({ clientId: c.clientId })} aria-label={`Trace ${c.clientId} allocations`}>
                          Trace →
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={4}>
                Total exported
              </th>
              <td className="num">{fmtT(kpis.exportT)}</td>
              <td />
              <td className="num">{fmtEur(kpis.exportRevenueEur)}</td>
              <td colSpan={3}>
                {kpis.atRiskCount} of {kpis.clientCount} clients at risk
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
