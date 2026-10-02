"use client";

/**
 * One client order as a row: rank, rule, price, how much was delivered, revenue and status.
 * At-risk orders show their reason; every order can expand to show exactly which farms served it.
 */
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { classNames } from "@/components/ui/classNames";
import { cssVariables } from "@/components/ui/cssVariables";
import { IdLink } from "@/features/trace";
import { fmtEur, fmtT, reasonLabel } from "@/lib/format";
import type { Allocation, ClientResult } from "@/lib/domain/types";
import { ClientSources } from "./ClientSources";
import styles from "./ClientRow.module.css";

interface ClientRowProps {
  client: ClientResult;
  /** The allocation rows that serve this client. */
  allocations: Allocation[];
}

export function ClientRow({ client, allocations }: ClientRowProps) {
  // Orders at risk start open so their sources are visible straight away.
  const [isOpen, setIsOpen] = useState(client.atRisk);

  const deliveredShare = client.demandT > 0 ? client.allocatedT / client.demandT : 1;
  const detailsId = `client-${client.clientId}-details`;

  return (
    <li className={classNames(styles.row, client.atRisk && styles.atRisk)}>
      <div className={styles.main}>
        <div className={styles.who}>
          <span className={styles.rank}>#{client.priorityRank}</span>
          <div>
            <IdLink id={client.clientId} />
            <p className={styles.name}>{client.clientName}</p>
          </div>
        </div>

        <div>
          <strong>
            {client.acceptanceMode} {client.requestedSegment}
          </strong>
          <p className={styles.sub}>accepts {client.compatibleSegments.join(", ")}</p>
        </div>

        <span className={styles.number}>{fmtEur(client.pricePerT)}</span>

        <div className={styles.delivery}>
          <span className={styles.number}>
            <strong>{fmtT(client.allocatedT)}</strong> of {fmtT(client.demandT)}
          </span>
          <div className={styles.track} aria-hidden="true">
            <div
              className={classNames(styles.fill, client.atRisk && styles.fillAtRisk)}
              style={cssVariables({ "--share": deliveredShare })}
            />
          </div>
        </div>

        <span className={classNames(styles.number, client.remainingT > 0 && styles.short)}>
          {client.remainingT > 0 ? fmtT(client.remainingT) : "—"}
        </span>

        <span className={styles.number}>{fmtEur(client.revenueEur)}</span>

        <StatusBadge status={client.status} />

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={isOpen}
          aria-controls={detailsId}
          aria-label={`${isOpen ? "Hide" : "Show"} sources for ${client.clientId}`}
          onClick={() => setIsOpen((open) => !open)}
        >
          <Icon name="chevron-down" size={18} className={classNames(styles.chevron, isOpen && styles.chevronOpen)} />
        </button>
      </div>

      {client.shortageReason && (
        <p className={styles.reason}>
          <Pill tone="local" className={styles.reasonCode}>
            {client.shortageReason}
          </Pill> {reasonLabel(client.shortageReason)}
        </p>
      )}

      {isOpen && <ClientSources id={detailsId} client={client} allocations={allocations} />}
    </li>
  );
}
