"use client";

/** A client, farm or segment ID shown as a quiet link. Click opens its detail drawer; hover highlights it in charts. */
import type { MouseEvent } from "react";
import { SegmentDot } from "@/components/app/SegmentDot";
import { SEGMENTS } from "@/lib/domain/constants";
import type { Segment } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { useSetHighlight } from "./HighlightContext";
import type { Selection } from "./selection";
import { useEntityDrawer } from "./useEntityDrawer";

interface EntityLinkProps {
  id: string;
  className?: string;
}

export function EntityLink({ id, className }: EntityLinkProps) {
  const { openEntity } = useEntityDrawer();
  const setHighlight = useSetHighlight();
  const segment = SEGMENTS.find((candidate) => candidate === id);
  const selection = selectionFor(id, segment);

  function onClick(event: MouseEvent) {
    // Links often sit inside clickable table rows; only this link should react.
    event.stopPropagation();
    openEntity(id);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHighlight(selection)}
      onMouseLeave={() => setHighlight({})}
      onFocus={() => setHighlight(selection)}
      onBlur={() => setHighlight({})}
      className={cn(
        "rounded-sm font-medium tabular-nums underline-offset-4 decoration-muted-foreground/40 hover:underline focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
      aria-label={`Open details for ${segment ? `segment ${id}` : id}`}
    >
      {segment ? <SegmentDot segment={segment} /> : id}
    </button>
  );
}

/** Farm IDs start with F, client IDs with C, segments are single letters. */
function selectionFor(id: string, segment: Segment | undefined): Selection {
  if (segment) return { segment };
  if (id.startsWith("F")) return { farmId: id };
  return { clientId: id };
}
