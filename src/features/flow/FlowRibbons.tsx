"use client";

/** The bands of the Crop flow. Each is real allocated tonnes from one segment to one client (or the local market). */
import type { MouseEvent } from "react";
import { useHighlight } from "@/features/entities/HighlightContext";
import { cn } from "@/lib/utils";
import { LOCAL_DESTINATION, ribbonMatchesSelection, type Ribbon } from "./flowLayout";
import { LOCAL_PATTERN_ID, SEGMENT_FILL } from "./segmentFill";

interface FlowRibbonsProps {
  ribbons: Ribbon[];
  hoveredKey: string | null;
  onHover: (ribbon: Ribbon | null, event?: MouseEvent) => void;
}

export function FlowRibbons({ ribbons, hoveredKey, onHover }: FlowRibbonsProps) {
  const highlight = useHighlight();
  const hasHighlight = Boolean(highlight.clientId || highlight.farmId || highlight.segment || hoveredKey);

  return (
    <g>
      {ribbons.map((ribbon) => {
        const isLocal = ribbon.destination === LOCAL_DESTINATION;
        const isMatch = ribbon.key === hoveredKey || ribbonMatchesSelection(ribbon, highlight);
        return (
          <path
            key={ribbon.key}
            d={ribbon.path}
            fill={isLocal ? `url(#${LOCAL_PATTERN_ID})` : undefined}
            className={cn(
              "cursor-default transition-opacity duration-200",
              isLocal ? "stroke-local" : SEGMENT_FILL[ribbon.segment],
              opacityClass(hasHighlight, isMatch, isLocal),
            )}
            strokeWidth={isLocal ? 1 : 0}
            onMouseMove={(event) => onHover(ribbon, event)}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
    </g>
  );
}

/** Calm by default; while something is pointed at, matching ribbons pop and the rest fade away. */
function opacityClass(hasHighlight: boolean, isMatch: boolean, isLocal: boolean): string {
  if (!hasHighlight) return isLocal ? "opacity-90" : "opacity-45";
  return isMatch ? "opacity-90" : "opacity-[0.07]";
}
