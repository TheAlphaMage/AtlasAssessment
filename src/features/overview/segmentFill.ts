import type { Segment } from "@/lib/domain/types";
import styles from "./CropFlow.module.css";

/** The CSS class that fills a shape with a segment's colour (used by node bars and ribbons). */
export const SEGMENT_FILL: Record<Segment, string> = {
  A: styles.fillA,
  B: styles.fillB,
  C: styles.fillC,
  D: styles.fillD,
};
