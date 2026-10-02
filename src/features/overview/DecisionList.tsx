"use client";

/**
 * "Decisions for the committee": every client at risk, why, and a chain from the cause to the shortage.
 * Below it, quieter notes about gaps that hurt nobody today.
 */
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IdChips, IdLink, useTrace } from "@/features/trace";
import { fmtEur, fmtT, reasonLabel } from "@/lib/format";
import type { ClientResult, PlanResult } from "@/lib/domain/types";
import { CauseChain } from "./CauseChain";
import styles from "./DecisionList.module.css";
import { buildDecisions, type Decision } from "./buildDecisions";

interface DecisionListProps {
  result: PlanResult;
}

export function DecisionList({ result }: DecisionListProps) {
  const decisions = buildDecisions(result);
  const quietNotes = result.exceptions.filter((exception) => exception.kind === "SEGMENT_BELOW_PLAN" && exception.severity === "info");

  return (
    <Card label="Decisions for the committee">
      <SectionHeader
        title="Decisions for the committee"
        hint="Each client at risk, with the chain of causes that led to the shortage."
      />
      <div className={styles.body}>
        {decisions.length === 0 && <p className={styles.allGood}>Every client order is complete. Nothing to decide.</p>}

        {decisions.map((decision) => (
          <DecisionRow key={decision.clientId} decision={decision} client={findClient(result, decision.clientId)} />
        ))}

        {quietNotes.length > 0 && (
          <div className={styles.notes}>
            <h3 className={styles.notesTitle}>Worth knowing, no client affected today</h3>
            <ul className={styles.noteList}>
              {quietNotes.map((note) => (
                <li key={note.title}>
                  <span>{note.title}</span>
                  <IdChips ids={note.evidenceIds.slice(0, 4)} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function findClient(result: PlanResult, clientId: string): ClientResult {
  return result.clients.find((client) => client.clientId === clientId)!;
}

function DecisionRow({ decision, client }: { decision: Decision; client: ClientResult }) {
  const { traceTo } = useTrace();

  return (
    <article className={styles.row}>
      <header className={styles.head}>
        <IdLink id={client.clientId} />
        <strong>{client.clientName}</strong>
        <Pill tone="local">{fmtT(decision.shortT)} short</Pill>
        <span className={styles.orderInfo}>
          {client.acceptanceMode} {client.requestedSegment} · priority #{client.priorityRank} · {fmtEur(client.pricePerT)}/t
        </span>
      </header>
      <p className={styles.reason}>{reasonLabel(client.shortageReason)}</p>
      <CauseChain steps={decision.steps} />
      <div>
        <Button variant="ghost" icon="trace" onClick={() => traceTo({ clientId: client.clientId })}>
          Trace {client.clientId} allocations
        </Button>
      </div>
    </article>
  );
}
