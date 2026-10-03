import { describe, expect, it } from "vitest";
import { buildBanner } from "@/features/banner/buildBanner";
import { buildDecision } from "@/features/drawers/buildDecisions";
import { parseEntityParam } from "@/features/entities/parseEntityParam";
import type { PlanResult } from "@/lib/domain/types";
import { plan } from "@/lib/planning/engine";
import { loadDataset } from "@/lib/workbook/loadDataset";
import { BASELINE_WORKBOOK } from "./fixtures";

async function baseline(): Promise<PlanResult> {
  const { dataset } = await loadDataset(BASELINE_WORKBOOK);
  return plan(dataset!);
}

const client = (result: PlanResult, id: string) => result.clients.find((candidate) => candidate.clientId === id)!;

describe("global banner", () => {
  it("warns about the full station, the local residual and the short orders", async () => {
    const banner = buildBanner(await baseline());
    expect(banner).toMatchObject({ title: "Station full", actionHref: "/clients?tab=at-risk" });
    expect(banner!.description).toBe("60 t to local market (EUR 4,500) · 3 orders short");
  });

  it("shows nothing when every order is complete and nothing goes local", async () => {
    const result = await baseline();
    const calm: PlanResult = { ...result, kpis: { ...result.kpis, localT: 0, atRiskCount: 0 } };
    expect(buildBanner(calm)).toBeNull();
  });
});

describe("drawer URL parameter", () => {
  it("recognises clients, farms and segments, and ignores unknown or missing IDs", async () => {
    const result = await baseline();
    expect(parseEntityParam("C02", result)).toEqual({ kind: "client", id: "C02" });
    expect(parseEntityParam("F20", result)).toEqual({ kind: "farm", id: "F20" });
    expect(parseEntityParam("A", result)).toEqual({ kind: "segment", id: "A" });
    expect(parseEntityParam("C99", result)).toBeNull();
    expect(parseEntityParam(null, result)).toBeNull();
  });
});

describe("why a client is short", () => {
  it("traces C02 from below-plan farms through segment A to the shortage", async () => {
    const result = await baseline();
    const { steps } = buildDecision(client(result, "C02"), result);
    expect(steps.map((step) => step.kind)).toEqual(["farms", "segment", "client"]);
    expect(steps[1]).toMatchObject({ kind: "segment", segment: "A", varianceT: -11.7 });
    expect(steps[2]).toMatchObject({ kind: "client", clientId: "C02", shortT: 10 });
  });

  it("traces C08 to the station limit and the fruit left for the local market", async () => {
    const result = await baseline();
    const { steps } = buildDecision(client(result, "C08"), result);
    expect(steps.map((step) => step.kind)).toEqual(["station", "local", "client"]);
    expect(steps[1]).toMatchObject({ kind: "local", tonnes: 60 });
  });
});
