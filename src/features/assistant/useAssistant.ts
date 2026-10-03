"use client";

/** Talks to the assistant API and keeps the chat history for this visit. */

import { useEffect, useState } from "react";
import type { ApiError, AssistantProviderStatus, AssistantResponse } from "@/lib/domain/types";

/** One question and what came back: an answer, an error, or nothing yet (still waiting). */
export interface Exchange {
  id: number;
  question: string;
  response: AssistantResponse | null;
  error: string | null;
}

/**
 * Talks to the assistant API: reads which AI provider is configured and sends questions.
 * Exchanges are kept oldest first, like a chat.
 */
export function useAssistant() {
  const [provider, setProvider] = useState<AssistantProviderStatus | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    fetch("/api/assistant")
      .then((response) => (response.ok ? (response.json() as Promise<AssistantProviderStatus>) : null))
      .then(setProvider)
      .catch(() => setProvider(null));
  }, []);

  async function ask(question: string) {
    if (!question.trim() || isBusy) return;

    const id = Date.now();
    setIsBusy(true);
    setExchanges((list) => [...list, { id, question, response: null, error: null }]);

    const { response, error } = await sendQuestion(question);
    setExchanges((list) => list.map((exchange) => (exchange.id === id ? { ...exchange, response, error } : exchange)));
    setIsBusy(false);
  }

  return { provider, exchanges, isBusy, ask };
}

async function sendQuestion(question: string): Promise<{ response: AssistantResponse | null; error: string | null }> {
  try {
    const httpResponse = await fetch("/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const body = (await httpResponse.json().catch(() => null)) as AssistantResponse | ApiError | null;

    if (httpResponse.ok && body && "status" in body) return { response: body, error: null };
    const message = (body as ApiError | null)?.message ?? `The assistant service failed (HTTP ${httpResponse.status}).`;
    return { response: null, error: message };
  } catch {
    return { response: null, error: "The assistant could not be reached. The plan is unaffected; try again." };
  }
}
