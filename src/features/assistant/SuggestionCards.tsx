"use client";

/** The three questions the assistant is built for, shown as cards before the first question. */
import { Layers, Store, Users, type LucideIcon } from "lucide-react";

interface Suggestion {
  icon: LucideIcon;
  question: string;
}

interface SuggestionCardsProps {
  localTonnesLabel: string;
  disabled: boolean;
  onAsk: (question: string) => void;
}

export function SuggestionCards({ localTonnesLabel, disabled, onAsk }: SuggestionCardsProps) {
  const suggestions: Suggestion[] = [
    { icon: Users, question: "Which clients are at risk and why?" },
    { icon: Layers, question: "Which farm/segment gaps matter most today?" },
    { icon: Store, question: `Why are ${localTonnesLabel} going local and what is their estimated value?` },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {suggestions.map(({ icon: SuggestionIcon, question }) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onAsk(question)}
          className="flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40 disabled:opacity-50"
        >
          <SuggestionIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{question}</span>
        </button>
      ))}
    </div>
  );
}
