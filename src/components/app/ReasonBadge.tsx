"use client";

/** The shortage reason as a short label. Hover or focus shows the engine's exact code and an explanation. */
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { reasonLabel } from "@/lib/format";
import type { ShortageReason } from "@/lib/domain/types";
import { REASON_LABEL } from "./reasons";

export function ReasonBadge({ reason }: { reason: ShortageReason | null }) {
  if (!reason) return <span className="text-muted-foreground">—</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="cursor-help text-sm underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">
          {REASON_LABEL[reason]}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-mono text-[11px]">{reason}</p>
        <p className="mt-1">{reasonLabel(reason)}</p>
      </TooltipContent>
    </Tooltip>
  );
}
