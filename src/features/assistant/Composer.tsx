"use client";

/** The question box at the bottom of the chat. Enter sends; "/" focuses it from anywhere on the page. */
import { useState, type FormEvent } from "react";
import { ArrowUp } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

/** The server rejects longer questions. */
const MAX_QUESTION_LENGTH = 500;

export function Composer({ disabled, onAsk }: { disabled: boolean; onAsk: (question: string) => void }) {
  const [draft, setDraft] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    onAsk(draft);
    setDraft("");
  }

  return (
    <form onSubmit={onSubmit}>
      {/* The send button is disabled while empty; keep the box itself looking active. */}
      <InputGroup className="h-11 rounded-xl bg-background has-disabled:bg-background has-disabled:opacity-100">
        <InputGroupInput
          data-hotkey-focus
          aria-label="Ask about the plan"
          placeholder="Ask about the plan, e.g. Why is C08 short?"
          maxLength={MAX_QUESTION_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" variant="default" size="icon-xs" className="rounded-full" disabled={disabled || !draft.trim()} aria-label="Send">
            <ArrowUp />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
