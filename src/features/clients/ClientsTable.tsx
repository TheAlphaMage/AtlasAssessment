"use client";

/** The client orders in serving order. Clicking a row opens that client's drawer. */
import { ReasonBadge } from "@/components/app/ReasonBadge";
import { StatusBadge } from "@/components/app/StatusBadge";
import { HeadCell, NumberCell, TextCell } from "@/components/app/TableCells";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { EntityLink } from "@/features/entities/EntityLink";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";
import { fmtEur, fmtT } from "@/lib/format";
import type { ClientResult } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export function ClientsTable({ clients }: { clients: ClientResult[] }) {
  const { openEntity } = useEntityDrawer();

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <HeadCell className="w-10">#</HeadCell>
          <HeadCell>Client</HeadCell>
          <HeadCell>Rule</HeadCell>
          <HeadCell numeric>Price / t</HeadCell>
          <HeadCell numeric>Demand</HeadCell>
          <HeadCell className="w-44">Allocated</HeadCell>
          <HeadCell numeric>Remaining</HeadCell>
          <HeadCell numeric>Revenue</HeadCell>
          <HeadCell>Status</HeadCell>
          <HeadCell>Reason</HeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => {
          const share = client.demandT > 0 ? (client.allocatedT / client.demandT) * 100 : 100;
          return (
            <TableRow key={client.clientId} className="cursor-pointer" onClick={() => openEntity(client.clientId)}>
              <TextCell className="text-muted-foreground tabular-nums">{client.priorityRank}</TextCell>
              <TextCell>
                <EntityLink id={client.clientId} /> <span className="text-muted-foreground">{client.clientName}</span>
              </TextCell>
              <TextCell>
                {client.acceptanceMode === "EXACT" ? "Exact" : "Min."} {client.requestedSegment}
              </TextCell>
              <NumberCell>{fmtEur(client.pricePerT)}</NumberCell>
              <NumberCell>{fmtT(client.demandT)}</NumberCell>
              <TextCell>
                <div className="flex items-center gap-3">
                  <Progress value={share} className={cn("h-1.5 w-20", client.atRisk && "[&>*]:bg-warning")} aria-hidden="true" />
                  <span className="tabular-nums">{fmtT(client.allocatedT)}</span>
                </div>
              </TextCell>
              <NumberCell className={cn(client.remainingT > 0 && "font-medium text-warning")}>
                {client.remainingT > 0 ? fmtT(client.remainingT) : "—"}
              </NumberCell>
              <NumberCell>{fmtEur(client.revenueEur)}</NumberCell>
              <TextCell><StatusBadge status={client.status} /></TextCell>
              <TextCell><ReasonBadge reason={client.shortageReason} /></TextCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
