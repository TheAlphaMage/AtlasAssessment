"use client";

/** The allocation ledger: every exported tonne, in the order the engine created it. */
import { EmptyRow } from "@/components/ui/EmptyRow";
import { Pill } from "@/components/ui/Pill";
import tableStyles from "@/components/ui/Table.module.css";
import { IdLink } from "@/features/trace";
import { fmtEur, fmtT } from "@/lib/format";
import type { Allocation, ClientResult, Kpis } from "@/lib/domain/types";

interface LedgerTableProps {
  rows: Allocation[];
  clients: ClientResult[];
  kpis: Kpis;
  /** Show the grand total row only when nothing is filtered. */
  showTotal: boolean;
  emptyMessage: string;
}

export function LedgerTable({ rows, clients, kpis, showTotal, emptyMessage }: LedgerTableProps) {
  return (
    <div className={tableStyles.wrap}>
      <table className={tableStyles.table}>
        <caption className="sr-only">Allocation rows in the order the engine created them</caption>
        <thead>
          <tr>
            <th scope="col" className={tableStyles.numeric}>Step</th>
            <th scope="col">Client</th>
            <th scope="col">Farm</th>
            <th scope="col">Segment</th>
            <th scope="col" className={tableStyles.numeric}>Tonnes</th>
            <th scope="col">Quality fit</th>
            <th scope="col" className={tableStyles.numeric}>Price / t</th>
            <th scope="col" className={tableStyles.numeric}>Export revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow columnCount={8}>{emptyMessage}</EmptyRow>}
          {rows.map((row) => {
            const client = clients.find((candidate) => candidate.clientId === row.clientId)!;
            return (
              <tr key={row.sequence}>
                <td className={`${tableStyles.numeric} ${tableStyles.muted}`}>{row.sequence}</td>
                <td>
                  <IdLink id={row.clientId} />{" "}
                  <span className={tableStyles.muted}>
                    {client.acceptanceMode} {client.requestedSegment}
                  </span>
                </td>
                <td><IdLink id={row.farmId} /></td>
                <td><IdLink id={row.segment} /></td>
                <td className={tableStyles.numeric}><strong>{fmtT(row.tonnes)}</strong></td>
                <td>{qualityFit(row, client)}</td>
                <td className={tableStyles.numeric}>{fmtEur(row.pricePerT)}</td>
                <td className={tableStyles.numeric}>{fmtEur(row.revenueEur)}</td>
              </tr>
            );
          })}
        </tbody>
        {showTotal && rows.length > 0 && (
          <tfoot>
            <tr>
              <th scope="row" colSpan={4}>Total export</th>
              <td className={tableStyles.numeric}>{fmtT(kpis.exportT)}</td>
              <td colSpan={2} />
              <td className={tableStyles.numeric}>{fmtEur(kpis.exportRevenueEur)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function qualityFit(row: Allocation, client: ClientResult) {
  if (row.qualityUpgrade === 0) return <span className={tableStyles.muted}>Exact fit</span>;
  return (
    <Pill tone="brand" icon="arrow-up">
      Upgrade +{row.qualityUpgrade} ({client.requestedSegment} → {row.segment})
    </Pill>
  );
}
