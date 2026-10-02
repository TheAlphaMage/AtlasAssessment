"use client";

/**
 * The low-value local-market residual, made impossible to miss: the amount, its value, why it happened,
 * and which farms and segments it came from.
 */
import { ResidualTable } from "@/components/ResidualTable";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cssVariables } from "@/components/ui/cssVariables";
import { IdLink } from "@/features/trace";
import { fmtEur, fmtPct, fmtT } from "@/lib/format";
import type { Kpis, PlanResult } from "@/lib/domain/types";
import styles from "./LocalResidual.module.css";

interface LocalResidualProps {
  result: PlanResult;
}

export function LocalResidual({ result }: LocalResidualProps) {
  const { kpis, residuals } = result;
  const waitingClients = result.clients.filter((client) => client.shortageReason === "STATION_CAPACITY_REACHED");

  return (
    <Card tone="local" label="Local market residual">
      <SectionHeader
        title="Local market residual"
        hint={`Every tonne not exported sells locally at ${fmtPct(kpis.localMarketRatio, 0)} of its segment reference export price.`}
      />
      <div className={styles.body}>
        <div className={styles.summary}>
          <p className={styles.amount}>{fmtT(kpis.localT)}</p>
          <p className={styles.value}>≈ {fmtEur(kpis.localValueEur)} local value</p>
          <p className={styles.compare}>
            At reference export prices the same fruit would be worth {fmtEur(kpis.localReferenceExportValueEur)}.
          </p>
          <p className={styles.why}>{explainResidual(kpis)}</p>
          {waitingClients.length > 0 && (
            <p className={styles.why}>
              Orders still waiting for capacity:{" "}
              {waitingClients.map((client) => (
                <span key={client.clientId} className={styles.waiting}>
                  <IdLink id={client.clientId} /> {fmtT(client.remainingT)} short
                </span>
              ))}
            </p>
          )}
        </div>

        <div className={styles.detail}>
          {residuals.length === 0 ? (
            <p className={styles.none}>No residual. Everything received is exported.</p>
          ) : (
            <>
              <ul className={styles.pieces} aria-label="Where the local tonnes come from">
                {residuals.map((residual) => (
                  <li
                    key={`${residual.farmId}-${residual.segment}`}
                    className={styles.piece}
                    style={cssVariables({ "--share": residual.tonnes })}
                  >
                    <span className={styles.pieceBar} />
                    <span className={styles.pieceLabel}>
                      <IdLink id={residual.farmId} /> {residual.segment} · {fmtT(residual.tonnes)}
                    </span>
                  </li>
                ))}
              </ul>
              <ResidualTable
                residuals={residuals}
                total={{ tonnes: kpis.localT, valueEur: kpis.localValueEur }}
                emptyMessage="No residual. Everything received is exported."
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function explainResidual(kpis: Kpis): string {
  if (kpis.localT === 0) return "All actual receipts are exported today.";
  if (kpis.stationFull) {
    return `Why: the station's ${fmtT(kpis.stationCapacityT)} export capacity is fully used while ${fmtT(kpis.actualT)} arrived.`;
  }
  return "Why: no remaining client order accepts this fruit.";
}
