"use client";

/**
 * One farm × segment cell. It shows the figure picked in the toolbar (actual, plan, variance or mix).
 * A red dot marks a gap in a segment that left a client short; hover it to see which client.
 */
import { Delta } from "@/components/app/Delta";
import { NumberCell } from "@/components/app/TableCells";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtNumber, fmtPct } from "@/lib/format";
import type { FarmResult, Segment } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { cellValue, type CellMode } from "./farmRows";

interface FarmSegmentCellProps {
  farm: FarmResult;
  segment: Segment;
  mode: CellMode;
  /** Clients short because of a gap in this segment (empty when none). */
  affectedClientIds: string[];
}

export function FarmSegmentCell({ farm, segment, mode, affectedClientIds }: FarmSegmentCellProps) {
  const figures = farm.segments[segment];
  const isBelow = figures.varianceT < 0;
  const drivesShortage = isBelow && affectedClientIds.length > 0;

  return (
    <NumberCell className={cn(mode === "variance" && isBelow && "bg-danger-soft/60")}>
      <span className="inline-flex items-center justify-end gap-1.5">
        {drivesShortage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="size-1.5 rounded-full bg-danger" aria-label={`Gap contributes to ${affectedClientIds.join(", ")} shortage`} />
            </TooltipTrigger>
            <TooltipContent>Below plan in {segment}: contributes to {affectedClientIds.join(", ")} being short</TooltipContent>
          </Tooltip>
        )}
        <CellContent mode={mode} value={cellValue(farm, segment, mode)} />
      </span>
    </NumberCell>
  );
}

function CellContent({ mode, value }: { mode: CellMode; value: number }) {
  if (mode === "variance") return <Delta value={value} unit="" />;
  if (mode === "mix") return <span className="text-muted-foreground">{fmtPct(value, 0)}</span>;
  if (value === 0) return <span className="text-muted-foreground">0</span>;
  return <span>{fmtNumber(value)}</span>;
}
