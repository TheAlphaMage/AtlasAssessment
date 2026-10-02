import path from "node:path";
import { DEFAULT_WORKBOOK_FILE } from "@/lib/domain/constants";
import type { AcceptanceMode, Client, Dataset, Farm, PerSegment, Segment } from "@/lib/domain/types";
import { readWorkbook, type RawWorkbook } from "@/lib/workbook/readWorkbook";

export const BASELINE_WORKBOOK = path.resolve(__dirname, "..", DEFAULT_WORKBOOK_FILE);

/** Raw rows of the supplied workbook, deep-copied so tests can mutate them freely. */
export async function baselineRaw(): Promise<RawWorkbook> {
  const { raw, issues } = await readWorkbook(BASELINE_WORKBOOK);
  if (issues.length) throw new Error(`Baseline workbook unreadable: ${JSON.stringify(issues)}`);
  return structuredClone(raw);
}

const ZERO: PerSegment<number> = { A: 0, B: 0, C: 0, D: 0 };

/** A farm whose expected plan equals its actuals (mix derived from actuals), so only actuals matter. */
export function farm(farmId: string, actual: Partial<PerSegment<number>>): Farm {
  const actualT = { ...ZERO, ...actual };
  const total = actualT.A + actualT.B + actualT.C + actualT.D;
  const expectedMix = total
    ? { A: actualT.A / total, B: actualT.B / total, C: actualT.C / total, D: actualT.D / total }
    : { A: 1, B: 0, C: 0, D: 0 };
  return { farmId, farmName: farmId, expectedCapacityT: total, expectedMix, actualT };
}

export function client(
  clientId: string,
  acceptanceMode: AcceptanceMode,
  requestedSegment: Segment,
  demandT: number,
  pricePerT: number,
): Client {
  return { clientId, clientName: clientId, acceptanceMode, requestedSegment, demandT, pricePerT };
}

export function dataset(farms: Farm[], clients: Client[], capacityT = 500): Dataset {
  return {
    farms,
    clients,
    station: {
      stationId: "S1",
      capacityT,
      localMarketRatio: 0.1,
      referencePricePerT: { A: 1500, B: 1250, C: 1000, D: 750 },
    },
  };
}
