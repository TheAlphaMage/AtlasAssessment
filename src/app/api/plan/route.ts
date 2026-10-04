import { NextResponse } from "next/server";
import { handle, jsonError } from "@/lib/server/http";
import { loadWorkbook, runPlan } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Run the deterministic planning engine on the validated workbook.
 * If this server instance has not loaded it yet (serverless hosts run routes separately), load it first.
 */
export const POST = handle(async () => {
  const planned = runPlan();
  if (planned) return NextResponse.json(planned);

  const load = await loadWorkbook();
  if (load.status === "invalid") return NextResponse.json(load, { status: 422 });
  const response = runPlan();
  if (!response) return jsonError(500, "PLAN_FAILED", "The plan could not be computed.");
  return NextResponse.json(response);
});
