"use client";

/**
 * Overview = the business decision at a glance. Top to bottom:
 * verdict, key figures, crop flow, decisions, plan-versus-actual by segment, local residual.
 */
import type { ViewId } from "@/features/planner/views";
import type { PlanResult } from "@/lib/domain/types";
import { CropFlow } from "./CropFlow";
import { DecisionList } from "./DecisionList";
import { KeyFigures } from "./KeyFigures";
import { LocalResidual } from "./LocalResidual";
import { SegmentBars } from "./SegmentBars";
import { VerdictHero } from "./VerdictHero";

interface OverviewProps {
  result: PlanResult;
  onOpenView: (view: ViewId) => void;
}

export function Overview({ result, onOpenView }: OverviewProps) {
  return (
    <>
      <VerdictHero result={result} onOpenView={onOpenView} />
      <KeyFigures kpis={result.kpis} />
      <CropFlow result={result} />
      <DecisionList result={result} />
      <SegmentBars result={result} />
      <LocalResidual result={result} />
    </>
  );
}
