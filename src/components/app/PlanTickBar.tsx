/**
 * A thin horizontal bar: the coloured fill is the actual value, the dark tick marks the plan.
 * Both are scaled against `max`, so several bars side by side are comparable.
 */
import { cn } from "@/lib/utils";

interface PlanTickBarProps {
  actual: number;
  plan: number;
  max: number;
  /** Tailwind background class for the fill, e.g. "bg-seg-a". */
  fillClass: string;
}

function percentOf(value: number, max: number): string {
  return `${Math.min(100, (value / max) * 100)}%`;
}

export function PlanTickBar({ actual, plan, max, fillClass }: PlanTickBarProps) {
  return (
    <div className="relative h-2 rounded-full bg-muted" aria-hidden="true">
      <div
        className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out", fillClass)}
        style={{ width: percentOf(actual, max) }}
      />
      <div className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground/70" style={{ left: percentOf(plan, max) }} />
    </div>
  );
}
