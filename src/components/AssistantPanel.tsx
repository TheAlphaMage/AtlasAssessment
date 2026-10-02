"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ApiError, AssistantProviderStatus, AssistantResponse, PlanResult } from "@/lib/domain/types";
import { fmtT } from "@/lib/format";
import { IdChips } from "./common";

interface Exchange {
  id: number;
  question: string;
  response: AssistantResponse | null;
  error: string | null;
}

const SOURCE_LABEL: Record<AssistantResponse["source"], string> = {
  llm: "AI explanation",
  deterministic: "Deterministic summary — no AI",
  none: "Not answered",
};

export function AssistantPanel({ result }: { result: PlanResult }) {
  const [provider, setProvider] = useState<AssistantProviderStatus | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => (r.ok ? (r.json() as Promise<AssistantProviderStatus>) : null))
      .then(setProvider)
      .catch(() => setProvider(null));
  }, []);

  const presets = [
    "Which clients are at risk and why?",
    "Which farm/segment gaps matter most today?",
    `Why are ${fmtT(result.kpis.localT)} going local and what is their estimated value?`,
  ];

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    const id = Date.now();
    setBusy(true);
    setExchanges((list) => [{ id, question, response: null, error: null }, ...list]);
    let response: AssistantResponse | null = null;
    let error: string | null = null;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const body = (await res.json().catch(() => null)) as AssistantResponse | ApiError | null;
      if (res.ok && body && "status" in body) response = body;
      else error = (body as ApiError | null)?.message ?? `The assistant service failed (HTTP ${res.status}).`;
    } catch {
      error = "The assistant could not be reached. The plan above is unaffected; try again.";
    }
    setExchanges((list) => list.map((x) => (x.id === id ? { ...x, response, error } : x)));
    setBusy(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
    setDraft("");
  }

  return (
    <div className="assistant">
      <section className="card" aria-label="Ask the planning assistant">
        <div className="card-head">
          <h2>Planning assistant</h2>
        </div>
        <div className="card-body" style={{ display: "grid", gap: 12 }}>
          <p className="provider-line">
            {provider === null
              ? "Checking assistant configuration…"
              : provider.configured
                ? `AI provider: ${provider.provider} · ${provider.model}. The model only rephrases figures computed by the planning engine; answers are checked for unknown IDs and numbers.`
                : "No AI provider configured. Answers are deterministic summaries generated from the computed plan — no AI model is used."}
          </p>
          <p className="small muted">
            Read-only: explains the computed plan with evidence IDs. It cannot change allocations, approve the plan or contact
            anyone.
          </p>
          <div className="presets">
            {presets.map((q) => (
              <button key={q} type="button" className="preset" onClick={() => void ask(q)} disabled={busy}>
                {q}
              </button>
            ))}
          </div>
          <form className="ask-form" onSubmit={onSubmit}>
            <label htmlFor="ask" className="sr-only">
              Ask about the plan
            </label>
            <input
              id="ask"
              type="text"
              value={draft}
              maxLength={500}
              placeholder="e.g. Why is C08 short?"
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn primary" disabled={busy || !draft.trim()}>
              Ask
            </button>
          </form>
        </div>
      </section>

      <section className="answers" aria-live="polite" aria-label="Answers">
        {exchanges.length === 0 && (
          <div className="card answer">
            <p className="muted">Pick a suggested question or ask your own. Every answer cites the farm, client and segment IDs it relies on — click an ID to trace it.</p>
          </div>
        )}
        {exchanges.map((x) => (
          <article key={x.id} className="card answer">
            <div className="answer-q">Q: {x.question}</div>
            {!x.response && !x.error && <div className="skeleton" style={{ width: "60%" }} aria-label="Waiting for answer" />}
            {x.error && (
              <p className="notice warn" role="alert">
                {x.error}
              </p>
            )}
            {x.response && (
              <>
                <div className="chips">
                  <span className={`source ${x.response.source}`}>
                    {SOURCE_LABEL[x.response.source]}
                    {x.response.source === "llm" && x.response.model ? ` · ${x.response.model}` : ""}
                  </span>
                </div>
                {x.response.notice && (
                  <p className={`notice ${["timeout", "provider_error", "invalid_output"].includes(x.response.status) ? "warn" : ""}`}>
                    {x.response.notice}
                  </p>
                )}
                <p className="answer-text">{x.response.answer}</p>
                {x.response.evidenceIds.length > 0 && (
                  <div className="chips">
                    <span className="small muted">Evidence:</span>
                    <IdChips ids={x.response.evidenceIds} />
                  </div>
                )}
              </>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
