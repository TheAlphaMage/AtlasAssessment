/**
 * Read-only planning assistant. It explains an already-computed PlanResult:
 *  - unsupported or action questions are answered honestly without calling a model;
 *  - with no provider configured, a clearly labelled deterministic summary is returned;
 *  - model answers are accepted only after grounding validation; on timeout, provider
 *    failure or invalid output the user is told so and gets the deterministic summary.
 * The assistant never changes, approves or executes anything.
 */
import type { AssistantResponse, PlanResult } from "../domain/types";
import { validateModelOutput } from "./grounding";
import { createCompleter, readProviderConfig, type Complete, type ProviderConfig } from "./provider";
import { SUPPORTED_QUESTIONS, buildContext, classify, deterministicAnswer, isActionRequest } from "./topics";

export const MAX_QUESTION_CHARS = 500;

const SYSTEM_PROMPT = `You explain a daily apple export plan that was already computed by a deterministic planning engine.
You are read-only and you are not the decision maker.
Rules:
- Use only the facts provided. Copy numbers exactly as written in the facts; never calculate, estimate or round new numbers.
- Never propose, change, approve or execute allocations; Production and Commercial approve the plan.
- Name the farm IDs (e.g. F01), client IDs (e.g. C02) and segment labels (A, B, C, D) that support your statements.
- If the facts do not answer the question, say that the information is unavailable.
- At most 120 words, plain sentences.
Reply with JSON only, no other text: {"answer": "<text>", "evidence_ids": ["<ID>", ...]}`;

export interface AssistantDeps {
  config: ProviderConfig | null;
  configProblem: string | null;
  complete: Complete | null;
}

export function defaultDeps(): AssistantDeps {
  const { config, problem } = readProviderConfig();
  return { config, configProblem: problem, complete: config ? createCompleter(config) : null };
}

export async function answerQuestion(question: string, result: PlanResult, deps: AssistantDeps): Promise<AssistantResponse> {
  const base = { provider: deps.config?.provider ?? null, model: deps.config?.model ?? null };
  const q = question.trim();

  if (isActionRequest(q)) {
    return {
      ...base,
      status: "unsupported",
      source: "none",
      notice: "Read-only assistant",
      answer:
        "I can only explain the computed plan. Approving, changing or executing allocations stays with the Production and Commercial teams.",
      evidenceIds: [],
    };
  }

  const topic = classify(q);
  if (!topic) {
    return {
      ...base,
      status: "unsupported",
      source: "none",
      notice: "Not covered by the loaded data",
      answer:
        "That information is unavailable in the loaded workbook and the computed plan. I can explain:\n" +
        Object.values(SUPPORTED_QUESTIONS)
          .map((s) => `• ${s}`)
          .join("\n"),
      evidenceIds: [],
    };
  }

  const fallback = deterministicAnswer(topic, result);
  const deterministic = (status: AssistantResponse["status"], notice: string): AssistantResponse => ({
    ...base,
    status,
    source: "deterministic",
    notice,
    answer: fallback.answer,
    evidenceIds: fallback.evidenceIds,
  });

  if (!deps.config || !deps.complete) {
    const why = deps.configProblem ? `AI provider misconfigured: ${deps.configProblem}.` : "No AI provider is configured.";
    return deterministic("no_provider", `${why} Showing a deterministic summary computed from the plan; no AI model was used.`);
  }

  const context = buildContext(topic, result);
  const userPrompt = JSON.stringify({ question: q, facts: context.facts });

  let raw: string;
  try {
    raw = await withTimeout(deps.complete, SYSTEM_PROMPT, userPrompt, deps.config.timeoutMs);
  } catch (error) {
    if (error instanceof TimeoutError) {
      return deterministic("timeout", `The AI provider did not answer within ${deps.config.timeoutMs / 1000} s. Showing the deterministic summary instead.`);
    }
    return deterministic("provider_error", `The AI provider failed (${(error as Error).message}). Showing the deterministic summary instead.`);
  }

  const grounded = validateModelOutput(raw, context);
  if (!grounded.ok) {
    return deterministic("invalid_output", `The AI answer was rejected because ${grounded.reason}. Showing the deterministic summary instead.`);
  }
  return { ...base, status: "ok", source: "llm", notice: null, answer: grounded.answer, evidenceIds: grounded.evidenceIds };
}

class TimeoutError extends Error {}

async function withTimeout(complete: Complete, system: string, user: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError());
    }, timeoutMs);
  });
  try {
    return await Promise.race([complete(system, user, controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
