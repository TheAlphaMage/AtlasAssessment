/** A coloured square with the segment letter. The same colour is used for that segment everywhere. */
import type { Segment } from "@/lib/domain/types";
import styles from "./SegmentTag.module.css";
import { classNames } from "./classNames";

const SEGMENT_CLASS: Record<Segment, string> = {
  A: styles.segmentA,
  B: styles.segmentB,
  C: styles.segmentC,
  D: styles.segmentD,
};

interface SegmentTagProps {
  segment: Segment;
  className?: string;
}

export function SegmentTag({ segment, className }: SegmentTagProps) {
  return (
    <span className={classNames(styles.tag, SEGMENT_CLASS[segment], className)} title={`Segment ${segment}`}>
      {segment}
    </span>
  );
}
