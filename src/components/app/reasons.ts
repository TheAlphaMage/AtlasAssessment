import type { ShortageReason } from "@/lib/domain/types";

/** Short human labels for the engine's shortage codes. The code itself stays visible in tooltips and drawers. */
export const REASON_LABEL: Record<ShortageReason, string> = {
  STATION_CAPACITY_REACHED: "Station full",
  INSUFFICIENT_COMPATIBLE_SEGMENT: "Segment shortage",
};
