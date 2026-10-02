"use client";

/** One question with its answer: source badge, any notice, the text, and the evidence IDs it relies on. */
import { Pill } from "@/components/ui/Pill";
import { classNames } from "@/components/ui/classNames";
import { IdChips } from "@/features/trace";
import type { AssistantResponse } from "@/lib/domain/types";
import styles from "./AnswerCard.module.css";
import type { Exchange } from "./useAssistant";

const SOURCE_LABEL: Record<AssistantResponse["source"], string> = {
  llm: "AI explanation",
  deterministic: "Deterministic summary, no AI",
  none: "Not answered",
};

/** Statuses where something went wrong and the notice should look like a warning. */
const WARNING_STATUSES: AssistantResponse["status"][] = ["timeout", "provider_error", "invalid_output"];

interface AnswerCardProps {
  exchange: Exchange;
}

export function AnswerCard({ exchange }: AnswerCardProps) {
  const { question, response, error } = exchange;

  return (
    <article className={styles.exchange}>
      <p className={styles.question}>{question}</p>

      <div className={styles.answer}>
        {!response && !error && <div className={styles.skeleton} aria-label="Waiting for answer" />}

        {error && (
          <p className={classNames(styles.notice, styles.warning)} role="alert">
            {error}
          </p>
        )}

        {response && (
          <>
            <Pill tone={response.source === "llm" ? "brand" : "neutral"}>
              {SOURCE_LABEL[response.source]}
              {response.source === "llm" && response.model ? ` · ${response.model}` : ""}
            </Pill>
            {response.notice && (
              <p className={classNames(styles.notice, WARNING_STATUSES.includes(response.status) && styles.warning)}>
                {response.notice}
              </p>
            )}
            <p className={styles.text}>{response.answer}</p>
            {response.evidenceIds.length > 0 && (
              <div className={styles.evidence}>
                <span className={styles.evidenceLabel}>Evidence</span>
                <IdChips ids={response.evidenceIds} />
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
