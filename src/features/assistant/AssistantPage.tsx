"use client";

/**
 * Assistant: a chat that explains the computed plan. It is read-only and cites the IDs it relies on.
 * Without an AI key it answers with clearly labelled deterministic summaries.
 */
import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { fmtT } from "@/lib/format";
import type { AssistantProviderStatus } from "@/lib/domain/types";
import { ChatMessage } from "./ChatMessage";
import { Composer } from "./Composer";
import { SuggestionCards } from "./SuggestionCards";
import { useAssistant } from "./useAssistant";

export function AssistantPage() {
  const { result } = useReadyPlan();
  const { provider, exchanges, isBusy, ask } = useAssistant();
  const endOfChat = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    endOfChat.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges]);

  return (
    <>
      <PageHeader
        title="Assistant"
        info="Explains the computed plan. Read-only: it cannot change allocations or contact anyone."
        actions={<ProviderBadge provider={provider} />}
      />
      <Card className="flex h-[calc(100vh-15rem)] min-h-[28rem] flex-col gap-0 py-0">
        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          {exchanges.length === 0 && (
            <div className="mx-auto max-w-3xl pt-6">
              <p className="mb-4 font-medium">Ask about today&apos;s plan</p>
              <SuggestionCards localTonnesLabel={fmtT(result.kpis.localT)} disabled={isBusy} onAsk={ask} />
            </div>
          )}
          <div className="mx-auto max-w-3xl space-y-8">
            {exchanges.map((exchange) => (
              <ChatMessage key={exchange.id} exchange={exchange} onAsk={ask} />
            ))}
          </div>
          <div ref={endOfChat} />
        </div>
        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl">
            <Composer disabled={isBusy} onAsk={ask} />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> Read-only · figures come from the planning engine
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

function ProviderBadge({ provider }: { provider: AssistantProviderStatus | null }) {
  if (provider === null) return <Badge variant="secondary" className="rounded-md">Checking AI setup…</Badge>;
  if (!provider.configured) return <Badge variant="secondary" className="rounded-md">No AI key · deterministic answers</Badge>;
  return (
    <Badge variant="outline" className="gap-1.5 rounded-md text-muted-foreground">
      <span className="size-1.5 rounded-full bg-success" /> {provider.provider} · {provider.model}
    </Badge>
  );
}
