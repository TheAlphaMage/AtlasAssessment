"use client";

/** One allocation: which farm's segment fruit goes to which client, how many tonnes, at what price. */
import { NumberCell, TextCell } from "@/components/app/TableCells";
import { Badge } from "@/components/ui/badge";
import { TableRow } from "@/components/ui/table";
import { EntityLink } from "@/features/entities/EntityLink";
import { fmtEur, fmtT } from "@/lib/format";
import type { Allocation, ClientResult } from "@/lib/domain/types";

export function LedgerRow({ row, client }: { row: Allocation; client: ClientResult }) {
  return (
    <TableRow>
      <NumberCell className="w-14 text-muted-foreground">{row.sequence}</NumberCell>
      <TextCell>
        <EntityLink id={row.clientId} />{" "}
        <span className="text-muted-foreground">
          {client.acceptanceMode === "EXACT" ? "Exact" : "Min."} {client.requestedSegment}
        </span>
      </TextCell>
      <TextCell><EntityLink id={row.farmId} /></TextCell>
      <TextCell><EntityLink id={row.segment} /></TextCell>
      <NumberCell className="font-medium">{fmtT(row.tonnes)}</NumberCell>
      <TextCell>
        {row.qualityUpgrade === 0 ? (
          <span className="text-muted-foreground">Exact fit</span>
        ) : (
          <Badge variant="secondary" className="rounded-md">
            Upgrade +{row.qualityUpgrade} · {client.requestedSegment} → {row.segment}
          </Badge>
        )}
      </TextCell>
      <NumberCell className="text-muted-foreground">{fmtEur(row.pricePerT)}</NumberCell>
      <NumberCell>{fmtEur(row.revenueEur)}</NumberCell>
    </TableRow>
  );
}
