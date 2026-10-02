"use client";

import { useMemo, useState } from "react";
import { SEGMENTS } from "@/lib/domain/constants";
import type { FarmResult, PlanResult, Segment } from "@/lib/domain/types";
import { fmtNumber, fmtPct, fmtT } from "@/lib/format";
import { IdLink, Variance } from "./common";
import { EmptyRow } from "./StateViews";

type SortKey = "farm" | "shortfall" | "local";

export function ProductionView({ result }: { result: PlanResult }) {
  const [sort, setSort] = useState<SortKey>("farm");
  const [onlyBelow, setOnlyBelow] = useState(false);

  // Segments whose shortfall contributes to a client shortage (from the server's gap analysis).
  const drivers = useMemo(() => {
    const map = new Map<Segment, string[]>();
    for (const g of result.gapImpacts) if (g.affectedClientIds.length) map.set(g.segment, g.affectedClientIds);
    return map;
  }, [result.gapImpacts]);

  const farms = useMemo(() => {
    const rows = onlyBelow ? result.farms.filter((f) => f.varianceTotalT < 0 || SEGMENTS.some((s) => f.segments[s].varianceT < 0)) : [...result.farms];
    const byId = (a: FarmResult, b: FarmResult) => (a.farmId < b.farmId ? -1 : 1);
    if (sort === "farm") return rows.sort(byId);
    if (sort === "local") return rows.sort((a, b) => b.localT - a.localT || byId(a, b));
    return rows.sort((a, b) => a.varianceTotalT - b.varianceTotalT || byId(a, b));
  }, [result.farms, sort, onlyBelow]);

  const { kpis } = result;

  return (
    <section className="card" aria-label="Production: plan versus actual by farm">
      <div className="card-head">
        <h2>Production — plan vs actual by farm and segment</h2>
        <p>
          Expected tonnes = expected daily capacity × expected mix. Variance = actual − expected. Only actual tonnes are
          available for allocation.
        </p>
      </div>
      {drivers.size > 0 && (
        <div className="card-body" style={{ borderBottom: "1px solid var(--border)" }}>
          <strong>Gaps that hurt clients today: </strong>
          {[...drivers].map(([segment, clients], i) => {
            const gap = result.gapImpacts.find((g) => g.segment === segment)!;
            return (
              <span key={segment}>
                {i > 0 && " · "}Segment {segment} <Variance value={gap.varianceT} /> t →{" "}
                {clients.map((id) => (
                  <IdLink key={id} id={id} />
                ))}{" "}
                short
              </span>
            );
          })}
          <span className="muted small"> (highlighted cells below)</span>
        </div>
      )}
      <div className="toolbar">
        <label>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="farm">Farm ID</option>
            <option value="shortfall">Largest total shortfall first</option>
            <option value="local">Most local residual first</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={onlyBelow} onChange={(e) => setOnlyBelow(e.target.checked)} />
          Only farms with a segment below plan
        </label>
        <span className="legend">
          <span>▼ below plan</span>
          <span>▲ above plan</span>
          <span>
            <span className="drives-note">⚠ red cell</span> = shortfall in a segment that left a client short
          </span>
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Farms: expected capacity and mix, actual tonnes and variance per segment, export and local residual</caption>
          <thead>
            <tr>
              <th scope="col">Farm</th>
              <th scope="col" className="num">Capacity</th>
              {SEGMENTS.map((s) => (
                <th key={s} scope="col" className="num">
                  Seg {s}
                  <div className="small muted" style={{ textTransform: "none" }}>actual · plan (mix)</div>
                </th>
              ))}
              <th scope="col" className="num">Total plan → actual</th>
              <th scope="col" className="num">Exported</th>
              <th scope="col" className="num">Local</th>
            </tr>
          </thead>
          <tbody>
            {farms.length === 0 && <EmptyRow colSpan={9}>No farm is below plan in any segment.</EmptyRow>}
            {farms.map((f) => (
              <tr key={f.farmId}>
                <th scope="row">
                  <IdLink id={f.farmId} />
                  <div className="small muted">{f.farmName}</div>
                </th>
                <td className="num">{fmtT(f.expectedCapacityT)}</td>
                {SEGMENTS.map((s) => {
                  const seg = f.segments[s];
                  const drives = seg.varianceT < 0 && drivers.has(s);
                  return (
                    <td key={s} className={`num ${drives ? "drives" : ""}`}>
                      <div className="seg-cell">
                        <span className="actual">{fmtNumber(seg.actualT)}</span>
                        <span className="plan">
                          plan {fmtNumber(seg.expectedT)} ({fmtPct(seg.mix, 0)})
                        </span>
                        <Variance value={seg.varianceT} />
                        {drives && <span className="drives-note">⚠ {drivers.get(s)!.join(", ")}</span>}
                      </div>
                    </td>
                  );
                })}
                <td className="num">
                  <div className="seg-cell">
                    <span className="actual">{fmtNumber(f.actualTotalT)}</span>
                    <span className="plan">plan {fmtNumber(f.expectedTotalT)}</span>
                    <Variance value={f.varianceTotalT} />
                  </div>
                </td>
                <td className="num">{fmtT(f.exportedT)}</td>
                <td className={`num ${f.localT > 0 ? "local-cell" : "muted"}`}>{f.localT > 0 ? fmtT(f.localT) : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">All farms</th>
              <td className="num" />
              {result.segments.map((s) => (
                <td key={s.segment} className="num">
                  <div className="seg-cell">
                    <span className="actual">{fmtNumber(s.actualT)}</span>
                    <span className="plan">plan {fmtNumber(s.expectedT)}</span>
                    <Variance value={s.varianceT} />
                  </div>
                </td>
              ))}
              <td className="num">
                <div className="seg-cell">
                  <span className="actual">{fmtNumber(kpis.actualT)}</span>
                  <span className="plan">plan {fmtNumber(kpis.expectedT)}</span>
                  <Variance value={kpis.varianceT} />
                </div>
              </td>
              <td className="num">{fmtT(kpis.exportT)}</td>
              <td className="num local-cell">{fmtT(kpis.localT)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
