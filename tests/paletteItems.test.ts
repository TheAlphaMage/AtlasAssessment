import { describe, expect, it } from "vitest";
import { buildPaletteItems, filterPaletteItems } from "@/features/planner/paletteItems";
import { plan } from "@/lib/planning/engine";
import { loadDataset } from "@/lib/workbook/loadDataset";
import { BASELINE_WORKBOOK } from "./fixtures";

async function baselineItems() {
  const { dataset } = await loadDataset(BASELINE_WORKBOOK);
  return buildPaletteItems(plan(dataset!));
}

describe("command palette items", () => {
  it("lists 5 views, 10 clients, 20 farms and 4 segments", async () => {
    const items = await baselineItems();
    const countOf = (group: string) => items.filter((item) => item.group === group).length;

    expect(countOf("View")).toBe(5);
    expect(countOf("Client")).toBe(10);
    expect(countOf("Farm")).toBe(20);
    expect(countOf("Segment")).toBe(4);
  });

  it("filters by label or hint, ignoring case and extra spaces", async () => {
    const items = await baselineItems();

    expect(filterPaletteItems(items, "  c08 ").map((item) => item.label)).toEqual(["C08"]);
    expect(filterPaletteItems(items, "partial").every((item) => item.group === "Client")).toBe(true);
    expect(filterPaletteItems(items, "").length).toBe(items.length);
    expect(filterPaletteItems(items, "zzz-no-match")).toEqual([]);
  });

  it("opens a view for view items and traces an ID for everything else", async () => {
    const items = await baselineItems();
    const view = items.find((item) => item.id === "view-commercial")!;
    const client = items.find((item) => item.id === "client-C02")!;

    expect(view.action).toEqual({ type: "view", view: "commercial" });
    expect(client.action).toEqual({ type: "trace", selection: { clientId: "C02" } });
  });
});
