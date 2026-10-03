import type { Segment } from "@/lib/domain/types";

/** Tailwind SVG fill class per segment (same colours as the dots elsewhere in the app). */
export const SEGMENT_FILL: Record<Segment, string> = {
  A: "fill-seg-a",
  B: "fill-seg-b",
  C: "fill-seg-c",
  D: "fill-seg-d",
};

/** The id of the SVG pattern used for local-market stripes. */
export const LOCAL_PATTERN_ID = "flow-local-stripes";
