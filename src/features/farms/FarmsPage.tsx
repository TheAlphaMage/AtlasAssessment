"use client";

/** Farms: plan versus actual for all 20 farms. Search, filter, switch what the cells show, sort any column. */
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { sortRows, useSort } from "@/hooks/useSort";
import { fmtT } from "@/lib/format";
import { FarmsTable } from "./FarmsTable";
import { FarmsToolbar } from "./FarmsToolbar";
import { filterFarms, sortValue, type CellMode, type FarmFilter, type FarmSortKey } from "./farmRows";

export function FarmsPage() {
  const { result } = useReadyPlan();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FarmFilter>("all");
  const [mode, setMode] = useState<CellMode>("actual");
  const { sort, toggle } = useSort<FarmSortKey>({ key: "farm", direction: "asc" });

  const visible = filterFarms(result.farms, filter, search);
  const farms = sortRows(visible, (farm) => sortValue(farm, sort.key, mode), sort.direction);

  return (
    <>
      <PageHeader
        title="Farms"
        info="Figures in tonnes. Plan = expected daily capacity × expected mix. Variance = actual − plan. Only actual tonnes are allocated."
        meta={`${fmtT(result.kpis.actualT)} of ${fmtT(result.kpis.expectedT)} planned`}
      />
      <Card className="gap-0 py-0">
        <FarmsToolbar search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} mode={mode} onMode={setMode} />
        <FarmsTable farms={farms} result={result} mode={mode} sort={sort} onSort={toggle} />
      </Card>
    </>
  );
}
