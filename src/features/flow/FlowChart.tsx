"use client";

/** The Crop flow SVG plus its hover card. Positions come from flowLayout.ts; this file only draws. */
import { useMemo, useRef, useState, type MouseEvent } from "react";
import { fmtEur, fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";
import { CLIENT_NODE_X, FLOW_WIDTH, NODE_WIDTH, SEGMENT_NODE_X, computeFlowLayout, type Ribbon } from "./flowLayout";
import { ClientNodes, LocalMarketNode, SegmentNodes } from "./FlowNodes";
import { FlowRibbons } from "./FlowRibbons";
import { FlowTooltip } from "./FlowTooltip";
import { LOCAL_PATTERN_ID } from "./segmentFill";

const HEADING_Y = 20;

interface HoverState {
  ribbon: Ribbon;
  x: number;
  y: number;
}

export function FlowChart({ result }: { result: PlanResult }) {
  const layout = useMemo(() => computeFlowLayout(result), [result]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const { kpis } = result;

  function onRibbonHover(ribbon: Ribbon | null, event?: MouseEvent) {
    const box = containerRef.current?.getBoundingClientRect();
    if (!ribbon || !event || !box) {
      setHover(null);
      return;
    }
    setHover({ ribbon, x: event.clientX - box.left, y: event.clientY - box.top });
  }

  return (
    <div ref={containerRef} className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${FLOW_WIDTH} ${layout.height}`} className="block h-auto w-full min-w-[760px]" role="group" aria-label="Crop flow from quality segments to client orders and the local market">
        <defs>
          <pattern id={LOCAL_PATTERN_ID} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="fill-warning-soft" />
            <line x1="0" y1="0" x2="0" y2="6" strokeWidth="3" className="stroke-local/60" />
          </pattern>
        </defs>
        <g className="fill-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          <text x={SEGMENT_NODE_X + NODE_WIDTH} y={HEADING_Y} textAnchor="end">Received · {fmtT(kpis.actualT)}</text>
          <text x={FLOW_WIDTH / 2} y={HEADING_Y} textAnchor="middle">
            Station · {fmtT(kpis.exportT)} of {fmtT(kpis.stationCapacityT)}
          </text>
          <text x={CLIENT_NODE_X} y={HEADING_Y}>Orders · in serving order</text>
        </g>
        <FlowRibbons ribbons={layout.ribbons} hoveredKey={hover?.ribbon.key ?? null} onHover={onRibbonHover} />
        <SegmentNodes nodes={layout.segmentNodes} />
        <ClientNodes nodes={layout.clientNodes} />
        {layout.localNode && <LocalMarketNode node={layout.localNode} value={fmtEur(kpis.localValueEur)} />}
      </svg>
      {hover && <FlowTooltip ribbon={hover.ribbon} x={hover.x} y={hover.y} />}
    </div>
  );
}
