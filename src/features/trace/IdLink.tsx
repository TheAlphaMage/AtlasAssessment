"use client";

/** A farm, client or segment ID shown as a button: hover to highlight, click to trace its allocations. */
import type { Segment } from "@/lib/domain/types";
import { SegmentTag } from "@/components/ui/SegmentTag";
import { classNames } from "@/components/ui/classNames";
import styles from "./IdLink.module.css";
import { useTrace, type Selection } from "./TraceContext";

const SEGMENT_LETTERS = ["A", "B", "C", "D"];

type IdKind = "client" | "farm" | "segment";

interface IdLinkProps {
  id: string;
}

export function IdLink({ id }: IdLinkProps) {
  const { traceTo, setHighlight, farmIds, clientIds } = useTrace();

  const kind = findKind(id, clientIds, farmIds);
  if (!kind) return <span className={classNames(styles.id, styles.plain)}>{id}</span>;

  const selection = selectionFor(kind, id);
  const label = kind === "segment" ? `Segment ${id}` : id;

  return (
    <button
      type="button"
      className={classNames(styles.id, styles[kind])}
      title={`Show allocations for ${label}`}
      aria-label={`Show allocations for ${label}`}
      onClick={() => traceTo(selection)}
      onMouseEnter={() => setHighlight(selection)}
      onMouseLeave={() => setHighlight({})}
      onFocus={() => setHighlight(selection)}
      onBlur={() => setHighlight({})}
    >
      {kind === "segment" ? <SegmentTag segment={id as Segment} /> : id}
    </button>
  );
}

function findKind(id: string, clientIds: Set<string>, farmIds: Set<string>): IdKind | null {
  if (clientIds.has(id)) return "client";
  if (farmIds.has(id)) return "farm";
  if (SEGMENT_LETTERS.includes(id)) return "segment";
  return null;
}

function selectionFor(kind: IdKind, id: string): Selection {
  if (kind === "client") return { clientId: id };
  if (kind === "farm") return { farmId: id };
  return { segment: id as Segment };
}
