import { NextResponse } from "next/server";
import { MAX_QUESTION_CHARS, answerQuestion, defaultDeps } from "@/lib/assistant/assistant";
import { readProviderConfig } from "@/lib/assistant/provider";
import type { AssistantProviderStatus } from "@/lib/domain/types";
import { handle, jsonError } from "@/lib/server/http";
import { ensurePlan } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which explanation provider (if any) is configured. Never exposes keys. */
export function GET(): NextResponse<AssistantProviderStatus> {
  const { config } = readProviderConfig();
  return NextResponse.json({ configured: config !== null, provider: config?.provider ?? null, model: config?.model ?? null });
}

/** Explain the current computed plan. Read-only: never changes the plan. */
export const POST = handle(async (request) => {
  let question: unknown;
  try {
    question = ((await request.json()) as { question?: unknown }).question;
  } catch {
    return jsonError(400, "BAD_REQUEST", "Send JSON: { \"question\": \"...\" }.");
  }
  if (typeof question !== "string" || !question.trim() || question.length > MAX_QUESTION_CHARS) {
    return jsonError(400, "BAD_REQUEST", `Ask a question of 1–${MAX_QUESTION_CHARS} characters.`);
  }
  const ensured = await ensurePlan();
  if (!ensured.ok) return jsonError(409, "NO_RESULT", "No plan to explain: the workbook is invalid. Fix it and reload.");
  return NextResponse.json(await answerQuestion(question, ensured.plan.result, defaultDeps()));
});
