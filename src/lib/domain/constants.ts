/** Business rules from the assessment brief and the workbook "Read Me". Centralised here. */

/** Quality order, best first. The index is the quality rank (0 = best). */
export const SEGMENTS = ["A", "B", "C", "D"] as const;
export const ACCEPTANCE_MODES = ["EXACT", "MINIMUM"] as const;

/** Actuals, demand, station capacity and allocations all move in 5 t steps. */
export const TONNE_STEP = 5;
/** Expected daily capacity may use at most one decimal. */
export const EXPECTED_CAPACITY_DECIMALS = 1;
/** Expected mix fractions must sum to 1.0 per farm; tolerance absorbs float noise only. */
export const MIX_SUM_TOLERANCE = 1e-6;

export const REASON_STATION_CAPACITY = "STATION_CAPACITY_REACHED";
export const REASON_INSUFFICIENT_SEGMENT = "INSUFFICIENT_COMPATIBLE_SEGMENT";

/** Workbook layout. Tables are located by their header row, not by fixed cell addresses. */
export const SHEETS = { farms: "Farms", clients: "Clients", station: "Station" } as const;

export const FARM_COLUMNS = [
  "farm_id",
  "farm_name",
  "expected_daily_capacity_t",
  "expected_A_pct",
  "expected_B_pct",
  "expected_C_pct",
  "expected_D_pct",
  "actual_A_t",
  "actual_B_t",
  "actual_C_t",
  "actual_D_t",
] as const;

export const CLIENT_COLUMNS = [
  "client_id",
  "client_name",
  "acceptance_mode",
  "requested_segment",
  "demand_t",
  "export_price_per_t_eur",
] as const;

export const STATION_COLUMNS = ["station_id", "export_conditioning_capacity_t", "local_market_ratio"] as const;

export const REFERENCE_PRICE_COLUMNS = ["segment", "reference_export_price_per_t_eur"] as const;

export const DEFAULT_WORKBOOK_FILE = "Atlas_Fresh_Production_Commercial_Data.xlsx";
