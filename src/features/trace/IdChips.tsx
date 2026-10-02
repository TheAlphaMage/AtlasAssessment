"use client";

/** A wrapping row of IdLinks, used wherever a sentence points at its evidence. */
import { IdLink } from "./IdLink";
import styles from "./IdChips.module.css";

interface IdChipsProps {
  ids: string[];
}

export function IdChips({ ids }: IdChipsProps) {
  if (ids.length === 0) return null;
  return (
    <div className={styles.chips} aria-label="Evidence">
      {ids.map((id) => (
        <IdLink key={id} id={id} />
      ))}
    </div>
  );
}
