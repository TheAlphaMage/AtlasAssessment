"use client";

/** Clients: the ten orders with status and reason. Tabs filter by status; the tab lives in the URL (?tab=). */
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { useUrlParam } from "@/hooks/useUrlParam";
import { fmtEur, fmtT } from "@/lib/format";
import type { ClientResult } from "@/lib/domain/types";
import { ClientsTable } from "./ClientsTable";

const TABS = [
  { value: "all", label: "All", keep: () => true },
  { value: "at-risk", label: "At risk", keep: (client: ClientResult) => client.atRisk },
  { value: "complete", label: "Complete", keep: (client: ClientResult) => !client.atRisk },
] as const;

export function ClientsPage() {
  const { result } = useReadyPlan();
  const [tabParam, setTabParam] = useUrlParam("tab");
  const activeTab = TABS.find((tab) => tab.value === tabParam) ?? TABS[0];
  const visibleClients = result.clients.filter(activeTab.keep);

  return (
    <>
      <PageHeader
        title="Clients"
        info="Orders are served by export price, highest first (ties by client ID). Demand is a maximum."
        meta={`${fmtT(result.kpis.exportT)} · ${fmtEur(result.kpis.exportRevenueEur)}`}
      />
      <Tabs value={activeTab.value} onValueChange={(value) => setTabParam(value === "all" ? null : value)} className="mb-4">
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <span className="text-xs text-muted-foreground tabular-nums">{result.clients.filter(tab.keep).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Card className="py-0">
        <ClientsTable clients={visibleClients} />
      </Card>
    </>
  );
}
