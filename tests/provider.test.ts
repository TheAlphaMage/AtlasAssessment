import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRequestBody, createCompleter, readProviderConfig, type ProviderConfig } from "@/lib/assistant/provider";

const DEEPSEEK: ProviderConfig = {
  provider: "deepseek",
  model: "deepseek-flash",
  apiKey: "test-key",
  baseUrl: "https://api.deepseek.com/",
  timeoutMs: 1000,
};

afterEach(() => vi.unstubAllGlobals());

describe("provider configuration", () => {
  it("is off when LLM_PROVIDER is not set", () => {
    expect(readProviderConfig({})).toEqual({ config: null, problem: null });
  });

  it("turns DeepSeek on when only DEEPSEEK_API_KEY is present", () => {
    expect(readProviderConfig({ DEEPSEEK_API_KEY: "k" }).config).toMatchObject({ provider: "deepseek", apiKey: "k" });
  });

  it("reads DeepSeek settings from DEEPSEEK_API_KEY with sensible defaults", () => {
    const { config, problem } = readProviderConfig({ LLM_PROVIDER: "deepseek", DEEPSEEK_API_KEY: "k" });
    expect(problem).toBeNull();
    expect(config).toMatchObject({ provider: "deepseek", model: "deepseek-flash", apiKey: "k", baseUrl: "https://api.deepseek.com" });
  });

  it("lets LLM_MODEL and LLM_API_KEY override the DeepSeek defaults", () => {
    const { config } = readProviderConfig({ LLM_PROVIDER: "deepseek", DEEPSEEK_API_KEY: "a", LLM_API_KEY: "b", LLM_MODEL: "deepseek-v4-pro" });
    expect(config).toMatchObject({ model: "deepseek-v4-pro", apiKey: "b" });
  });

  it("reports a missing key, a missing model and an unknown provider instead of guessing", () => {
    expect(readProviderConfig({ LLM_PROVIDER: "deepseek" }).problem).toMatch(/DEEPSEEK_API_KEY/);
    expect(readProviderConfig({ LLM_PROVIDER: "openai-compatible" }).problem).toMatch(/LLM_MODEL/);
    expect(readProviderConfig({ LLM_PROVIDER: "anthropic" }).problem).toMatch(/unknown LLM_PROVIDER/);
  });
});

describe("request building", () => {
  it("asks DeepSeek for JSON, bounded output and no reasoning phase", () => {
    const body = buildRequestBody(DEEPSEEK, "system text", "user text");
    expect(body).toMatchObject({
      model: "deepseek-flash",
      temperature: 0,
      response_format: { type: "json_object" },
      max_tokens: 1000,
      thinking: { type: "disabled" },
    });
    expect(body.messages).toEqual([
      { role: "system", content: "system text" },
      { role: "user", content: "user text" },
    ]);
  });

  it("keeps the generic OpenAI-compatible request free of DeepSeek-only fields", () => {
    const local: ProviderConfig = { provider: "openai-compatible", model: "llama3.1:8b", apiKey: null, baseUrl: "http://localhost:11434/v1", timeoutMs: 1000 };
    const body = buildRequestBody(local, "s", "u");
    expect(body).not.toHaveProperty("thinking");
    expect(body).not.toHaveProperty("response_format");
  });
});

describe("completer", () => {
  it("posts to /chat/completions with the bearer key and returns the message text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{"answer":"ok","evidence_ids":[]}' } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const text = await createCompleter(DEEPSEEK)("system", "user", new AbortController().signal);

    expect(text).toBe('{"answer":"ok","evidence_ids":[]}');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(init.headers.authorization).toBe("Bearer test-key");
  });

  it("throws on an HTTP error without leaking the key, and on an empty reply", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 401 })));
    await expect(createCompleter(DEEPSEEK)("s", "u", new AbortController().signal)).rejects.toThrow("provider returned HTTP 401");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [] }), { status: 200 })));
    await expect(createCompleter(DEEPSEEK)("s", "u", new AbortController().signal)).rejects.toThrow("returned no text");
  });
});
