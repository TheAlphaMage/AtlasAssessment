"use client";

/** The content area for the selected view. Marked up as the "tabpanel" that ViewNav controls. */
import type { PlanResult } from "@/lib/domain/types";
import type { Selection } from "@/features/trace";
import { AllocationsView } from "@/features/allocations";
import { AssistantPanel } from "@/features/assistant";
import { CommercialView } from "@/features/commercial";
import { Overview } from "@/features/overview";
import { ProductionView } from "@/features/production";
import styles from "./ViewPanel.module.css";
import type { ViewId } from "./views";

interface ViewPanelProps {
  view: ViewId;
  result: PlanResult;
  allocationFilter: Selection;
  onAllocationFilterChange: (filter: Selection) => void;
  onOpenView: (view: ViewId) => void;
}

export function ViewPanel({ view, result, allocationFilter, onAllocationFilterChange, onOpenView }: ViewPanelProps) {
  return (
    <section role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`} className={styles.panel} tabIndex={-1}>
      {view === "overview" && <Overview result={result} onOpenView={onOpenView} />}
      {view === "production" && <ProductionView result={result} />}
      {view === "commercial" && <CommercialView result={result} />}
      {view === "allocations" && (
        <AllocationsView result={result} filter={allocationFilter} onFilterChange={onAllocationFilterChange} />
      )}
      {view === "assistant" && <AssistantPanel result={result} />}
    </section>
  );
}
