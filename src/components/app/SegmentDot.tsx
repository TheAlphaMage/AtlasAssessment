/** A small coloured dot for a quality segment, followed by its letter. A is darkest (best), D lightest. */
import type { Segment } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export const SEGMENT_BG: Record<Segment, string> = {
  A: "bg-seg-a",
  B: "bg-seg-b",
  C: "bg-seg-c",
  D: "bg-seg-d",
};

interface SegmentDotProps {
  segment: Segment;
  /** Show "Segment A" instead of just "A". */
  long?: boolean;
  className?: string;
}

export function SegmentDot({ segment, long = false, className }: SegmentDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium", className)}>
      <span className={cn("size-2 rounded-full ring-1 ring-black/10 ring-inset dark:ring-white/10", SEGMENT_BG[segment])} aria-hidden="true" />
      {long ? `Segment ${segment}` : segment}
    </span>
  );
}
