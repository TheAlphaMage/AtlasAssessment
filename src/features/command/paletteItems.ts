/** Builds the entries of the ⌘K command menu: every page, client, farm and segment. Pure, covered by tests. */
import { SEGMENTS } from "@/lib/domain/constants";
import type { PlanResult } from "@/lib/domain/types";
import { ROUTES } from "@/features/navigation/routes";

/** Choosing an entry either goes to a page or opens a detail drawer. */
export type PaletteAction = { type: "navigate"; href: string } | { type: "open"; id: string };

export const PALETTE_GROUPS = ["Pages", "Clients", "Farms", "Segments"] as const;

export interface PaletteItem {
  key: string;
  group: (typeof PALETTE_GROUPS)[number];
  label: string;
  hint: string;
  action: PaletteAction;
}

export function buildPaletteItems(result: PlanResult): PaletteItem[] {
  const pages: PaletteItem[] = ROUTES.map((route) => ({
    key: `page-${route.href}`,
    group: "Pages",
    label: route.title,
    hint: route.group,
    action: { type: "navigate", href: route.href },
  }));

  const clients: PaletteItem[] = result.clients.map((client) => ({
    key: `client-${client.clientId}`,
    group: "Clients",
    label: client.clientId,
    hint: `${client.clientName} · ${client.acceptanceMode} ${client.requestedSegment} · ${client.status.toLowerCase()}`,
    action: { type: "open", id: client.clientId },
  }));

  const farms: PaletteItem[] = result.farms.map((farm) => ({
    key: `farm-${farm.farmId}`,
    group: "Farms",
    label: farm.farmId,
    hint: farm.farmName,
    action: { type: "open", id: farm.farmId },
  }));

  const segments: PaletteItem[] = SEGMENTS.map((segment) => ({
    key: `segment-${segment}`,
    group: "Segments",
    label: `Segment ${segment}`,
    hint: "Quality segment",
    action: { type: "open", id: segment },
  }));

  return [...pages, ...clients, ...farms, ...segments];
}
