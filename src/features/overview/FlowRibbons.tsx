"use client";

/** The curved bands of the Crop Flow. Each band is real allocated tonnes from one segment to one client (or local). */
import { classNames } from "@/components/ui/classNames";
import { useHighlight } from "@/features/trace";
import { fmtT } from "@/lib/format";
import styles from "./CropFlow.module.css";
import { LOCAL_DESTINATION, ribbonMatchesSelection, type Ribbon } from "./flowLayout";
import { SEGMENT_FILL } from "./segmentFill";

interface FlowRibbonsProps {
  ribbons: Ribbon[];
}

export function FlowRibbons({ ribbons }: FlowRibbonsProps) {
  const highlight = useHighlight();
  const hasHighlight = Boolean(highlight.clientId || highlight.farmId || highlight.segment);

  return (
    <>
      {ribbons.map((ribbon, index) => {
        const isLocal = ribbon.destination === LOCAL_DESTINATION;
        const stateClass = ribbonStateClass(hasHighlight, ribbonMatchesSelection(ribbon, highlight));
        const colorClass = isLocal ? styles.ribbonLocal : SEGMENT_FILL[ribbon.segment];
        const destinationName = isLocal ? "local market" : ribbon.destination;

        return (
          <path
            key={ribbon.key}
            d={ribbon.path}
            className={classNames(styles.ribbon, colorClass, stateClass)}
            style={{ animationDelay: `${index * 25}ms` }}
          >
            <title>{`Segment ${ribbon.segment} to ${destinationName}: ${fmtT(ribbon.tonnes)} (farms ${ribbon.farmIds.join(", ")})`}</title>
          </path>
        );
      })}
    </>
  );
}

/** With nothing hovered, ribbons look normal. While something is hovered, matching ribbons pop and the rest fade. */
function ribbonStateClass(hasHighlight: boolean, isMatch: boolean): string | undefined {
  if (!hasHighlight) return undefined;
  return isMatch ? styles.ribbonActive : styles.ribbonDimmed;
}
