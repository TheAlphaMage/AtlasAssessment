"use client";

/**
 * Draws the Crop Flow diagram from a ready-made layout. No maths here: positions come from flowLayout.ts.
 * Left: quality segments. Middle: ribbons of real allocated tonnes. Right: client orders and the local market.
 */
import styles from "./CropFlow.module.css";
import { ClientNodes, LocalMarketNode, SegmentNodes } from "./FlowNodes";
import { FlowRibbons } from "./FlowRibbons";
import { CLIENT_NODE_X, FLOW_WIDTH, NODE_WIDTH, SEGMENT_NODE_X, type FlowLayout } from "./flowLayout";

export interface FlowHeadings {
  crop: string;
  station: string;
  clients: string;
  localDetail: string;
}

interface CropFlowSvgProps {
  layout: FlowLayout;
  headings: FlowHeadings;
}

const HEADING_Y = 20;

export function CropFlowSvg({ layout, headings }: CropFlowSvgProps) {
  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${FLOW_WIDTH} ${layout.height}`}
      role="group"
      aria-label="Crop flow: farm segments to clients and the local market. Use the tables for exact figures."
    >
      <defs>
        <pattern id="local-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" className={styles.hatchBase} />
          <line x1="0" y1="0" x2="0" y2="7" className={styles.hatchLine} strokeWidth="3" />
        </pattern>
      </defs>

      <text x={SEGMENT_NODE_X + NODE_WIDTH} y={HEADING_Y} textAnchor="end" className={styles.heading}>
        {headings.crop}
      </text>
      <text x={FLOW_WIDTH / 2} y={HEADING_Y} textAnchor="middle" className={styles.heading}>
        {headings.station}
      </text>
      <text x={CLIENT_NODE_X} y={HEADING_Y} className={styles.heading}>
        {headings.clients}
      </text>

      {/* Ribbons first, so the nodes are drawn on top of their ends. */}
      <FlowRibbons ribbons={layout.ribbons} />
      <SegmentNodes nodes={layout.segmentNodes} />
      <ClientNodes nodes={layout.clientNodes} />
      {layout.localNode && <LocalMarketNode node={layout.localNode} detail={headings.localDetail} />}
    </svg>
  );
}
