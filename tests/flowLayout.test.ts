import { describe, expect, it } from "vitest";
import {
  LOCAL_DESTINATION,
  computeFlowLayout,
  ribbonMatchesSelection,
  ribbonPath,
} from "@/features/flow/flowLayout";
import { plan } from "@/lib/planning/engine";
import { loadDataset } from "@/lib/workbook/loadDataset";
import { BASELINE_WORKBOOK } from "./fixtures";

async function baselineLayout() {
  const { dataset, issues } = await loadDataset(BASELINE_WORKBOOK);
  expect(issues).toEqual([]);
  const result = plan(dataset!);
  return { result, layout: computeFlowLayout(result) };
}

const tonnesOf = (ribbons: { tonnes: number }[]) => ribbons.reduce((total, ribbon) => total + ribbon.tonnes, 0);

describe("Crop Flow layout", () => {
  it("draws every exported tonne to a client and every residual tonne to the local market", async () => {
    const { result, layout } = await baselineLayout();
    const toClients = layout.ribbons.filter((ribbon) => ribbon.destination !== LOCAL_DESTINATION);
    const toLocal = layout.ribbons.filter((ribbon) => ribbon.destination === LOCAL_DESTINATION);

    expect(tonnesOf(toClients)).toBe(result.kpis.exportT);
    expect(tonnesOf(toLocal)).toBe(result.kpis.localT);
  });

  it("keeps every node inside the canvas and sizes nodes by tonnes", async () => {
    const { result, layout } = await baselineLayout();

    for (const node of layout.segmentNodes) {
      expect(node.y).toBeGreaterThan(0);
      expect(node.y + node.height).toBeLessThanOrEqual(layout.height);
      expect(node.height).toBeCloseTo(node.actualT * layout.scale, 5);
    }
    for (const node of layout.clientNodes) {
      expect(node.y + node.filledHeight + node.shortageHeight).toBeLessThanOrEqual(layout.height);
      const demand = node.client.demandT;
      expect((node.filledHeight + node.shortageHeight) / layout.scale).toBeCloseTo(demand, 5);
    }
    expect(layout.localNode?.tonnes).toBe(result.kpis.localT);
  });

  it("omits the local node when nothing falls back to the local market", async () => {
    const { result } = await baselineLayout();
    const layout = computeFlowLayout({ ...result, residuals: [] });
    expect(layout.localNode).toBeNull();
    expect(layout.ribbons.every((ribbon) => ribbon.destination !== LOCAL_DESTINATION)).toBe(true);
  });

  it("matches ribbons by client, segment or farm, and matches nothing for an empty selection", async () => {
    const { layout } = await baselineLayout();
    const c02Ribbons = layout.ribbons.filter((ribbon) => ribbonMatchesSelection(ribbon, { clientId: "C02" }));

    expect(c02Ribbons.length).toBeGreaterThan(0);
    expect(c02Ribbons.every((ribbon) => ribbon.destination === "C02")).toBe(true);
    expect(layout.ribbons.some((ribbon) => ribbonMatchesSelection(ribbon, { segment: "D" }))).toBe(true);
    expect(layout.ribbons.some((ribbon) => ribbonMatchesSelection(ribbon, { farmId: "F20" }))).toBe(true);
    expect(layout.ribbons.some((ribbon) => ribbonMatchesSelection(ribbon, {}))).toBe(false);
  });
});

describe("ribbonPath", () => {
  it("returns a closed band that starts at the top-left corner", () => {
    const path = ribbonPath(0, 10, 100, 50, 20);
    expect(path.startsWith("M 0 10")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path).toContain("L 100 70"); // bottom-right corner = target y + thickness
  });
});
