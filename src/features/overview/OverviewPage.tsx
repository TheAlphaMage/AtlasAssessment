"use client";

/** Overview: the day's situation on one screen. Details live on the other pages and in the drawers. */
import { PageHeader } from "@/components/app/PageHeader";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { AttentionCard } from "./AttentionCard";
import { CropSplitCard } from "./CropSplitCard";
import { OverviewKpis } from "./OverviewKpis";
import { StationCard } from "./StationCard";
import { SupplyVsPlanCard } from "./SupplyVsPlanCard";

export function OverviewPage() {
  const { data, result } = useReadyPlan();

  return (
    <>
      <PageHeader title="Overview" meta={`${data.summary.farmCount} farms · ${data.summary.clientCount} clients`} />
      <div className="space-y-4">
        <OverviewKpis kpis={result.kpis} />
        <div className="grid gap-4 lg:grid-cols-3">
          <AttentionCard result={result} />
          <StationCard data={data} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SupplyVsPlanCard result={result} />
          <CropSplitCard result={result} />
        </div>
      </div>
    </>
  );
}
