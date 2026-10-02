"use client";

/** The three kinds of node in the Crop Flow: segments (left), clients and the local market (right). */
import { fmtT } from "@/lib/format";
import styles from "./CropFlow.module.css";
import { CLIENT_NODE_X, NODE_WIDTH, SEGMENT_NODE_X, type ClientNode, type LocalNode, type SegmentNode } from "./flowLayout";
import { SEGMENT_FILL } from "./segmentFill";
import { SvgButton } from "./SvgButton";

/** Label text starts this far to the side of a node bar. */
const LABEL_GAP = 10;

export function SegmentNodes({ nodes }: { nodes: SegmentNode[] }) {
  return (
    <>
      {nodes.map((node) => {
        const centerY = node.y + node.height / 2;
        return (
          <SvgButton key={node.segment} label={`Segment ${node.segment}`} selection={{ segment: node.segment }}>
            <rect x={SEGMENT_NODE_X} y={node.y} width={NODE_WIDTH} height={node.height} rx={3} className={SEGMENT_FILL[node.segment]} />
            <text x={SEGMENT_NODE_X - LABEL_GAP} y={centerY - 3} textAnchor="end" className={styles.nodeTitle}>
              Segment {node.segment}
            </text>
            <text x={SEGMENT_NODE_X - LABEL_GAP} y={centerY + 12} textAnchor="end" className={styles.nodeDetail}>
              {fmtT(node.actualT)} · plan {fmtT(node.expectedT)}
            </text>
          </SvgButton>
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
        const labelX = CLIENT_NODE_X + NODE_WIDTH + LABEL_GAP;
        const centerY = node.y + (node.filledHeight + node.shortageHeight) / 2;
        const rule = client.acceptanceMode === "EXACT" ? "EXACT" : "MIN";
        const shortNote = client.atRisk ? ` · ${fmtT(client.remainingT)} short` : "";

        return (
          <SvgButton key={client.clientId} label={`Client ${client.clientId}`} selection={{ clientId: client.clientId }}>
            <rect x={CLIENT_NODE_X} y={node.y} width={NODE_WIDTH} height={node.filledHeight} rx={3} className={styles.clientFilled} />
            {node.shortageHeight > 0 && (
              <rect
                x={CLIENT_NODE_X}
                y={node.y + node.filledHeight}
                width={NODE_WIDTH}
                height={node.shortageHeight}
                rx={3}
                className={styles.clientShortage}
              />
            )}
            <text x={labelX} y={centerY - 2} className={styles.nodeTitle}>
              {client.clientId} · {rule} {client.requestedSegment}
            </text>
            <text x={labelX} y={centerY + 12} className={client.atRisk ? styles.nodeDetailRisk : styles.nodeDetail}>
              {fmtT(client.allocatedT)} of {fmtT(client.demandT)}
              {shortNote}
            </text>
          </SvgButton>
        );
      })}
    </>
  );
}

export function LocalMarketNode({ node, detail }: { node: LocalNode; detail: string }) {
  const labelX = CLIENT_NODE_X + NODE_WIDTH + LABEL_GAP;
  const centerY = node.y + node.height / 2;
  return (
    <g>
      <rect x={CLIENT_NODE_X} y={node.y} width={NODE_WIDTH} height={node.height} rx={3} fill="url(#local-hatch)" className={styles.localNode} />
      <text x={labelX} y={centerY - 2} className={styles.nodeTitleLocal}>
        Local market
      </text>
      <text x={labelX} y={centerY + 12} className={styles.nodeDetailLocal}>
        {detail}
      </text>
    </g>
  );
}
