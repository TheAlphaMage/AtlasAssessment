import { describe, expect, it } from "vitest";
import { buildPaletteItems } from "@/features/command/paletteItems";
import { ROUTES } from "@/features/navigation/routes";
import { plan } from "@/lib/planning/engine";
import { loadDataset } from "@/lib/workbook/loadDataset";
import { BASELINE_WORKBOOK } from "./fixtures";

async function baselineItems() {
  const { dataset } = await loadDataset(BASELINE_WORKBOOK);
  return buildPaletteItems(plan(dataset!));
}

describe("command menu items", () => {
  it("lists every page, 10 clients, 20 farms and 4 segments", async () => {
    const items = await baselineItems();
    const countOf = (group: string) => items.filter((item) => item.group === group).length;

    expect(countOf("Pages")).toBe(ROUTES.length);
    expect(countOf("Clients")).toBe(10);
    expect(countOf("Farms")).toBe(20);
    expect(countOf("Segments")).toBe(4);
  });

  it("navigates for pages and opens a drawer for clients, farms and segments", async () => {
    const items = await baselineItems();
    const byKey = (key: string) => items.find((item) => item.key === key)!;

    expect(byKey("page-/clients").action).toEqual({ type: "navigate", href: "/clients" });
    expect(byKey("client-C02").action).toEqual({ type: "open", id: "C02" });
    expect(byKey("farm-F20").action).toEqual({ type: "open", id: "F20" });
    expect(byKey("segment-A").action).toEqual({ type: "open", id: "A" });
  });

  it("gives every item a unique key", async () => {
    const items = await baselineItems();
    expect(new Set(items.map((item) => item.key)).size).toBe(items.length);
  });
});
