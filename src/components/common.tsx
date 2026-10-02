"use client";

import { createContext, useContext } from "react";
import type { ClientStatus, Segment, ShortageReason } from "@/lib/domain/types";
import { fmtNumber, reasonLabel } from "@/lib/format";

export interface TraceFilter {
  clientId?: string;
  farmId?: string;
  segment?: Segment;
}

interface TraceContextValue {
  /** Open the Allocations view filtered to this ID. */
  trace: (filter: TraceFilter) => void;
  farmIds: Set<string>;
  clientIds: Set<string>;
}

export const TraceContext = createContext<TraceContextValue>({
  trace: () => {},
  farmIds: new Set(),
  clientIds: new Set(),
});

const SEGMENT_LABELS = new Set(["A", "B", "C", "D"]);

/** A farm/client/segment ID rendered as a button that traces it to its allocations. */
export function IdLink({ id }: { id: string }) {
  const { trace, farmIds, clientIds } = useContext(TraceContext);
  const kind = clientIds.has(id) ? "client" : farmIds.has(id) ? "farm" : SEGMENT_LABELS.has(id) ? "segment" : null;
  if (!kind) return <span className="id">{id}</span>;
  const filter: TraceFilter =
    kind === "client" ? { clientId: id } : kind === "farm" ? { farmId: id } : { segment: id as Segment };
  const label = kind === "segment" ? `Segment ${id}` : id;
  return (
    <button type="button" className={`id ${kind}`} onClick={() => trace(filter)} title={`Show allocations for ${label}`}>
      {kind === "segment" ? `Seg ${id}` : id}
    </button>
  );
}

export function IdChips({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="chips" aria-label="Evidence">
      {ids.map((id) => (
        <IdLink key={id} id={id} />
      ))}
    </div>
  );
}

const STATUS_ICON: Record<ClientStatus, string> = { COMPLETE: "✓", PARTIAL: "◐", UNSERVED: "✕" };

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`status ${status}`}>
      <span aria-hidden="true">{STATUS_ICON[status]}</span>
      {status}
    </span>
  );
}

export function Reason({ reason }: { reason: ShortageReason | null }) {
  if (!reason) return <span className="muted">—</span>;
  return (
    <div>
      <div className={`reason ${reason}`}>{reason}</div>
      <div className="small muted">{reasonLabel(reason)}</div>
    </div>
  );
}

/** Signed plan-vs-actual variance with an arrow, so meaning does not rely on colour. */
export function Variance({ value, unit = "t" }: { value: number; unit?: string }) {
  if (Math.abs(value) < 0.005) {
    return (
      <span className="var zero" aria-label="on plan">
        ± 0
      </span>
    );
  }
  const below = value < 0;
  return (
    <span className={`var ${below ? "neg" : "pos"}`} aria-label={`${fmtNumber(Math.abs(value))} ${unit} ${below ? "below" : "above"} plan`}>
      {below ? "▼" : "▲"} {value > 0 ? "+" : ""}
      {fmtNumber(value)}
    </span>
  );
}
