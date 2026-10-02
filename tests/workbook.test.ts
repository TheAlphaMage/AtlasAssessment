import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { loadDataset } from "@/lib/workbook/loadDataset";
import { BASELINE_WORKBOOK } from "./fixtures";

const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

/** Copy the baseline workbook to a temp file with one cell changed. */
function copyWithCell(sheet: string, address: string, value: number | string): string {
  const workbook = XLSX.read(readFileSync(BASELINE_WORKBOOK), { type: "buffer" });
  XLSX.utils.sheet_add_aoa(workbook.Sheets[sheet], [[value]], { origin: address });
  const file = path.join(mkdtempSync(path.join(tmpdir(), "atlas-")), "modified.xlsx");
  writeFileSync(file, XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
  return file;
}

describe("workbook loading", () => {
  it("loads the supplied workbook without modifying it", async () => {
    const before = sha256(BASELINE_WORKBOOK);
    const { dataset, issues } = await loadDataset(BASELINE_WORKBOOK);
    expect(issues).toEqual([]);
    expect(dataset!.farms).toHaveLength(20);
    expect(dataset!.station.referencePricePerT).toEqual({ A: 1500, B: 1250, C: 1000, D: 750 });
    expect(sha256(BASELINE_WORKBOOK)).toBe(before);
  });

  it("rejects an edited .xlsx end-to-end with a located, actionable issue", async () => {
    // Farms!D11 = expected_A_pct of F07 (row 11).
    const file = copyWithCell("Farms", "D11", 0.5);
    const { dataset, issues } = await loadDataset(file);
    expect(dataset).toBeNull();
    expect(issues).toEqual([
      expect.objectContaining({ sheet: "Farms", row: 11, entityId: "F07", field: "expected_A_pct..expected_D_pct" }),
    ]);
  });

  it("reports a missing file instead of failing silently", async () => {
    const { dataset, issues } = await loadDataset(path.join(tmpdir(), "does-not-exist.xlsx"));
    expect(dataset).toBeNull();
    expect(issues[0]).toMatchObject({ sheet: "(file)", problem: expect.stringMatching(/not found/) });
  });
});
