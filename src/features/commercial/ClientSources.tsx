"use client";

/** The expanded part of a client row: exactly which farm and segment tonnes serve this order. */
import { Button } from "@/components/ui/Button";
import { IdLink, useTrace } from "@/features/trace";
import { fmtT } from "@/lib/format";
import type { Allocation, ClientResult } from "@/lib/domain/types";
import styles from "./ClientSources.module.css";

interface ClientSourcesProps {
  /** Matches aria-controls on the toggle button in ClientRow. */
  id: string;
  client: ClientResult;
  allocations: Allocation[];
}

export function ClientSources({ id, client, allocations }: ClientSourcesProps) {
  const { traceTo } = useTrace();

  return (
    <div id={id} className={styles.details}>
      <span className={styles.title}>Served from</span>
      {allocations.length === 0 && <span className={styles.empty}>Nothing allocated.</span>}
      {allocations.map((allocation) => (
        <span key={allocation.sequence} className={styles.source}>
          <IdLink id={allocation.farmId} /> {allocation.segment} · {fmtT(allocation.tonnes)}
        </span>
      ))}
      {allocations.length > 0 && (
        <Button variant="ghost" icon="trace" onClick={() => traceTo({ clientId: client.clientId })}>
          Trace
        </Button>
      )}
    </div>
  );
}
