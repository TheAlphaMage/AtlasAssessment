"use client";

/** Previous / next buttons in a drawer footer. The ← and → keys do the same. */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useArrowKeys } from "@/hooks/useArrowKeys";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";

interface StepButtonsProps {
  /** IDs in display order, e.g. all client IDs by priority. */
  ids: string[];
  currentId: string;
}

export function StepButtons({ ids, currentId }: StepButtonsProps) {
  const { switchEntity } = useEntityDrawer();
  const index = ids.indexOf(currentId);
  const previousId = ids[(index - 1 + ids.length) % ids.length];
  const nextId = ids[(index + 1) % ids.length];

  useArrowKeys(
    () => switchEntity(previousId),
    () => switchEntity(nextId),
  );

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={() => switchEntity(previousId)} aria-label={`Previous: ${previousId}`}>
        <ChevronLeft />
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {index + 1} / {ids.length}
      </span>
      <Button variant="ghost" size="icon-sm" onClick={() => switchEntity(nextId)} aria-label={`Next: ${nextId}`}>
        <ChevronRight />
      </Button>
    </div>
  );
}
