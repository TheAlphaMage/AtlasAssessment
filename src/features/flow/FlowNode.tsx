"use client";

/** Makes a group of SVG shapes act like a button: hover or focus highlights its ribbons, click opens its drawer. */
import type { ReactNode } from "react";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";
import { useSetHighlight } from "@/features/entities/HighlightContext";
import type { Selection } from "@/features/entities/selection";

interface FlowNodeProps {
  id: string;
  label: string;
  selection: Selection;
  children: ReactNode;
}

export function FlowNode({ id, label, selection, children }: FlowNodeProps) {
  const { openEntity } = useEntityDrawer();
  const setHighlight = useSetHighlight();

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${label}`}
      className="cursor-pointer outline-none [&:focus-visible_rect]:stroke-ring [&:focus-visible_rect]:stroke-2 [&:hover_rect]:stroke-foreground/60"
      onClick={() => openEntity(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEntity(id);
        }
      }}
      onMouseEnter={() => setHighlight(selection)}
      onMouseLeave={() => setHighlight({})}
      onFocus={() => setHighlight(selection)}
      onBlur={() => setHighlight({})}
    >
      {children}
    </g>
  );
}
