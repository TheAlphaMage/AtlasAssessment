import { NextResponse } from "next/server";
import { handle, jsonError } from "@/lib/server/http";
import { runPlan } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Run the deterministic planning engine on the loaded, validated workbook. */
export const POST = handle(() => {
  const response = runPlan();
  if (!response) return jsonError(409, "NOT_LOADED", "No valid workbook is loaded. Call POST /api/load first.");
  return NextResponse.json(response);
});
