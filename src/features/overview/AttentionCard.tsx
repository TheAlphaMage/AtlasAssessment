"use client";

/** The client orders that are short today. Each row opens the client's detail drawer. */
import Link from "next/link";
import { ChevronRight, CircleCheck } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { ReasonBadge } from "@/components/app/ReasonBadge";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityLink } from "@/features/entities/EntityLink";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";
import { fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";

export function AttentionCard({ result }: { result: PlanResult }) {
  const { openEntity } = useEntityDrawer();
  const clientsAtRisk = result.clients.filter((client) => client.atRisk);

  return (
    <Card className="gap-0 pb-0 lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          Needs attention
          {clientsAtRisk.length > 0 && <Badge variant="warning" className="rounded-md tabular-nums">{clientsAtRisk.length}</Badge>}
        </CardTitle>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/clients?tab=at-risk">
              All clients <ChevronRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {clientsAtRisk.length === 0 && <EmptyState icon={CircleCheck} title="Every order is complete" />}
        <ul className="divide-y border-t">
          {clientsAtRisk.map((client) => (
            <li
              key={client.clientId}
              onClick={() => openEntity(client.clientId)}
              className="grid cursor-pointer grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span className="min-w-0 truncate">
                <EntityLink id={client.clientId} /> <span className="text-muted-foreground">{client.clientName}</span>
              </span>
              <StatusBadge status={client.status} />
              <span className="tabular-nums">
                <span className="font-medium text-warning">{fmtT(client.remainingT)} short</span>
              </span>
              <ReasonBadge reason={client.shortageReason} />
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
