/**
 * Reads the source workbook into raw rows. It only locates tables and copies
 * cell values; it never interprets or repairs them (validation does that).
 * The file is opened for reading only and is never written.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  CLIENT_COLUMNS,
  DEFAULT_WORKBOOK_FILE,
  FARM_COLUMNS,
  REFERENCE_PRICE_COLUMNS,
  SHEETS,
  STATION_COLUMNS,
} from "../domain/constants";
import type { ValidationIssue } from "../domain/types";

export interface RawRow {
  /** 1-based Excel row number, used in validation messages. */
  row: number;
  values: Record<string, unknown>;
}

export interface RawWorkbook {
  farms: RawRow[];
  clients: RawRow[];
  stations: RawRow[];
  referencePrices: RawRow[];
}

export function workbookPath(): string {
  return process.env.WORKBOOK_PATH || path.join(process.cwd(), DEFAULT_WORKBOOK_FILE);
}

export async function readWorkbook(file: string): Promise<{ raw: RawWorkbook; issues: ValidationIssue[] }> {
  const raw: RawWorkbook = { farms: [], clients: [], stations: [], referencePrices: [] };
  const issues: ValidationIssue[] = [];

  if (!existsSync(file)) {
    issues.push(fileIssue(`Workbook not found at ${file}.`, "Place the workbook at this path or set WORKBOOK_PATH."));
    return { raw, issues };
  }

  let workbook: XLSX.WorkBook;
  try {
    // Read the bytes ourselves; SheetJS only parses the in-memory copy.
    workbook = XLSX.read(readFileSync(file), { type: "buffer" });
  } catch (error) {
    issues.push(
      fileIssue(`Workbook could not be opened: ${(error as Error).message}.`, "Save the file as a valid .xlsx workbook and reload."),
    );
    return { raw, issues };
  }

  const grid = (sheet: string) => {
    const ws = workbook.Sheets[sheet];
    if (!ws) {
      const found = workbook.SheetNames.join(", ");
      issues.push({
        sheet,
        row: null,
        entityId: null,
        field: null,
        problem: `Sheet '${sheet}' is missing.`,
        fix: `Restore the '${sheet}' sheet (found: ${found}).`,
      });
      return null;
    }
    return toGrid(ws);
  };

  const farms = grid(SHEETS.farms);
  if (farms) raw.farms = readTable(farms, SHEETS.farms, FARM_COLUMNS, issues);
  const clients = grid(SHEETS.clients);
  if (clients) raw.clients = readTable(clients, SHEETS.clients, CLIENT_COLUMNS, issues);
  const station = grid(SHEETS.station);
  if (station) {
    raw.stations = readTable(station, SHEETS.station, STATION_COLUMNS, issues);
    raw.referencePrices = readTable(station, SHEETS.station, REFERENCE_PRICE_COLUMNS, issues);
  }
  return { raw, issues };
}

/**
 * Sheet → 2D array of raw cell values, padded so that grid[i] is Excel row i + 1.
 * Formula cells yield their cached result; empty cells are null.
 */
function toGrid(ws: XLSX.WorkSheet): unknown[][] {
  if (!ws["!ref"]) return [];
  const firstRow = XLSX.utils.decode_range(ws["!ref"]).s.r;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, blankrows: true, raw: true });
  return [...Array.from({ length: firstRow }, () => []), ...rows];
}

/** Find the header row whose first cell equals columns[0]; read rows until a fully blank row. */
function readTable(grid: unknown[][], sheet: string, columns: readonly string[], issues: ValidationIssue[]): RawRow[] {
  const headerIndex = grid.findIndex((r) => clean(r[0]) === columns[0]);
  if (headerIndex < 0) {
    issues.push({
      sheet,
      row: null,
      entityId: null,
      field: columns[0],
      problem: `No table header starting with '${columns[0]}' was found.`,
      fix: `Add a header row with columns: ${columns.join(", ")}.`,
    });
    return [];
  }

  const header = grid[headerIndex].map(clean);
  const missing = columns.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    issues.push({
      sheet,
      row: headerIndex + 1,
      entityId: null,
      field: missing.join(", "),
      problem: `Required column(s) missing: ${missing.join(", ")}.`,
      fix: "Restore the column header exactly as named.",
    });
    return [];
  }

  const table: RawRow[] = [];
  for (let i = headerIndex + 1; i < grid.length; i++) {
    const values: Record<string, unknown> = {};
    for (const column of columns) values[column] = grid[i][header.indexOf(column)] ?? null;
    if (Object.values(values).every(isBlank)) break;
    table.push({ row: i + 1, values });
  }
  return table;
}

function fileIssue(problem: string, fix: string): ValidationIssue {
  return { sheet: "(file)", row: null, entityId: null, field: null, problem, fix };
}

function clean(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}
