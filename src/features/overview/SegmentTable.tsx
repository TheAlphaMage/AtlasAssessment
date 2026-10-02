"use client";

/** Exact figures per segment, tucked under "Show exact figures" for anyone who wants the numbers. */
import tableStyles from "@/components/ui/Table.module.css";
import { Variance } from "@/components/ui/Variance";
import { IdChips } from "@/features/trace";
import { fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";

export function SegmentTable({ result }: { result: PlanResult }) {
  const { kpis } = result;
  return (
    <div className={tableStyles.wrap}>
      <table className={tableStyles.table}>
        <caption className="sr-only">Segments: planned, actual, exported and local tonnes</caption>
        <thead>
          <tr>
            <th scope="col">Segment</th>
            <th scope="col" className={tableStyles.numeric}>Plan</th>
            <th scope="col" className={tableStyles.numeric}>Actual</th>
            <th scope="col" className={tableStyles.numeric}>Variance</th>
            <th scope="col" className={tableStyles.numeric}>Exported</th>
            <th scope="col" className={tableStyles.numeric}>Local</th>
            <th scope="col">Served clients</th>
          </tr>
        </thead>
        <tbody>
          {result.segments.map((segment) => (
            <tr key={segment.segment}>
              <th scope="row">Segment {segment.segment}</th>
              <td className={tableStyles.numeric}>{fmtT(segment.expectedT)}</td>
              <td className={tableStyles.numeric}>{fmtT(segment.actualT)}</td>
              <td className={tableStyles.numeric}><Variance value={segment.varianceT} /></td>
              <td className={tableStyles.numeric}>{fmtT(segment.exportedT)}</td>
              <td className={`${tableStyles.numeric} ${segment.localT > 0 ? tableStyles.local : ""}`}>{fmtT(segment.localT)}</td>
              <td><IdChips ids={segment.servedClientIds} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className={tableStyles.numeric}>{fmtT(kpis.expectedT)}</td>
            <td className={tableStyles.numeric}>{fmtT(kpis.actualT)}</td>
            <td className={tableStyles.numeric}><Variance value={kpis.varianceT} /></td>
            <td className={tableStyles.numeric}>{fmtT(kpis.exportT)}</td>
            <td className={`${tableStyles.numeric} ${tableStyles.local}`}>{fmtT(kpis.localT)}</td>
            <td className={tableStyles.muted}>
              Export + local = actual ({fmtT(kpis.exportT)} + {fmtT(kpis.localT)} = {fmtT(kpis.actualT)})
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
