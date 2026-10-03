"use client";

/**
 * The single right-side drawer of the app. It shows whatever ?open= names in the URL
 * (a client, farm or segment) and keeps the last content while it slides closed.
 */
import { useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { parseEntityParam, type Entity } from "@/features/entities/parseEntityParam";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";
import { usePlan } from "@/features/plan/PlanProvider";
import type { PlanResult } from "@/lib/domain/types";
import { ClientDrawer } from "./ClientDrawer";
import { FarmDrawer } from "./FarmDrawer";
import { SegmentDrawer } from "./SegmentDrawer";

export function EntityDrawerHost() {
  const { data } = usePlan();
  const { openId, closeEntity } = useEntityDrawer();
  const entity = data ? parseEntityParam(openId, data.result) : null;

  // Keep showing the last entity during the closing animation, so the drawer does not go blank.
  const lastEntity = useRef<Entity | null>(null);
  if (entity) lastEntity.current = entity;
  const shown = entity ?? lastEntity.current;

  return (
    <Sheet open={entity !== null} onOpenChange={(isOpen) => !isOpen && closeEntity()}>
      <SheetContent
        className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl"
        // Focus the panel itself so no link inside starts highlighted; Tab then moves through the content.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
        {shown && data && <DrawerBody entity={shown} result={data.result} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ entity, result }: { entity: Entity; result: PlanResult }) {
  if (entity.kind === "client") {
    const client = result.clients.find((candidate) => candidate.clientId === entity.id)!;
    return <ClientDrawer client={client} result={result} />;
  }
  if (entity.kind === "farm") {
    const farm = result.farms.find((candidate) => candidate.farmId === entity.id)!;
    return <FarmDrawer farm={farm} result={result} />;
  }
  return <SegmentDrawer segment={entity.id} result={result} />;
}
