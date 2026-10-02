import { describe, expect, it } from "vitest";
import { validate } from "@/lib/validation/validate";
import type { RawWorkbook } from "@/lib/workbook/readWorkbook";
import { baselineRaw } from "./fixtures";

/** Mutate one baseline row (located by its ID column) and validate. */
async function validateWith(edit: (raw: RawWorkbook) => void) {
  const raw = await baselineRaw();
  edit(raw);
  return validate(raw);
}
const farmRow = (raw: RawWorkbook, id: string) => raw.farms.find((r) => r.values.farm_id === id)!.values;
const clientRow = (raw: RawWorkbook, id: string) => raw.clients.find((r) => r.values.client_id === id)!.values;

describe("server-side validation", () => {
  it("accepts the supplied baseline as valid", async () => {
    const { dataset, issues } = await validateWith(() => {});
    expect(issues).toEqual([]);
    expect(dataset!.farms).toHaveLength(20);
    expect(dataset!.clients).toHaveLength(10);
    expect(dataset!.station.capacityT).toBe(500);
  });

  it("rejects duplicate and missing IDs, naming sheet, row and field", async () => {
    const { dataset, issues } = await validateWith((raw) => {
      farmRow(raw, "F02").farm_id = "F01";
      clientRow(raw, "C05").client_id = null;
    });
    expect(dataset).toBeNull();
    expect(issues).toContainEqual(
      expect.objectContaining({ sheet: "Farms", row: 6, entityId: "F01", field: "farm_id", problem: expect.stringMatching(/Duplicate/) }),
    );
    expect(issues).toContainEqual(expect.objectContaining({ sheet: "Clients", row: 9, field: "client_id", problem: "ID is missing." }));
  });

  it("rejects invalid acceptance modes and segments (case-sensitive, never coerced)", async () => {
    const { issues } = await validateWith((raw) => {
      clientRow(raw, "C03").acceptance_mode = "exact";
      clientRow(raw, "C04").requested_segment = "E";
    });
    expect(issues).toContainEqual(expect.objectContaining({ sheet: "Clients", entityId: "C03", field: "acceptance_mode" }));
    expect(issues).toContainEqual(expect.objectContaining({ sheet: "Clients", entityId: "C04", field: "requested_segment" }));
  });

  it("rejects mix fractions outside 0–1 and mixes that do not total 1.0", async () => {
    const { issues } = await validateWith((raw) => {
      farmRow(raw, "F07").expected_A_pct = 0.5; // 0.5 + 0.7 + 0.2 = 1.4
      farmRow(raw, "F08").expected_B_pct = 1.2;
    });
    expect(issues).toContainEqual(
      expect.objectContaining({ sheet: "Farms", entityId: "F07", field: "expected_A_pct..expected_D_pct", problem: expect.stringMatching(/1\.4/) }),
    );
    expect(issues).toContainEqual(expect.objectContaining({ sheet: "Farms", entityId: "F08", field: "expected_B_pct" }));
  });

  it("rejects negative, non-numeric and non-5 t quantities", async () => {
    const { issues } = await validateWith((raw) => {
      farmRow(raw, "F01").actual_A_t = -5;
      farmRow(raw, "F02").actual_B_t = 12;
      farmRow(raw, "F03").actual_A_t = "20";
      clientRow(raw, "C01").demand_t = 52;
      farmRow(raw, "F04").expected_daily_capacity_t = 30.25;
    });
    const at = (entityId: string, field: string) => expect.objectContaining({ entityId, field });
    expect(issues).toContainEqual(at("F01", "actual_A_t"));
    expect(issues).toContainEqual(at("F02", "actual_B_t"));
    expect(issues).toContainEqual(at("F03", "actual_A_t"));
    expect(issues).toContainEqual(at("C01", "demand_t"));
    expect(issues).toContainEqual(at("F04", "expected_daily_capacity_t"));
    expect(issues.every((i) => i.fix.length > 0)).toBe(true);
  });

  it("rejects invalid station capacity and missing segment reference prices", async () => {
    const { issues } = await validateWith((raw) => {
      raw.stations[0].values.export_conditioning_capacity_t = 503;
      raw.referencePrices = raw.referencePrices.filter((r) => r.values.segment !== "C");
    });
    expect(issues).toContainEqual(expect.objectContaining({ sheet: "Station", field: "export_conditioning_capacity_t" }));
    expect(issues).toContainEqual(
      expect.objectContaining({ sheet: "Station", entityId: "C", field: "reference_export_price_per_t_eur" }),
    );

    const zero = await validateWith((raw) => {
      raw.stations[0].values.export_conditioning_capacity_t = 0;
    });
    expect(zero.issues).toContainEqual(expect.objectContaining({ field: "export_conditioning_capacity_t", problem: expect.stringMatching(/greater than 0/) }));
  });
});
