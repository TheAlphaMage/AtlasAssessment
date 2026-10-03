/** A signed plan-versus-actual difference with an arrow, so meaning never relies on colour alone. */
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Differences smaller than this are treated as "on plan". */
const ON_PLAN_TOLERANCE = 0.005;

export function isOnPlan(value: number): boolean {
  return Math.abs(value) < ON_PLAN_TOLERANCE;
}

interface DeltaProps {
  value: number;
  unit?: string;
  className?: string;
}

export function Delta({ value, unit = "t", className }: DeltaProps) {
  if (isOnPlan(value)) {
    return <span className={cn("text-xs text-muted-foreground", className)}>on plan</span>;
  }

  const isBelow = value < 0;
  const Arrow = isBelow ? ArrowDownRight : ArrowUpRight;
  const sign = isBelow ? "" : "+";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        isBelow ? "text-danger" : "text-success",
        className,
      )}
      aria-label={`${fmtNumber(Math.abs(value))} ${unit} ${isBelow ? "below" : "above"} plan`}
    >
      <Arrow className="size-3" aria-hidden="true" />
      {sign}
      {fmtNumber(value)} {unit}
    </span>
  );
}
