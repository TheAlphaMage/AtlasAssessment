/** Says honestly which kind of answer to expect: real AI model, or deterministic summary with no AI. */
import { Icon } from "@/components/ui/Icon";
import type { AssistantProviderStatus } from "@/lib/domain/types";
import styles from "./ProviderNotice.module.css";

interface ProviderNoticeProps {
  provider: AssistantProviderStatus | null;
}

function describe(provider: AssistantProviderStatus | null): string {
  if (provider === null) return "Checking assistant configuration…";
  if (!provider.configured) {
    return "No AI provider is configured. Answers are deterministic summaries generated from the computed plan. No AI model is used.";
  }
  return `AI provider: ${provider.provider} · ${provider.model}. The model only rephrases figures computed by the planning engine, and answers are checked for unknown IDs and numbers.`;
}

export function ProviderNotice({ provider }: ProviderNoticeProps) {
  return (
    <div className={styles.notice}>
      <p className={styles.provider}>{describe(provider)}</p>
      <p className={styles.readOnly}>
        <Icon name="lock" size={14} /> Read-only: it explains the plan with evidence IDs. It cannot change allocations, approve
        the plan or contact anyone.
      </p>
    </div>
  );
}
