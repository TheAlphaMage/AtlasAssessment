"use client";

/** Summary of the client currently being traced: rule, price, delivered amount and why it is short. */
import { Pill } from "@/components/ui/Pill";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IdLink } from "@/features/trace";
import { fmtEur, fmtT, reasonLabel } from "@/lib/format";
import type { ClientResult } from "@/lib/domain/types";
import styles from "./FocusCard.module.css";

interface FocusCardProps {
  client: ClientResult;
}

export function FocusCard({ client }: FocusCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>
        <IdLink id={client.clientId} />
        <strong>{client.clientName}</strong>
        <StatusBadge status={client.status} />
        {client.shortageReason && <Pill tone="local">{client.shortageReason}</Pill>}
      </div>
      <p className={styles.line}>
        {client.acceptanceMode} {client.requestedSegment} (accepts {client.compatibleSegments.join(", ")}) · priority #
        {client.priorityRank} at {fmtEur(client.pricePerT)}/t · received {fmtT(client.allocatedT)} of {fmtT(client.demandT)}
      </p>
      {client.shortageReason && <p className={styles.line}>{reasonLabel(client.shortageReason)}</p>}
    </div>
  );
}
