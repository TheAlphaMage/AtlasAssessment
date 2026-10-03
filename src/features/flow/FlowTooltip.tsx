/** Small card that follows the pointer over a ribbon: segment → destination, tonnes and the farms involved. */
import { fmtT } from "@/lib/format";
import { LOCAL_DESTINATION, type Ribbon } from "./flowLayout";

interface FlowTooltipProps {
  ribbon: Ribbon;
  /** Pointer position inside the chart container, in pixels. */
  x: number;
  y: number;
}

/** Keeps the card a little away from the pointer so it never hides what is being pointed at. */
const OFFSET_PX = 14;

export function FlowTooltip({ ribbon, x, y }: FlowTooltipProps) {
  const destination = ribbon.destination === LOCAL_DESTINATION ? "Local market" : ribbon.destination;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 w-56 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md animate-in fade-in-0"
      style={{ left: x + OFFSET_PX, top: y + OFFSET_PX }}
    >
      <p className="font-medium">
        Segment {ribbon.segment} → {destination}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{fmtT(ribbon.tonnes)}</p>
      <p className="mt-1 text-muted-foreground">Farms: {ribbon.farmIds.join(", ")}</p>
    </div>
  );
}
