/**
 * Optional language-model providers, configured only through environment variables.
 *  - anthropic:          Claude via the official SDK (needs LLM_API_KEY or ANTHROPIC_API_KEY)
 *  - openai-compatible:  any /chat/completions endpoint, e.g. a free local Ollama model
 * The model only rephrases supplied facts; it never sees the workbook or plans anything.
 */
import Anthropic from "@anthropic-ai/sdk";

export interface ProviderConfig {
  provider: "anthropic" | "openai-compatible";
  model: string;
  apiKey: string | null;
  baseUrl: string | null;
  timeoutMs: number;
}

/** Sends a system + user prompt and returns the raw text reply. */
export type Complete = (system: string, user: string, signal: AbortSignal) => Promise<string>;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5-5";
const DEFAULT_OLLAMA_URL = "http://localhost:11434/v1";
/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
const FALLBACK_CAPABLE = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

export function readProviderConfig(env: NodeJS.ProcessEnv = process.env): { config: ProviderConfig | null; problem: string | null } {
  const provider = env.LLM_PROVIDER?.trim();
  if (!provider) return { config: null, problem: null };
  const timeoutMs = Number(env.LLM_TIMEOUT_MS) > 0 ? Number(env.LLM_TIMEOUT_MS) : DEFAULT_TIMEOUT_MS;

  if (provider === "anthropic") {
    const apiKey = env.LLM_API_KEY || env.ANTHROPIC_API_KEY || null;
    if (!apiKey) return { config: null, problem: "LLM_PROVIDER=anthropic but no LLM_API_KEY is set" };
    return { config: { provider, model: env.LLM_MODEL || DEFAULT_ANTHROPIC_MODEL, apiKey, baseUrl: null, timeoutMs }, problem: null };
  }
  if (provider === "openai-compatible") {
    if (!env.LLM_MODEL) return { config: null, problem: "LLM_PROVIDER=openai-compatible but LLM_MODEL is not set" };
    return {
      config: { provider, model: env.LLM_MODEL, apiKey: env.LLM_API_KEY || null, baseUrl: env.LLM_BASE_URL || DEFAULT_OLLAMA_URL, timeoutMs },
      problem: null,
    };
  }
  return { config: null, problem: `unknown LLM_PROVIDER '${provider}' (use anthropic or openai-compatible)` };
}

export function createCompleter(config: ProviderConfig): Complete {
  return config.provider === "anthropic" ? anthropicCompleter(config) : openAiCompatibleCompleter(config);
}

function anthropicCompleter(config: ProviderConfig): Complete {
  const client = new Anthropic({ apiKey: config.apiKey!, maxRetries: 0, timeout: config.timeoutMs });
  const isHaiku = config.model.startsWith("claude-haiku");
  return async (system, user, signal) => {
    const response = await client.beta.messages.create(
      {
        model: config.model,
        max_tokens: 4000,
        system,
        messages: [{ role: "user", content: user }],
        // Short explanation of supplied facts: low effort is enough (Haiku has no effort control).
        ...(isHaiku ? {} : { output_config: { effort: "low" as const } }),
        ...(FALLBACK_CAPABLE.has(config.model) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      },
      { signal },
    );
    if (response.stop_reason === "refusal") throw new Error("the model declined the request");
    const text = response.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
    if (!text) throw new Error("the model returned no text");
    return text;
  };
}

function openAiCompatibleCompleter(config: ProviderConfig): Complete {
  return async (system, user, signal) => {
    const response = await fetch(`${config.baseUrl!.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal,
    });
    if (!response.ok) throw new Error(`provider returned HTTP ${response.status}`);
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content;
    if (!text) throw new Error("the provider returned no text");
    return text;
  };
}
