"use client";

/** Fruit that goes to the local market, by farm and segment, with its local price and value. */
import { LOCAL_STRIPES } from "@/components/app/localStripes";
import { HeadCell, NumberCell, TextCell } from "@/components/app/TableCells";
import { Table, TableBody, TableFooter, TableHeader, TableRow } from "@/components/ui/table";
import { EntityLink } from "@/features/entities/EntityLink";
import { fmtEur, fmtT } from "@/lib/format";
import type { Kpis, Residual } from "@/lib/domain/types";

export function ResidualTable({ residuals, kpis }: { residuals: Residual[]; kpis: Kpis }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <HeadCell>Farm</HeadCell>
          <HeadCell>Segment</HeadCell>
          <HeadCell className="w-1/3">Share</HeadCell>
          <HeadCell numeric>Tonnes</HeadCell>
          <HeadCell numeric>Local price / t</HeadCell>
          <HeadCell numeric>Local value</HeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {residuals.length === 0 && (
          <TableRow>
            <TextCell colSpan={6} className="py-10 text-center text-muted-foreground">Nothing goes to the local market today.</TextCell>
          </TableRow>
        )}
        {residuals.map((residual) => (
          <TableRow key={`${residual.farmId}-${residual.segment}`}>
            <TextCell><EntityLink id={residual.farmId} /></TextCell>
            <TextCell><EntityLink id={residual.segment} /></TextCell>
            <TextCell>
              <div className="h-2 rounded-full bg-muted" aria-hidden="true">
                <div className={`h-2 rounded-full ${LOCAL_STRIPES}`} style={{ width: `${(residual.tonnes / kpis.localT) * 100}%` }} />
              </div>
            </TextCell>
            <NumberCell className="font-medium text-warning">{fmtT(residual.tonnes)}</NumberCell>
            <NumberCell className="text-muted-foreground">{fmtEur(residual.localPricePerT)}</NumberCell>
            <NumberCell>{fmtEur(residual.localValueEur)}</NumberCell>
          </TableRow>
        ))}
      </TableBody>
      {residuals.length > 0 && (
        <TableFooter>
          <TableRow>
            <TextCell colSpan={3}>Total</TextCell>
            <NumberCell>{fmtT(kpis.localT)}</NumberCell>
            <NumberCell />
            <NumberCell>{fmtEur(kpis.localValueEur)}</NumberCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
