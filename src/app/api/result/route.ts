import { NextResponse } from "next/server";
import { handle, jsonError } from "@/lib/server/http";
import { ensurePlan } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The current plan (computed on demand if this server instance has none yet). */
export const GET = handle(async () => {
  const ensured = await ensurePlan();
  if (!ensured.ok) return jsonError(404, "NO_RESULT", "No plan: the workbook is invalid. Fix it and call POST /api/load.");
  return NextResponse.json(ensured.plan);
});
