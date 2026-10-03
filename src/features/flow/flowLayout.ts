/**
 * Layout math for the Crop Flow diagram. Pure functions only: tonnes in, pixel positions out.
 * The drawing component (CropFlowSvg) never calculates anything; it just paints what this file returns.
 *
 * Worked example: with a scale of 0.5 px per tonne, an allocation of 40 t becomes a ribbon 20 px thick,
 * and a client that asked for 50 t gets a node 25 px tall (20 px filled, 5 px dashed for the missing 10 t).
 */
import type { Selection } from "@/features/entities/selection";
import type { ClientResult, PlanResult, Segment } from "@/lib/domain/types";

/** The parts of a plan the diagram needs. */
export type FlowInput = Pick<PlanResult, "segments" | "clients" | "allocations" | "residuals">;

// Canvas geometry, in SVG units (the SVG scales to fit its container).
export const FLOW_WIDTH = 1000;
const HEADING_SPACE = 56; // room above the nodes for the column headings
const STACK_HEIGHT = 440; // height available to the tallest column of nodes
const BOTTOM_SPACE = 12;
const NODE_GAP = 10;
export const NODE_WIDTH = 14;
export const SEGMENT_NODE_X = 140;
export const CLIENT_NODE_X = 730;

/** Ribbons going to the local market use this in place of a client ID. */
export const LOCAL_DESTINATION = "LOCAL";

export interface SegmentNode {
  segment: Segment;
  y: number;
  height: number;
  actualT: number;
  expectedT: number;
}

export interface ClientNode {
  client: ClientResult;
  y: number;
  /** Height of the part that was allocated (solid). */
  filledHeight: number;
  /** Height of the part that was asked for but not delivered (dashed). */
  shortageHeight: number;
}

export interface LocalNode {
  y: number;
  height: number;
  tonnes: number;
}

export interface Ribbon {
  key: string;
  segment: Segment;
  /** Client ID, or LOCAL_DESTINATION for fruit that stays in the local market. */
  destination: string;
  tonnes: number;
  farmIds: string[];
  path: string;
}

export interface FlowLayout {
  height: number;
  scale: number;
  segmentNodes: SegmentNode[];
  clientNodes: ClientNode[];
  localNode: LocalNode | null;
  ribbons: Ribbon[];
}

interface FlowTotals {
  tonnes: number;
  farmIds: Set<string>;
}

export function computeFlowLayout(input: FlowInput): FlowLayout {
  const { segments, clients, allocations, residuals } = input;
  const localTonnes = sum(residuals.map((residual) => residual.tonnes));

  // 1. Pick one scale (pixels per tonne) so that the taller of the two columns fits exactly.
  const leftTonnes = sum(segments.map((segment) => segment.actualT));
  const rightTonnes = sum(clients.map((client) => client.demandT)) + localTonnes;
  const rightNodeCount = clients.length + (localTonnes > 0 ? 1 : 0);
  const scale = Math.min(
    pixelsPerTonne(leftTonnes, segments.length),
    pixelsPerTonne(rightTonnes, rightNodeCount),
  );

  // 2. Place the segment nodes on the left, centred vertically.
  const leftStackHeight = leftTonnes * scale + (segments.length - 1) * NODE_GAP;
  let leftCursor = HEADING_SPACE + (STACK_HEIGHT - leftStackHeight) / 2;
  const segmentNodes = segments.map((summary): SegmentNode => {
    const node = {
      segment: summary.segment,
      y: leftCursor,
      height: summary.actualT * scale,
      actualT: summary.actualT,
      expectedT: summary.expectedT,
    };
    leftCursor += node.height + NODE_GAP;
    return node;
  });

  // 3. Place the client nodes (and the local-market node) on the right.
  const rightStackHeight = rightTonnes * scale + (rightNodeCount - 1) * NODE_GAP;
  let rightCursor = HEADING_SPACE + (STACK_HEIGHT - rightStackHeight) / 2;
  const clientNodes = clients.map((client): ClientNode => {
    const node = {
      client,
      y: rightCursor,
      filledHeight: client.allocatedT * scale,
      shortageHeight: client.remainingT * scale,
    };
    rightCursor += (client.allocatedT + client.remainingT) * scale + NODE_GAP;
    return node;
  });
  const localNode: LocalNode | null =
    localTonnes > 0 ? { y: rightCursor, height: localTonnes * scale, tonnes: localTonnes } : null;

  // 4. Add up the tonnes (and farms) for every segment -> destination pair.
  const totals = new Map<string, FlowTotals>();
  for (const allocation of allocations) {
    addToTotals(totals, allocation.segment, allocation.clientId, allocation.tonnes, allocation.farmId);
  }
  for (const residual of residuals) {
    addToTotals(totals, residual.segment, LOCAL_DESTINATION, residual.tonnes, residual.farmId);
  }

  // 5. Draw one ribbon per pair. Ribbons leave a segment in client order and
  //    arrive at a client in segment order, which keeps crossings to a minimum.
  const nextSourceY = new Map(segmentNodes.map((node) => [node.segment, node.y]));
  const nextTargetY = new Map<string, number>(clientNodes.map((node) => [node.client.clientId, node.y]));
  if (localNode) nextTargetY.set(LOCAL_DESTINATION, localNode.y);

  const destinations = [...clientNodes.map((node) => node.client.clientId), ...(localNode ? [LOCAL_DESTINATION] : [])];
  const ribbons: Ribbon[] = [];

  for (const segmentNode of segmentNodes) {
    for (const destination of destinations) {
      const flow = totals.get(flowKey(segmentNode.segment, destination));
      if (!flow) continue;

      const thickness = flow.tonnes * scale;
      const sourceY = nextSourceY.get(segmentNode.segment) ?? 0;
      const targetY = nextTargetY.get(destination) ?? 0;

      ribbons.push({
        key: flowKey(segmentNode.segment, destination),
        segment: segmentNode.segment,
        destination,
        tonnes: flow.tonnes,
        farmIds: [...flow.farmIds].sort(),
        path: ribbonPath(SEGMENT_NODE_X + NODE_WIDTH, sourceY, CLIENT_NODE_X, targetY, thickness),
      });

      nextSourceY.set(segmentNode.segment, sourceY + thickness);
      nextTargetY.set(destination, targetY + thickness);
    }
  }

  return {
    height: HEADING_SPACE + STACK_HEIGHT + BOTTOM_SPACE,
    scale,
    segmentNodes,
    clientNodes,
    localNode,
    ribbons,
  };
}

/** True when every field set in `selection` matches the ribbon. An empty selection matches nothing. */
export function ribbonMatchesSelection(ribbon: Ribbon, selection: Selection): boolean {
  if (!selection.clientId && !selection.farmId && !selection.segment) return false;
  if (selection.clientId && selection.clientId !== ribbon.destination) return false;
  if (selection.segment && selection.segment !== ribbon.segment) return false;
  if (selection.farmId && !ribbon.farmIds.includes(selection.farmId)) return false;
  return true;
}

/** SVG path of a curved band: top edge curves from (x0, y0) to (x1, y1), then the bottom edge returns. */
export function ribbonPath(x0: number, y0: number, x1: number, y1: number, thickness: number): string {
  const middleX = (x0 + x1) / 2;
  const topLeft = `${round(x0)} ${round(y0)}`;
  const topRight = `${round(x1)} ${round(y1)}`;
  const bottomRight = `${round(x1)} ${round(y1 + thickness)}`;
  const bottomLeft = `${round(x0)} ${round(y0 + thickness)}`;

  return [
    `M ${topLeft}`,
    `C ${round(middleX)} ${round(y0)}, ${round(middleX)} ${round(y1)}, ${topRight}`,
    `L ${bottomRight}`,
    `C ${round(middleX)} ${round(y1 + thickness)}, ${round(middleX)} ${round(y0 + thickness)}, ${bottomLeft}`,
    "Z",
  ].join(" ");
}

function pixelsPerTonne(tonnes: number, nodeCount: number): number {
  if (tonnes <= 0) return 1;
  const heightForGaps = Math.max(0, nodeCount - 1) * NODE_GAP;
  return (STACK_HEIGHT - heightForGaps) / tonnes;
}

function flowKey(segment: Segment, destination: string): string {
  return `${segment}|${destination}`;
}

function addToTotals(totals: Map<string, FlowTotals>, segment: Segment, destination: string, tonnes: number, farmId: string) {
  const key = flowKey(segment, destination);
  const entry = totals.get(key) ?? { tonnes: 0, farmIds: new Set<string>() };
  entry.tonnes += tonnes;
  entry.farmIds.add(farmId);
  totals.set(key, entry);
}

function sum(numbers: number[]): number {
  return numbers.reduce((total, value) => total + value, 0);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
