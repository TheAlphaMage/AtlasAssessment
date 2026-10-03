"use client";

/** When the ledger is filtered to one client, a one-line summary of that order sits above the rows. */
import { ReasonBadge } from "@/components/app/ReasonBadge";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";
import { fmtEur, fmtT } from "@/lib/format";
import type { ClientResult } from "@/lib/domain/types";

export function ClientFocusStrip({ client }: { client: ClientResult }) {
  const { openEntity } = useEntityDrawer();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/40 px-4 py-2.5">
      <span className="font-medium">
        {client.clientId} <span className="font-normal text-muted-foreground">{client.clientName}</span>
      </span>
      <StatusBadge status={client.status} />
      <span className="tabular-nums text-muted-foreground">
        {fmtT(client.allocatedT)} of {fmtT(client.demandT)} · {fmtEur(client.revenueEur)}
      </span>
      {client.shortageReason && <ReasonBadge reason={client.shortageReason} />}
      <Button variant="ghost" size="sm" className="ml-auto" onClick={() => openEntity(client.clientId)}>
        Why?
      </Button>
    </div>
  );
}
