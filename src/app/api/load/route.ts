import { NextResponse } from "next/server";
import { handle } from "@/lib/server/http";
import { loadWorkbook } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Load and validate the source workbook. 422 lists every validation issue. */
export const POST = handle(async () => {
  const response = await loadWorkbook();
  return NextResponse.json(response, { status: response.status === "valid" ? 200 : 422 });
});
