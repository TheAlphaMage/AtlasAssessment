"use client";

/** A table header you can click to sort by that column. Shows an arrow for the current direction. */
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection } from "@/hooks/useSort";
import { cn } from "@/lib/utils";
import { HeadCell } from "./TableCells";

interface SortableHeadProps {
  label: ReactNode;
  isActive: boolean;
  direction: SortDirection;
  onClick: () => void;
  numeric?: boolean;
  className?: string;
}

export function SortableHead({ label, isActive, direction, onClick, numeric = false, className }: SortableHeadProps) {
  const Arrow = arrowFor(isActive, direction);
  return (
    <HeadCell numeric={numeric} className={className} aria-sort={ariaSort(isActive, direction)}>
      <button
        type="button"
        onClick={onClick}
        className={cn("inline-flex items-center gap-1 rounded-sm hover:text-foreground", numeric && "flex-row-reverse", isActive && "text-foreground")}
      >
        {label}
        <Arrow className={cn("size-3", !isActive && "opacity-40")} aria-hidden="true" />
      </button>
    </HeadCell>
  );
}

function arrowFor(isActive: boolean, direction: SortDirection) {
  if (!isActive) return ArrowUpDown;
  return direction === "asc" ? ArrowUp : ArrowDown;
}

function ariaSort(isActive: boolean, direction: SortDirection): "ascending" | "descending" | "none" {
  if (!isActive) return "none";
  return direction === "asc" ? "ascending" : "descending";
}
