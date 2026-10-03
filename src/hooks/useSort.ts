"use client";

/** Click-to-sort for tables: remembers which column is sorted and in which direction. */
import { useState } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState<Key extends string> {
  key: Key;
  direction: SortDirection;
}

/**
 * Returns a sorted copy of `rows`. `valueOf` reads the value to sort by from a row.
 * Ties keep their original order, so sorting is predictable.
 */
export function sortRows<Row>(rows: Row[], valueOf: (row: Row) => number | string, direction: SortDirection): Row[] {
  const factor = direction === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const valueA = valueOf(a.row);
      const valueB = valueOf(b.row);
      if (valueA < valueB) return -1 * factor;
      if (valueA > valueB) return 1 * factor;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

/** Clicking the sorted column flips its direction; clicking another column sorts it, numbers biggest first. */
export function useSort<Key extends string>(initial: SortState<Key>) {
  const [sort, setSort] = useState<SortState<Key>>(initial);

  function toggle(key: Key, firstDirection: SortDirection = "desc") {
    if (sort.key === key) setSort({ key, direction: sort.direction === "asc" ? "desc" : "asc" });
    else setSort({ key, direction: firstDirection });
  }

  return { sort, toggle };
}
