"use client";

/** The Allocations filter lives in the URL (?client=C02&farm=F01&segment=A), so drawers can link straight to it. */
import { useUrlParam } from "@/hooks/useUrlParam";
import { SEGMENTS } from "@/lib/domain/constants";
import type { Selection } from "@/features/entities/selection";

export function useAllocationFilter() {
  const [clientId, setClientId] = useUrlParam("client");
  const [farmId, setFarmId] = useUrlParam("farm");
  const [segmentParam, setSegment] = useUrlParam("segment");
  const segment = SEGMENTS.find((candidate) => candidate === segmentParam);

  const filter: Selection = { clientId: clientId ?? undefined, farmId: farmId ?? undefined, segment };
  return { filter, setClientId, setFarmId, setSegment };
}
