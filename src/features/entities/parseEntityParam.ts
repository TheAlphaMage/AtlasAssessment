/** Works out what an ID in the URL (?open=C02) refers to: a client, a farm or a segment. Pure, covered by tests. */
import { SEGMENTS } from "@/lib/domain/constants";
import type { PlanResult, Segment } from "@/lib/domain/types";

export type Entity = { kind: "client"; id: string } | { kind: "farm"; id: string } | { kind: "segment"; id: Segment };

/** Returns null for a missing or unknown ID, so a stale link simply opens nothing. */
export function parseEntityParam(id: string | null, result: PlanResult): Entity | null {
  if (!id) return null;
  if (result.clients.some((client) => client.clientId === id)) return { kind: "client", id };
  if (result.farms.some((farm) => farm.farmId === id)) return { kind: "farm", id };
  const segment = SEGMENTS.find((candidate) => candidate === id);
  if (segment) return { kind: "segment", id: segment };
  return null;
}
