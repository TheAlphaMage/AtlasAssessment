/** Builds and filters the entries of the Ctrl/Cmd+K quick-jump palette. Pure functions, covered by tests. */
import { SEGMENTS } from "@/lib/domain/constants";
import type { PlanResult } from "@/lib/domain/types";
import type { Selection } from "@/features/trace";
import { VIEWS, type ViewId } from "./views";

/** What happens when a palette entry is chosen: open a view, or trace an ID in Allocations. */
export type PaletteAction = { type: "view"; view: ViewId } | { type: "trace"; selection: Selection };

export interface PaletteItem {
  id: string;
  group: "View" | "Client" | "Farm" | "Segment";
  label: string;
  hint: string;
  action: PaletteAction;
}

/** Lists everything the user can jump to: the five views, every client, farm and segment. */
export function buildPaletteItems(result: PlanResult): PaletteItem[] {
  const viewItems: PaletteItem[] = VIEWS.map((view, index) => ({
    id: `view-${view.id}`,
    group: "View",
    label: view.label,
    hint: `Step ${index + 1} · ${view.step}`,
    action: { type: "view", view: view.id },
  }));

  const clientItems: PaletteItem[] = result.clients.map((client) => ({
    id: `client-${client.clientId}`,
    group: "Client",
    label: client.clientId,
    hint: `${client.clientName} · ${client.acceptanceMode} ${client.requestedSegment} · ${client.status.toLowerCase()}`,
    action: { type: "trace", selection: { clientId: client.clientId } },
  }));

  const farmItems: PaletteItem[] = result.farms.map((farm) => ({
    id: `farm-${farm.farmId}`,
    group: "Farm",
    label: farm.farmId,
    hint: farm.farmName,
    action: { type: "trace", selection: { farmId: farm.farmId } },
  }));

  const segmentItems: PaletteItem[] = SEGMENTS.map((segment) => ({
    id: `segment-${segment}`,
    group: "Segment",
    label: `Segment ${segment}`,
    hint: "Allocations from this quality segment",
    action: { type: "trace", selection: { segment } },
  }));

  return [...viewItems, ...clientItems, ...farmItems, ...segmentItems];
}

/** Keeps the items whose label or hint contains the typed text (case-insensitive). */
export function filterPaletteItems(items: PaletteItem[], query: string): PaletteItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(needle));
}
