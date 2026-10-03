"use client";

/** The nodes of the Crop flow: segments on the left, client orders and the local market on the right. */
import { fmtT } from "@/lib/format";
import { CLIENT_NODE_X, NODE_WIDTH, SEGMENT_NODE_X, type ClientNode, type LocalNode, type SegmentNode } from "./flowLayout";
import { FlowNode } from "./FlowNode";
import { LOCAL_PATTERN_ID, SEGMENT_FILL } from "./segmentFill";

/** Gap between a node bar and its label. */
const LABEL_GAP = 12;
const CLIENT_LABEL_X = CLIENT_NODE_X + NODE_WIDTH + LABEL_GAP;

export function SegmentNodes({ nodes }: { nodes: SegmentNode[] }) {
  return (
    <>
      {nodes.map((node) => {
        const middle = node.y + node.height / 2;
        return (
          <FlowNode key={node.segment} id={node.segment} label={`segment ${node.segment}`} selection={{ segment: node.segment }}>
            <rect x={SEGMENT_NODE_X} y={node.y} width={NODE_WIDTH} height={node.height} rx={3} className={SEGMENT_FILL[node.segment]} />
            <text x={SEGMENT_NODE_X - LABEL_GAP} y={middle - 4} textAnchor="end" className="fill-foreground text-[13px] font-medium">
              Segment {node.segment}
            </text>
            <text x={SEGMENT_NODE_X - LABEL_GAP} y={middle + 12} textAnchor="end" className="fill-muted-foreground text-[12px]">
              {fmtT(node.actualT)} · plan {fmtT(node.expectedT)}
            </text>
          </FlowNode>
        );
      })}
    </>
  );
}

export function ClientNodes({ nodes }: { nodes: ClientNode[] }) {
  return (
    <>
      {nodes.map((node) => {
        const { client } = node;
        const middle = node.y + (node.filledHeight + node.shortageHeight) / 2;
        return (
          <FlowNode key={client.clientId} id={client.clientId} label={`client ${client.clientId}`} selection={{ clientId: client.clientId }}>
            <rect x={CLIENT_NODE_X} y={node.y} width={NODE_WIDTH} height={node.filledHeight} rx={3} className="fill-foreground/80" />
            {node.shortageHeight > 0 && (
              <rect
                x={CLIENT_NODE_X + 0.75}
                y={node.y + node.filledHeight + 0.75}
                width={NODE_WIDTH - 1.5}
                height={node.shortageHeight - 1.5}
                rx={3}
                strokeDasharray="3 2"
                className="fill-warning-soft stroke-warning"
              />
            )}
            <text x={CLIENT_LABEL_X} y={middle - 3} className="fill-foreground text-[13px] font-medium">
              {client.clientId}
              <tspan className="fill-muted-foreground font-normal"> · {client.clientName}</tspan>
            </text>
            <text x={CLIENT_LABEL_X} y={middle + 12} className={client.atRisk ? "fill-warning text-[12px] font-medium" : "fill-muted-foreground text-[12px]"}>
              {fmtT(client.allocatedT)} of {fmtT(client.demandT)}
              {client.atRisk ? ` · ${fmtT(client.remainingT)} short` : ""}
            </text>
          </FlowNode>
        );
      })}
    </>
  );
}

export function LocalMarketNode({ node, value }: { node: LocalNode; value: string }) {
  const middle = node.y + node.height / 2;
  return (
    <g>
      <rect x={CLIENT_NODE_X} y={node.y} width={NODE_WIDTH} height={node.height} rx={3} fill={`url(#${LOCAL_PATTERN_ID})`} className="stroke-local" />
      <text x={CLIENT_LABEL_X} y={middle - 3} className="fill-warning text-[13px] font-medium">
        Local market
      </text>
      <text x={CLIENT_LABEL_X} y={middle + 12} className="fill-muted-foreground text-[12px]">
        {fmtT(node.tonnes)} · {value}
      </text>
    </g>
  );
}
