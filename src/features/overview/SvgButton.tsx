"use client";

import type { ReactNode } from "react";
import { useTrace, type Selection } from "@/features/trace";
import styles from "./CropFlow.module.css";

interface SvgButtonProps {
  label: string;
  selection: Selection;
  children: ReactNode;
}

/** Makes a group of SVG shapes behave like a button: hover/focus highlights, Enter/Space/click traces. */
export function SvgButton({ label, selection, children }: SvgButtonProps) {
  const { traceTo, setHighlight } = useTrace();
  return (
    <g
      className={styles.node}
      role="button"
      tabIndex={0}
      aria-label={`Show allocations for ${label}`}
      onClick={() => traceTo(selection)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          traceTo(selection);
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
