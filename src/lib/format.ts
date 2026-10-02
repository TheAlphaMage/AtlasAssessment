/** Display formatting only — no business calculations. Fixed locale for reproducible text. */

const LOCALE = "en-US";
export const MINUS = "−";

export function fmtNumber(n: number, maxDecimals = 2): string {
  const abs = Math.abs(n).toLocaleString(LOCALE, { maximumFractionDigits: maxDecimals });
  return n < 0 && abs !== "0" ? `${MINUS}${abs}` : abs;
}

/** "60 t", "101.7 t" */
export function fmtT(n: number): string {
  return `${fmtNumber(n)} t`;
}

/** "−11.7 t", "+5 t", "0 t" */
export function fmtSignedT(n: number): string {
  if (Math.abs(n) < 0.005) return "0 t";
  return `${n > 0 ? "+" : ""}${fmtNumber(n)} t`;
}

/** "EUR 549,500" (cents shown only when present). */
export function fmtEur(n: number): string {
  const decimals = Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2;
  return `EUR ${fmtNumber(n, decimals)}`.replace(`EUR ${MINUS}`, `${MINUS}EUR `);
}

/** 0.8929 → "89.3%" */
export function fmtPct(ratio: number, decimals = 1): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

export function reasonLabel(reason: string | null): string {
  if (reason === "STATION_CAPACITY_REACHED") return "Station export capacity was used up before this order was filled.";
  if (reason === "INSUFFICIENT_COMPATIBLE_SEGMENT")
    return "Not enough compatible-quality fruit was left after higher-priced orders.";
  return "";
}
