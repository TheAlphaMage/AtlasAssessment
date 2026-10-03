"use client";

/** One question (right, as a bubble) and its answer (left): source badge, any notice, the text and its evidence IDs. */
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityLink } from "@/features/entities/EntityLink";
import type { AssistantResponse } from "@/lib/domain/types";
import type { Exchange } from "./useAssistant";

const SOURCE_LABEL: Record<"llm" | "deterministic", string> = {
  llm: "AI",
  deterministic: "Summary · no AI",
};

/** Short labels for the follow-up chips shown under a reply the assistant could not answer. */
const FOLLOW_UPS = [
  { label: "Clients at risk", question: "Which clients are at risk and why?" },
  { label: "Segment gaps", question: "Which farm/segment gaps matter most today?" },
  { label: "Local market", question: "Why is fruit going to the local market and what is its estimated value?" },
];

/** Statuses where something went wrong, so the notice is shown as a warning. */
const WARNING_STATUSES: AssistantResponse["status"][] = ["timeout", "provider_error", "invalid_output"];

interface ChatMessageProps {
  exchange: Exchange;
  onAsk: (question: string) => void;
}

export function ChatMessage({ exchange, onAsk }: ChatMessageProps) {
  const { question, response, error } = exchange;
  const isWaiting = !response && !error;

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1">
      <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-primary-foreground">{question}</p>

      <div className="flex gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
          <Sparkles className="size-3.5 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          {isWaiting && (
            <div className="space-y-2" aria-label="Waiting for the answer">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {error && <p className="rounded-md bg-warning-soft px-3 py-2 text-warning" role="alert">{error}</p>}
          {response && (
            <>
              {response.source !== "none" && (
                <Badge variant="secondary" className="rounded-md text-muted-foreground">
                  {SOURCE_LABEL[response.source]}
                </Badge>
              )}
              {response.notice && WARNING_STATUSES.includes(response.status) && <p className="text-xs text-warning">{response.notice}</p>}
              <p className="leading-relaxed whitespace-pre-line">{response.answer}</p>
              {response.evidenceIds.length > 0 && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  Evidence
                  {response.evidenceIds.map((id) => (
                    <EntityLink key={id} id={id} className="text-sm text-foreground" />
                  ))}
                </p>
              )}
              {response.status === "unsupported" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {FOLLOW_UPS.map((followUp) => (
                    <Button key={followUp.label} variant="outline" size="xs" className="rounded-full" onClick={() => onAsk(followUp.question)}>
                      {followUp.label}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
