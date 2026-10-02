/**
 * Field-level validation: raw workbook rows → typed Dataset, or a list of issues.
 * Invalid input is rejected, never repaired. Every issue names the sheet, row,
 * entity ID and field involved, plus a concrete fix. All issues are collected.
 */
import {
  ACCEPTANCE_MODES,
  EXPECTED_CAPACITY_DECIMALS,
  MIX_SUM_TOLERANCE,
  SEGMENTS,
  SHEETS,
  TONNE_STEP,
} from "../domain/constants";
import type { AcceptanceMode, Client, Dataset, Farm, PerSegment, Segment, Station, ValidationIssue } from "../domain/types";
import type { RawRow, RawWorkbook } from "../workbook/readWorkbook";

const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function validate(raw: RawWorkbook): { dataset: Dataset | null; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const farms = validateFarms(raw.farms, issues);
  const clients = validateClients(raw.clients, issues);
  const station = validateStation(raw.stations, raw.referencePrices, issues);
  checkIdCollisions(farms, clients, issues);
  if (issues.length > 0 || !station) return { dataset: null, issues };
  return { dataset: { farms, clients, station }, issues };
}

/** Checks the fields of one row and records issues with consistent location info. */
class RowChecker {
  ok = true;

  constructor(
    private readonly issues: ValidationIssue[],
    private readonly sheet: string,
    private readonly raw: RawRow,
    private readonly entityId: string | null,
  ) {}

  fail(field: string, problem: string, fix: string): void {
    this.ok = false;
    this.issues.push({ sheet: this.sheet, row: this.raw.row, entityId: this.entityId, field, problem, fix });
  }

  number(field: string, opts: { min?: number; positive?: boolean } = {}): number | null {
    const value = this.raw.values[field];
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
      this.fail(field, "Value is missing.", "Enter a numeric value.");
      return null;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      this.fail(field, `'${String(value)}' is not a number.`, "Enter a plain numeric value (no text or units).");
      return null;
    }
    if (opts.positive && value <= 0) {
      this.fail(field, `${value} must be greater than 0.`, "Enter a positive value.");
      return null;
    }
    if (opts.min !== undefined && value < opts.min) {
      this.fail(field, `${value} is negative.`, `Enter a value of at least ${opts.min}.`);
      return null;
    }
    return value;
  }

  /** Non-negative (or positive) multiple of the 5 t step. */
  tonnes(field: string, opts: { positive?: boolean } = {}): number | null {
    const value = this.number(field, { min: 0, positive: opts.positive });
    if (value === null) return null;
    if (!Number.isInteger(value) || value % TONNE_STEP !== 0) {
      const low = Math.floor(value / TONNE_STEP) * TONNE_STEP;
      this.fail(
        field,
        `${value} t is not a multiple of ${TONNE_STEP} t.`,
        `Use a multiple of ${TONNE_STEP} t (e.g. ${low} or ${low + TONNE_STEP}).`,
      );
      return null;
    }
    return value;
  }

  choice<T extends string>(field: string, allowed: readonly T[]): T | null {
    const value = this.raw.values[field];
    if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
      this.fail(field, `'${String(value ?? "")}' is not a valid value.`, `Use exactly one of: ${allowed.join(", ")} (case-sensitive).`);
      return null;
    }
    return value as T;
  }
}

// ------------------------------------------------------------------ farms

function validateFarms(rows: RawRow[], issues: ValidationIssue[]): Farm[] {
  const sheet = SHEETS.farms;
  if (rows.length === 0) issues.push(sheetIssue(sheet, "No farm rows found.", "Add at least one farm row under the header."));
  const farms: Farm[] = [];
  const seen = new Map<string, number>();

  for (const row of rows) {
    const farmId = validateId(row, "farm_id", sheet, seen, issues);
    const check = new RowChecker(issues, sheet, row, farmId);

    const capacity = check.number("expected_daily_capacity_t", { min: 0 });
    if (capacity !== null && roundTo(capacity, EXPECTED_CAPACITY_DECIMALS) !== capacity) {
      check.fail(
        "expected_daily_capacity_t",
        `${capacity} has more than ${EXPECTED_CAPACITY_DECIMALS} decimal.`,
        `Round to ${EXPECTED_CAPACITY_DECIMALS} decimal (e.g. ${roundTo(capacity, EXPECTED_CAPACITY_DECIMALS)}).`,
      );
    }

    const mix = {} as PerSegment<number | null>;
    for (const s of SEGMENTS) {
      const field = `expected_${s}_pct`;
      const fraction = check.number(field);
      if (fraction !== null && (fraction < 0 || fraction > 1)) {
        check.fail(field, `Mix fraction ${fraction} is outside 0–1.`, "Enter the share as a decimal fraction between 0 and 1 (e.g. 0.25 for 25%).");
        mix[s] = null;
      } else {
        mix[s] = fraction;
      }
    }
    const fractions = SEGMENTS.map((s) => mix[s]);
    if (fractions.every((v) => v !== null)) {
      const total = (fractions as number[]).reduce((a, b) => a + b, 0);
      if (Math.abs(total - 1) > MIX_SUM_TOLERANCE) {
        check.fail(
          "expected_A_pct..expected_D_pct",
          `Expected mix totals ${Number(total.toFixed(4))}, not 1.0.`,
          "Adjust the A/B/C/D fractions so they add up to exactly 1.0.",
        );
      }
    }

    const actual = {} as PerSegment<number | null>;
    for (const s of SEGMENTS) actual[s] = check.tonnes(`actual_${s}_t`);

    if (check.ok && farmId !== null && capacity !== null) {
      farms.push({
        farmId,
        farmName: text(row.values.farm_name),
        expectedCapacityT: capacity,
        expectedMix: mix as PerSegment<number>,
        actualT: actual as PerSegment<number>,
      });
    }
  }
  return farms;
}

// ------------------------------------------------------------------ clients

function validateClients(rows: RawRow[], issues: ValidationIssue[]): Client[] {
  const sheet = SHEETS.clients;
  if (rows.length === 0) issues.push(sheetIssue(sheet, "No client rows found.", "Add at least one client row under the header."));
  const clients: Client[] = [];
  const seen = new Map<string, number>();

  for (const row of rows) {
    const clientId = validateId(row, "client_id", sheet, seen, issues);
    const check = new RowChecker(issues, sheet, row, clientId);
    const mode = check.choice<AcceptanceMode>("acceptance_mode", ACCEPTANCE_MODES);
    const segment = check.choice<Segment>("requested_segment", SEGMENTS);
    const demand = check.tonnes("demand_t");
    const price = check.number("export_price_per_t_eur", { positive: true });
    if (check.ok && clientId !== null && mode && segment && demand !== null && price !== null) {
      clients.push({
        clientId,
        clientName: text(row.values.client_name),
        acceptanceMode: mode,
        requestedSegment: segment,
        demandT: demand,
        pricePerT: price,
      });
    }
  }
  return clients;
}

// ------------------------------------------------------------------ station

function validateStation(stationRows: RawRow[], priceRows: RawRow[], issues: ValidationIssue[]): Station | null {
  const sheet = SHEETS.station;
  if (stationRows.length !== 1) {
    issues.push({
      sheet,
      row: null,
      entityId: null,
      field: "station_id",
      problem: `Expected exactly one station row, found ${stationRows.length}.`,
      fix: "Keep a single export-conditioning station row under the header.",
    });
    return null;
  }

  const row = stationRows[0];
  const stationId = validateId(row, "station_id", sheet, new Map(), issues);
  const check = new RowChecker(issues, sheet, row, stationId);
  const capacity = check.tonnes("export_conditioning_capacity_t", { positive: true });
  const ratio = check.number("local_market_ratio", { min: 0 });
  if (ratio !== null && ratio > 1) {
    check.fail("local_market_ratio", `Ratio ${ratio} is above 1.`, "Enter a decimal fraction between 0 and 1 (e.g. 0.1 for 10%).");
  }

  const prices: Partial<PerSegment<number>> = {};
  let pricesOk = true;
  for (const priceRow of priceRows) {
    const segmentValue = priceRow.values.segment;
    const priceCheck = new RowChecker(issues, sheet, priceRow, typeof segmentValue === "string" ? segmentValue : null);
    const segment = priceCheck.choice<Segment>("segment", SEGMENTS);
    const price = priceCheck.number("reference_export_price_per_t_eur", { positive: true });
    if (segment && prices[segment] !== undefined) {
      priceCheck.fail("segment", `Segment ${segment} has more than one reference price.`, "Keep exactly one price row per segment.");
    } else if (segment && price !== null) {
      prices[segment] = price;
    }
    pricesOk &&= priceCheck.ok;
  }
  for (const segment of SEGMENTS) {
    const hasRow = priceRows.some((r) => r.values.segment === segment);
    if (!hasRow) {
      issues.push({
        sheet,
        row: null,
        entityId: segment,
        field: "reference_export_price_per_t_eur",
        problem: `Reference export price for segment ${segment} is missing.`,
        fix: `Add a row for segment ${segment} in the reference-price table.`,
      });
      pricesOk = false;
    }
  }

  if (!check.ok || !pricesOk || stationId === null || capacity === null || ratio === null) return null;
  return {
    stationId,
    capacityT: capacity,
    localMarketRatio: ratio,
    referencePricePerT: prices as PerSegment<number>,
  };
}

// ------------------------------------------------------------------ shared helpers

function validateId(
  row: RawRow,
  field: string,
  sheet: string,
  seen: Map<string, number>,
  issues: ValidationIssue[],
): string | null {
  const value = row.values[field];
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    issues.push({ sheet, row: row.row, entityId: null, field, problem: "ID is missing.", fix: `Enter a unique ${field} for this row.` });
    return null;
  }
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    issues.push({
      sheet,
      row: row.row,
      entityId: String(value),
      field,
      problem: `ID '${String(value)}' is invalid.`,
      fix: "Use letters, digits, '-' or '_' only, with no spaces (e.g. F21 or C11).",
    });
    return null;
  }
  const firstRow = seen.get(value);
  if (firstRow !== undefined) {
    issues.push({
      sheet,
      row: row.row,
      entityId: value,
      field,
      problem: `Duplicate ID '${value}' (first used on row ${firstRow}).`,
      fix: "Give each row a unique ID or remove the duplicate row.",
    });
    return null;
  }
  seen.set(value, row.row);
  return value;
}

function checkIdCollisions(farms: Farm[], clients: Client[], issues: ValidationIssue[]): void {
  const farmIds = new Set(farms.map((f) => f.farmId));
  for (const client of clients) {
    if (farmIds.has(client.clientId)) {
      issues.push({
        sheet: `${SHEETS.farms} / ${SHEETS.clients}`,
        row: null,
        entityId: client.clientId,
        field: "farm_id / client_id",
        problem: `ID '${client.clientId}' is used for both a farm and a client.`,
        fix: "Farm and client IDs must be distinct so every allocation stays traceable.",
      });
    }
  }
}

function sheetIssue(sheet: string, problem: string, fix: string): ValidationIssue {
  return { sheet, row: null, entityId: null, field: null, problem, fix };
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
