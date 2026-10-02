"use client";

import type { PlanException, PlanResult, Segment } from "@/lib/domain/types";
import { fmtEur, fmtPct, fmtSignedT, fmtT } from "@/lib/format";
import { IdChips, IdLink, Variance } from "./common";

type Tab = "overview" | "production" | "commercial" | "allocations" | "assistant";

export function Overview({ result, onOpen }: { result: PlanResult; onOpen: (tab: Tab) => void }) {
  const { kpis } = result;
  const stationFull = kpis.stationFull;
  const clientExceptions = result.exceptions.filter((e) => e.kind === "CLIENT_AT_RISK");
  const supplyExceptions = result.exceptions.filter((e) => e.kind !== "CLIENT_AT_RISK");

  return (
    <>
      <div className="card headline" aria-label="Situation summary">
        Today <strong>{fmtT(kpis.actualT)}</strong> arrived against <strong>{fmtT(kpis.expectedT)}</strong> planned (
        <span className={kpis.varianceT < 0 ? "bad" : ""}>{fmtSignedT(kpis.varianceT)}</span>). The plan exports{" "}
        <strong>{fmtT(kpis.exportT)}</strong> ({fmtPct(kpis.exportRate)} of the crop)
        {stationFull ? <> and the export station is <strong className="warn">full</strong></> : null}.{" "}
        <strong className="warn">{fmtT(kpis.localT)}</strong> fall back to the local market, worth{" "}
        <strong className="warn">{fmtEur(kpis.localValueEur)}</strong>.{" "}
        <strong className={kpis.atRiskCount ? "bad" : ""}>
          {kpis.atRiskCount} of {kpis.clientCount} clients
        </strong>{" "}
        {kpis.atRiskCount === 1 ? "is" : "are"} at risk. Total plan value <strong>{fmtEur(kpis.totalValueEur)}</strong>.
      </div>

      <KpiStrip result={result} />

      <div className="attention">
        <ExceptionCard
          title="Clients at risk — and why"
          subtitle="Partial or unserved orders, with the cause traced back to supply or capacity."
          items={clientExceptions}
          empty="Every client order is complete."
          action={<button type="button" className="btn" onClick={() => onOpen("commercial")}>Open Commercial view</button>}
        />
        <ExceptionCard
          title="Production, station and local market"
          subtitle="Plan-vs-actual gaps, station limit and the low-value residual."
          items={supplyExceptions}
          empty="No production or capacity exceptions."
          action={<button type="button" className="btn" onClick={() => onOpen("production")}>Open Production view</button>}
        />
      </div>

      <SegmentBridge result={result} />
      <LocalResidualPanel result={result} />
    </>
  );
}

function KpiStrip({ result }: { result: PlanResult }) {
  const { kpis } = result;
  const full = kpis.stationFull;
  return (
    <div className="kpis" role="list" aria-label="Key figures">
      <div className="card kpi" role="listitem">
        <span className="kpi-label">Supply: plan → actual</span>
        <span className="kpi-value">{fmtT(kpis.actualT)}</span>
        <span className="kpi-sub">
          plan {fmtT(kpis.expectedT)} · <Variance value={kpis.varianceT} />
        </span>
        <span className="kpi-sub">
          {result.segments.map((s) => `${s.segment} ${s.actualT}`).join(" · ")} t
        </span>
      </div>
      <div className={`card kpi ${full ? "warn" : ""}`} role="listitem">
        <span className="kpi-label">Station capacity</span>
        <span className="kpi-value">
          {fmtT(kpis.exportT)} <span className="kpi-sub">/ {fmtT(kpis.stationCapacityT)}</span>
        </span>
        <div className={`meter ${full ? "full" : ""}`} aria-hidden="true">
          <span style={{ width: `${Math.min(100, kpis.stationUtilization * 100)}%` }} />
        </div>
        <span className="kpi-sub">
          {fmtPct(kpis.stationUtilization)} used{full ? " — full" : ""}
        </span>
      </div>
      <div className="card kpi" role="listitem">
        <span className="kpi-label">Export</span>
        <span className="kpi-value">{fmtPct(kpis.exportRate)}</span>
        <span className="kpi-sub">export rate · {fmtT(kpis.exportT)} of {fmtT(kpis.actualT)}</span>
      </div>
      <div className={`card kpi ${kpis.localT > 0 ? "warn" : ""}`} role="listitem">
        <span className="kpi-label">Local market residual</span>
        <span className="kpi-value">{fmtT(kpis.localT)}</span>
        <span className="kpi-sub">
          worth {fmtEur(kpis.localValueEur)} ({fmtPct(kpis.localMarketRatio, 0)} of reference)
        </span>
      </div>
      <div className="card kpi" role="listitem">
        <span className="kpi-label">Value</span>
        <span className="kpi-value">{fmtEur(kpis.totalValueEur)}</span>
        <span className="kpi-sub">export {fmtEur(kpis.exportRevenueEur)}</span>
        <span className="kpi-sub">+ local {fmtEur(kpis.localValueEur)}</span>
      </div>
      <div className={`card kpi ${kpis.atRiskCount > 0 ? "bad" : ""}`} role="listitem">
        <span className="kpi-label">Clients at risk</span>
        <span className="kpi-value">
          {kpis.atRiskCount} <span className="kpi-sub">of {kpis.clientCount}</span>
        </span>
        <div className="chips">
          {result.clients
            .filter((c) => c.atRisk)
            .map((c) => (
              <IdLink key={c.clientId} id={c.clientId} />
            ))}
        </div>
      </div>
    </div>
  );
}

function ExceptionCard({
  title,
  subtitle,
  items,
  empty,
  action,
}: {
  title: string;
  subtitle: string;
  items: PlanException[];
  empty: string;
  action: React.ReactNode;
}) {
  return (
    <section className="card" aria-label={title}>
      <div className="card-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <span style={{ marginLeft: "auto" }}>{action}</span>
      </div>
      <div className="card-body">
        {items.length === 0 ? (
          <p className="muted">✓ {empty}</p>
        ) : (
          <ul className="exc-list">
            {items.map((e, i) => (
              <li key={i} className={`exc ${e.severity}`}>
                <div className="exc-title">
                  <span className={`sev ${e.severity}`}>{e.severity === "high" ? "Action" : e.severity === "medium" ? "Watch" : "Info"}</span>
                  <span>{e.title}</span>
                </div>
                <p className="exc-detail">{e.detail}</p>
                <IdChips ids={e.evidenceIds} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Per segment: what was planned, what arrived, where it went, and which clients it affected. */
function SegmentBridge({ result }: { result: PlanResult }) {
  const { kpis } = result;
  // A short client is linked to a segment if it accepts that segment and the segment explains the shortage:
  // supply shortages → every compatible segment; capacity shortages → only segments with unexported fruit.
  const shortClients = (segment: Segment, localT: number) =>
    result.clients.filter(
      (c) =>
        c.atRisk &&
        c.compatibleSegments.includes(segment) &&
        (c.shortageReason === "INSUFFICIENT_COMPATIBLE_SEGMENT" || localT > 0),
    );
  return (
    <section className="card" aria-label="From farms to clients">
      <div className="card-head">
        <h2>From farms to clients, by quality segment</h2>
        <p>Read left to right: planned supply → what arrived → exported to clients → left for the local market.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Segment</th>
              <th scope="col" className="num">Plan</th>
              <th scope="col" className="num">Actual</th>
              <th scope="col" className="num">Variance</th>
              <th scope="col" className="num">Exported</th>
              <th scope="col" className="num">Local</th>
              <th scope="col">Served clients</th>
              <th scope="col">Short clients this segment could serve</th>
            </tr>
          </thead>
          <tbody>
            {result.segments.map((s) => {
              const risk = shortClients(s.segment, s.localT);
              return (
                <tr key={s.segment}>
                  <th scope="row">
                    <IdLink id={s.segment} />
                  </th>
                  <td className="num">{fmtT(s.expectedT)}</td>
                  <td className="num">
                    <strong>{fmtT(s.actualT)}</strong>
                  </td>
                  <td className="num">
                    <Variance value={s.varianceT} />
                  </td>
                  <td className="num">{fmtT(s.exportedT)}</td>
                  <td className={`num ${s.localT > 0 ? "local-cell" : ""}`}>{fmtT(s.localT)}</td>
                  <td>
                    <IdChips ids={s.servedClientIds} />
                  </td>
                  <td>
                    {risk.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <div className="chips">
                        {risk.map((c) => (
                          <span key={c.clientId} className="chips">
                            <IdLink id={c.clientId} />
                            <span className={`reason ${c.shortageReason}`}>{fmtT(c.remainingT)} short · {c.shortageReason}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td className="num">{fmtT(kpis.expectedT)}</td>
              <td className="num">{fmtT(kpis.actualT)}</td>
              <td className="num">
                <Variance value={kpis.varianceT} />
              </td>
              <td className="num">{fmtT(kpis.exportT)}</td>
              <td className="num local-cell">{fmtT(kpis.localT)}</td>
              <td colSpan={2} className="muted small">
                Export {fmtT(kpis.exportT)} + local {fmtT(kpis.localT)} = actual {fmtT(kpis.actualT)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function LocalResidualPanel({ result }: { result: PlanResult }) {
  const { kpis } = result;
  const stationFull = kpis.stationFull;
  const blocked = result.clients.filter((c) => c.shortageReason === "STATION_CAPACITY_REACHED");
  return (
    <section className="card local-card" aria-label="Local market residual">
      <div className="card-head">
        <h2>Local market residual</h2>
        <p>Every actual tonne not exported is sold locally at {fmtPct(kpis.localMarketRatio, 0)} of its segment reference export price.</p>
      </div>
      <div className="card-body local-grid">
        <div>
          <div className="local-figure">{fmtT(kpis.localT)}</div>
          <div className="local-value">≈ {fmtEur(kpis.localValueEur)} local value</div>
          <p className="small muted" style={{ marginTop: 6 }}>
            At reference export prices the same fruit would be worth {fmtEur(kpis.localReferenceExportValueEur)}.
          </p>
          <p className="small" style={{ marginTop: 8 }}>
            {kpis.localT === 0
              ? "All actual receipts are exported today."
              : stationFull
                ? `Why: the station's ${fmtT(kpis.stationCapacityT)} export capacity is fully used while ${fmtT(kpis.actualT)} arrived.`
                : "Why: no remaining client order accepts this fruit."}
            {blocked.length > 0 && (
              <>
                {" "}Orders still waiting for capacity:{" "}
                {blocked.map((c, i) => (
                  <span key={c.clientId}>
                    {i > 0 && ", "}
                    <IdLink id={c.clientId} /> {fmtT(c.remainingT)} short
                  </span>
                ))}
                .
              </>
            )}
          </p>
        </div>
        <div className="table-wrap">
          <table>
            <caption>Residual by farm and segment</caption>
            <thead>
              <tr>
                <th scope="col">Farm</th>
                <th scope="col">Segment</th>
                <th scope="col" className="num">Local tonnes</th>
                <th scope="col" className="num">Local price / t</th>
                <th scope="col" className="num">Local value</th>
              </tr>
            </thead>
            <tbody>
              {result.residuals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">No residual — everything received is exported.</td>
                </tr>
              ) : (
                result.residuals.map((r) => (
                  <tr key={`${r.farmId}-${r.segment}`}>
                    <td>
                      <IdLink id={r.farmId} />
                    </td>
                    <td>{r.segment}</td>
                    <td className="num local-cell">{fmtT(r.tonnes)}</td>
                    <td className="num">{fmtEur(r.localPricePerT)}</td>
                    <td className="num">{fmtEur(r.localValueEur)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {result.residuals.length > 0 && (
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total</th>
                  <td className="num">{fmtT(kpis.localT)}</td>
                  <td />
                  <td className="num">{fmtEur(kpis.localValueEur)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </section>
  );
}
