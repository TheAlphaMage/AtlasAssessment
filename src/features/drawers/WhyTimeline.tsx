"use client";

/** The chain of causes behind a shortage, drawn as a short vertical timeline. Each step names its evidence IDs. */
import type { ReactNode } from "react";
import { Layers, Store, Tractor, UserRound, Warehouse, type LucideIcon } from "lucide-react";
import { Delta } from "@/components/app/Delta";
import { EntityLink } from "@/features/entities/EntityLink";
import { fmtT } from "@/lib/format";
import type { ChainStep } from "./buildDecisions";

const STEP_ICON: Record<ChainStep["kind"], LucideIcon> = {
  farms: Tractor,
  segment: Layers,
  station: Warehouse,
  local: Store,
  client: UserRound,
};

export function WhyTimeline({ steps }: { steps: ChainStep[] }) {
  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-border">
      {steps.map((step, index) => {
        const StepIcon = STEP_ICON[step.kind];
        return (
          <li key={index} className="relative flex gap-3">
            <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
              <StepIcon className="size-3.5" />
            </span>
            <div className="pt-1 text-sm">{describeStep(step)}</div>
          </li>
        );
      })}
    </ol>
  );
}

function describeStep(step: ChainStep): ReactNode {
  if (step.kind === "farms") {
    return (
      <>
        <p>Farms delivered less than planned</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {step.gaps.map((gap) => (
            <span key={gap.farmId} className="inline-flex items-center gap-1.5">
              <EntityLink id={gap.farmId} /> <Delta value={gap.varianceT} />
            </span>
          ))}
        </p>
      </>
    );
  }
  if (step.kind === "segment") {
    return (
      <p className="flex flex-wrap items-center gap-1.5">
        <EntityLink id={step.segment} /> arrived below plan <Delta value={step.varianceT} />
      </p>
    );
  }
  if (step.kind === "station") {
    return <p>Station full: {fmtT(step.usedT)} of {fmtT(step.capacityT)} already used by higher-priced orders</p>;
  }
  if (step.kind === "local") {
    return <p className="text-warning">{fmtT(step.tonnes)} of compatible fruit goes to the local market instead</p>;
  }
  return (
    <p className="font-medium">
      <EntityLink id={step.clientId} /> is {fmtT(step.shortT)} short
    </p>
  );
}
