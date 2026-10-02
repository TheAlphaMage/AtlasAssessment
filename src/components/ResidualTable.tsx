"use client";

/** Table of the fruit that goes to the local market, by farm and segment. Shared by Overview and Allocations. */
import { EmptyRow } from "@/components/ui/EmptyRow";
import tableStyles from "@/components/ui/Table.module.css";
import { IdLink } from "@/features/trace";
import { fmtEur, fmtT } from "@/lib/format";
import type { Residual } from "@/lib/domain/types";

interface ResidualTableProps {
  residuals: Residual[];
  /** Pass the grand totals to show a total row. Leave out when the list is filtered. */
  total?: { tonnes: number; valueEur: number };
  emptyMessage: string;
}

export function ResidualTable({ residuals, total, emptyMessage }: ResidualTableProps) {
  return (
    <div className={tableStyles.wrap}>
      <table className={tableStyles.table}>
        <caption className="sr-only">Local market residual by farm and segment</caption>
        <thead>
          <tr>
            <th scope="col">Farm</th>
            <th scope="col">Segment</th>
            <th scope="col" className={tableStyles.numeric}>Local tonnes</th>
            <th scope="col" className={tableStyles.numeric}>Local price / t</th>
            <th scope="col" className={tableStyles.numeric}>Local value</th>
          </tr>
        </thead>
        <tbody>
          {residuals.length === 0 && <EmptyRow columnCount={5}>{emptyMessage}</EmptyRow>}
          {residuals.map((residual) => (
            <tr key={`${residual.farmId}-${residual.segment}`}>
              <td><IdLink id={residual.farmId} /></td>
              <td><strong>{residual.segment}</strong></td>
              <td className={`${tableStyles.numeric} ${tableStyles.local}`}>{fmtT(residual.tonnes)}</td>
              <td className={tableStyles.numeric}>{fmtEur(residual.localPricePerT)}</td>
              <td className={tableStyles.numeric}>{fmtEur(residual.localValueEur)}</td>
            </tr>
          ))}
        </tbody>
        {total && residuals.length > 0 && (
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>Total</th>
              <td className={tableStyles.numeric}>{fmtT(total.tonnes)}</td>
              <td />
              <td className={tableStyles.numeric}>{fmtEur(total.valueEur)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
