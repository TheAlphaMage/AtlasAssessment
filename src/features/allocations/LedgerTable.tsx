"use client";

/** The allocation ledger, flat or grouped by client or farm (with subtotals). */
import { Fragment } from "react";
import { HeadCell, NumberCell, TextCell } from "@/components/app/TableCells";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { EntityLink } from "@/features/entities/EntityLink";
import { fmtEur, fmtT } from "@/lib/format";
import type { Allocation, ClientResult } from "@/lib/domain/types";
import { groupAllocations, type GroupBy } from "./groupAllocations";
import { LedgerRow } from "./LedgerRow";

interface LedgerTableProps {
  rows: Allocation[];
  clients: ClientResult[];
  groupBy: GroupBy;
}

const COLUMN_COUNT = 8;

export function LedgerTable({ rows, clients, groupBy }: LedgerTableProps) {
  const clientById = new Map(clients.map((client) => [client.clientId, client]));

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <HeadCell numeric>Step</HeadCell>
          <HeadCell>Client</HeadCell>
          <HeadCell>Farm</HeadCell>
          <HeadCell>Segment</HeadCell>
          <HeadCell numeric>Tonnes</HeadCell>
          <HeadCell>Quality fit</HeadCell>
          <HeadCell numeric>Price / t</HeadCell>
          <HeadCell numeric>Revenue</HeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TextCell colSpan={COLUMN_COUNT} className="py-10 text-center text-muted-foreground">No allocation matches these filters.</TextCell>
          </TableRow>
        )}
        {groupBy === "none" && rows.map((row) => <LedgerRow key={row.sequence} row={row} client={clientById.get(row.clientId)!} />)}
        {groupBy !== "none" &&
          groupAllocations(rows, groupBy).map((group) => (
            <Fragment key={group.key}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TextCell colSpan={4} className="font-medium">
                  <EntityLink id={group.key} /> <span className="text-muted-foreground">· {group.rows.length} rows</span>
                </TextCell>
                <NumberCell className="font-medium">{fmtT(group.tonnes)}</NumberCell>
                <TextCell colSpan={2} />
                <NumberCell className="font-medium">{fmtEur(group.revenueEur)}</NumberCell>
              </TableRow>
              {group.rows.map((row) => (
                <LedgerRow key={row.sequence} row={row} client={clientById.get(row.clientId)!} />
              ))}
            </Fragment>
          ))}
      </TableBody>
    </Table>
  );
}
