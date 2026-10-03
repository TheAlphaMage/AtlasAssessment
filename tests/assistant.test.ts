import { beforeAll, describe, expect, it, vi } from "vitest";
import { answerQuestion, type AssistantDeps } from "@/lib/assistant/assistant";
import { validateModelOutput } from "@/lib/assistant/grounding";
import type { ProviderConfig } from "@/lib/assistant/provider";
import { SUPPORTED_QUESTIONS, buildContext, classify, deterministicAnswer, type Topic } from "@/lib/assistant/topics";
import type { PlanResult } from "@/lib/domain/types";
import { plan } from "@/lib/planning/engine";
import { loadDataset } from "@/lib/workbook/loadDataset";
import { BASELINE_WORKBOOK } from "./fixtures";

let result: PlanResult;
beforeAll(async () => {
  result = plan((await loadDataset(BASELINE_WORKBOOK)).dataset!);
});

const CONFIG: ProviderConfig = { provider: "deepseek", model: "test-model", apiKey: "test", baseUrl: null, timeoutMs: 50 };
const withModel = (reply: string | (() => Promise<string>)): AssistantDeps => ({
  config: CONFIG,
  configProblem: null,
  complete: vi.fn(typeof reply === "string" ? async () => reply : reply),
});
const noModel: AssistantDeps = { config: null, configProblem: null, complete: null };
const AT_RISK = SUPPORTED_QUESTIONS.at_risk;

describe("assistant grounding", () => {
  it("accepts a grounded model answer that cites real IDs and plan numbers", async () => {
    const deps = withModel(
      JSON.stringify({
        answer:
          "C02 and C09 are PARTIAL for INSUFFICIENT_COMPATIBLE_SEGMENT. C08 is 30 t short because the 500 t station capacity was reached.",
        evidence_ids: ["C02", "C09", "C08"],
      }),
    );
    const response = await answerQuestion(AT_RISK, result, deps);
    expect(response).toMatchObject({ status: "ok", source: "llm", evidenceIds: ["C02", "C09", "C08"], notice: null });
    // Only the minimal topic facts are sent, not the workbook.
    const [, userPrompt] = (deps.complete as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(userPrompt).facts).toEqual(buildContext("at_risk", result).facts);
  });

  it("rejects answers that cite unknown IDs and falls back to the labelled deterministic summary", async () => {
    const response = await answerQuestion(
      AT_RISK,
      result,
      withModel(JSON.stringify({ answer: "C99 is unserved.", evidence_ids: ["C99"] })),
    );
    expect(response).toMatchObject({ status: "invalid_output", source: "deterministic" });
    expect(response.notice).toMatch(/C99/);
    expect(response.answer).toContain("3 of 10 clients are at risk");
  });

  it("rejects answers with numbers that the engine did not produce", async () => {
    const response = await answerQuestion(
      AT_RISK,
      result,
      withModel(JSON.stringify({ answer: "C02 is 12 t short.", evidence_ids: ["C02"] })),
    );
    expect(response.status).toBe("invalid_output");
    expect(response.notice).toMatch(/numbers not present/);
  });

  it("rejects non-JSON output", async () => {
    const response = await answerQuestion(AT_RISK, result, withModel("Sure! C02 is short."));
    expect(response).toMatchObject({ status: "invalid_output", source: "deterministic" });
  });

  it("deterministic summaries only use numbers and IDs present in the facts", () => {
    for (const topic of Object.keys(SUPPORTED_QUESTIONS) as Topic[]) {
      const det = deterministicAnswer(topic, result);
      const check = validateModelOutput(JSON.stringify({ answer: det.answer, evidence_ids: det.evidenceIds }), buildContext(topic, result));
      expect(check, topic).toMatchObject({ ok: true });
    }
  });
});

describe("assistant honesty and boundaries", () => {
  it("answers greetings briefly and kindly, without calling a model or saying unavailable", async () => {
    const deps = withModel("{}");
    for (const greeting of ["hello", "Hi!", "thanks", "what can you do?"]) {
      const response = await answerQuestion(greeting, result, deps);
      expect(response).toMatchObject({ status: "unsupported", source: "none", notice: null, evidenceIds: [] });
      expect(response.answer).not.toMatch(/unavailable/);
    }
    expect(deps.complete).not.toHaveBeenCalled();
  });

  it("answers unsupported questions as unavailable without calling a model", async () => {
    const deps = withModel("{}");
    const response = await answerQuestion("What will the weather be tomorrow?", result, deps);
    expect(response).toMatchObject({ status: "unsupported", source: "none", evidenceIds: [] });
    expect(response.answer).toMatch(/unavailable/);
    expect(deps.complete).not.toHaveBeenCalled();
  });

  it("refuses to approve or change the plan", async () => {
    const deps = withModel("{}");
    const response = await answerQuestion("Approve the plan and send it to C02", result, deps);
    expect(response.status).toBe("unsupported");
    expect(deps.complete).not.toHaveBeenCalled();
  });

  it("is honest when no provider is configured", async () => {
    const response = await answerQuestion(SUPPORTED_QUESTIONS.local_residual, result, noModel);
    expect(response).toMatchObject({ status: "no_provider", source: "deterministic", provider: null });
    expect(response.notice).toMatch(/no AI model was used/);
    expect(response.answer).toContain("60 t go to the local market");
    expect(response.answer).toContain("EUR 4,500");
    expect(response.evidenceIds).toEqual(expect.arrayContaining(["D", "F15", "F16", "F19", "F20", "C08"]));
  });

  it("reports provider failure and timeout instead of faking an answer", async () => {
    const failed = await answerQuestion(AT_RISK, result, withModel(() => Promise.reject(new Error("HTTP 500"))));
    expect(failed).toMatchObject({ status: "provider_error", source: "deterministic" });
    expect(failed.notice).toMatch(/HTTP 500/);

    const slow = await answerQuestion(AT_RISK, result, withModel(() => new Promise<string>(() => {})));
    expect(slow).toMatchObject({ status: "timeout", source: "deterministic" });
  });

  it("routes the three required questions to their topics", () => {
    expect(classify("Which clients are at risk and why?")).toBe("at_risk");
    expect(classify("Which farm/segment gaps matter most today?")).toBe("farm_gaps");
    expect(classify("Why are 60 t going local and what is their estimated value?")).toBe("local_residual");
  });
});
