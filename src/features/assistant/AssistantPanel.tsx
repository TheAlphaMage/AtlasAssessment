"use client";

/**
 * Planning assistant: asks the server to explain the computed plan. Read-only.
 * Three suggested questions cover the required topics; free text works too.
 */
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";
import { AnswerCard } from "./AnswerCard";
import styles from "./AssistantPanel.module.css";
import { ProviderNotice } from "./ProviderNotice";
import { useAssistant } from "./useAssistant";

interface AssistantPanelProps {
  result: PlanResult;
}

export function AssistantPanel({ result }: AssistantPanelProps) {
  const { provider, exchanges, isBusy, ask } = useAssistant();
  const [draft, setDraft] = useState("");

  const suggestions = [
    "Which clients are at risk and why?",
    "Which farm/segment gaps matter most today?",
    `Why are ${fmtT(result.kpis.localT)} going local and what is their estimated value?`,
  ];

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
    setDraft("");
  }

  return (
    <div className={styles.layout}>
      <Card label="Ask the planning assistant">
        <SectionHeader title="Planning assistant" hint="Ask about the plan. Every answer cites the IDs it relies on. Click an ID to trace it." />
        <div className={styles.controls}>
          <ProviderNotice provider={provider} />

          <div className={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" className={styles.suggestion} onClick={() => void ask(suggestion)} disabled={isBusy}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={onSubmit}>
            <label htmlFor="assistant-question" className="sr-only">
              Ask about the plan
            </label>
            <input
              id="assistant-question"
              data-hotkey-focus
              className={styles.input}
              type="text"
              value={draft}
              maxLength={500}
              placeholder="e.g. Why is C08 short?"
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button variant="primary" icon="send" type="submit" disabled={isBusy || !draft.trim()}>
              Ask
            </Button>
          </form>
        </div>
      </Card>

      <section className={styles.thread} aria-live="polite" aria-label="Answers">
        {exchanges.length === 0 && (
          <p className={styles.empty}>Pick a suggested question or ask your own. Answers appear here, newest first.</p>
        )}
        {exchanges.map((exchange) => (
          <AnswerCard key={exchange.id} exchange={exchange} />
        ))}
      </section>
    </div>
  );
}
