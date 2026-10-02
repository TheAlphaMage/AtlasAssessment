import { NextResponse } from "next/server";
import { handle, jsonError } from "@/lib/server/http";
import { currentPlan } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The most recent computed plan, if any. */
export const GET = handle(() => {
  const response = currentPlan();
  if (!response) return jsonError(404, "NO_RESULT", "No plan has been computed yet. Load the workbook and run the plan.");
  return NextResponse.json(response);
});
