"use client";

/**
 * Commercial view: the ten client orders in the order they are served (highest price first).
 * Each row shows delivered versus asked, revenue, status and, when short, the reason.
 */
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Segmented } from "@/components/ui/Segmented";
import { fmtEur, fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";
import { ClientRow } from "./ClientRow";
import styles from "./CommercialView.module.css";

type ClientFilter = "all" | "atRisk";

interface CommercialViewProps {
  result: PlanResult;
}

export function CommercialView({ result }: CommercialViewProps) {
  const [filter, setFilter] = useState<ClientFilter>("all");
  const { kpis } = result;

  const visibleClients = filter === "atRisk" ? result.clients.filter((client) => client.atRisk) : result.clients;

  return (
    <Card label="Commercial: client service">
      <SectionHeader
        title="Commercial: client service in processing order"
        hint="Orders are served by export price, highest first (ties by client ID). Demand is a maximum, and each order gets the closest acceptable quality first."
        action={
          <Segmented
            label="Show clients"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All ${kpis.clientCount}` },
              { value: "atRisk", label: `At risk ${kpis.atRiskCount}` },
            ]}
          />
        }
      />

      <div className={styles.scroller}>
      <div className={styles.columns} aria-hidden="true">
        <span>Client</span>
        <span>Rule</span>
        <span className={styles.right}>Price / t</span>
        <span>Delivered</span>
        <span className={styles.right}>Remaining</span>
        <span className={styles.right}>Revenue</span>
        <span>Status</span>
        <span />
      </div>

      <ol className={styles.list}>
        {visibleClients.map((client) => (
          <ClientRow
            key={client.clientId}
            client={client}
            allocations={result.allocations.filter((allocation) => allocation.clientId === client.clientId)}
          />
        ))}
      </ol>
      </div>

      <footer className={styles.totals}>
        <span>
          Total exported <strong>{fmtT(kpis.exportT)}</strong>
        </span>
        <span>
          Export revenue <strong>{fmtEur(kpis.exportRevenueEur)}</strong>
        </span>
        <span>
          <strong>
            {kpis.atRiskCount} of {kpis.clientCount}
          </strong>{" "}
          clients at risk
        </span>
      </footer>
    </Card>
  );
}
