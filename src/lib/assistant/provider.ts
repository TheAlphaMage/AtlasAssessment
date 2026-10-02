/**
 * Optional language-model providers, configured only through environment variables.
 *  - deepseek:           DeepSeek's hosted API (needs DEEPSEEK_API_KEY or LLM_API_KEY)
 *  - openai-compatible:  any /chat/completions endpoint, e.g. a free local Ollama model
 * Both speak the OpenAI chat-completions format, so one HTTP completer serves them.
 * The model only rephrases supplied facts; it never sees the workbook or plans anything.
 */

export interface ProviderConfig {
  provider: "deepseek" | "openai-compatible";
  model: string;
  apiKey: string | null;
  baseUrl: string | null;
  timeoutMs: number;
}

/** Sends a system + user prompt and returns the raw text reply. */
export type Complete = (system: string, user: string, signal: AbortSignal) => Promise<string>;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_DEEPSEEK_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-flash";
const DEFAULT_OLLAMA_URL = "http://localhost:11434/v1";
/** Answers are at most ~120 words; this leaves room for the JSON wrapper and evidence IDs. */
const MAX_OUTPUT_TOKENS = 1000;

/** Environment variables as plain text values. `process.env` fits this type, and so do small objects in tests. */
type Env = Record<string, string | undefined>;

export function readProviderConfig(env: Env = process.env): { config: ProviderConfig | null; problem: string | null } {
  // A DeepSeek key on its own is enough to switch DeepSeek on. LLM_PROVIDER stays available to choose explicitly.
  const provider = env.LLM_PROVIDER?.trim() || (env.DEEPSEEK_API_KEY ? "deepseek" : "");
  if (!provider) return { config: null, problem: null };
  const timeoutMs = Number(env.LLM_TIMEOUT_MS) > 0 ? Number(env.LLM_TIMEOUT_MS) : DEFAULT_TIMEOUT_MS;

  if (provider === "deepseek") {
    const apiKey = env.LLM_API_KEY || env.DEEPSEEK_API_KEY || null;
    if (!apiKey) return { config: null, problem: "LLM_PROVIDER=deepseek but no DEEPSEEK_API_KEY is set" };
    return {
      config: {
        provider,
        model: env.LLM_MODEL || DEFAULT_DEEPSEEK_MODEL,
        apiKey,
        baseUrl: env.LLM_BASE_URL || DEFAULT_DEEPSEEK_URL,
        timeoutMs,
      },
      problem: null,
    };
  }
  if (provider === "openai-compatible") {
    if (!env.LLM_MODEL) return { config: null, problem: "LLM_PROVIDER=openai-compatible but LLM_MODEL is not set" };
    return {
      config: { provider, model: env.LLM_MODEL, apiKey: env.LLM_API_KEY || null, baseUrl: env.LLM_BASE_URL || DEFAULT_OLLAMA_URL, timeoutMs },
      problem: null,
    };
  }
  return { config: null, problem: `unknown LLM_PROVIDER '${provider}' (use deepseek or openai-compatible)` };
}

export function createCompleter(config: ProviderConfig): Complete {
  return async (system, user, signal) => {
    const response = await fetch(`${config.baseUrl!.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify(buildRequestBody(config, system, user)),
      signal,
    });
    if (!response.ok) throw new Error(`provider returned HTTP ${response.status}`);
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content;
    if (!text) throw new Error("the provider returned no text");
    return text;
  };
}

/** The request is the same for every provider, plus a few DeepSeek-specific fields. */
export function buildRequestBody(config: ProviderConfig, system: string, user: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: config.model,
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  if (config.provider === "deepseek") {
    // JSON mode makes the {answer, evidence_ids} reply reliable.
    body.response_format = { type: "json_object" };
    body.max_tokens = MAX_OUTPUT_TOKENS;
    // DeepSeek reasons by default, which is slow and unnecessary for a short explanation of given facts.
    body.thinking = { type: "disabled" };
  }
  return body;
}
