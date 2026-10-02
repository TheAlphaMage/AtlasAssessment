"use client";

/** Sticky filter bar: pick a client, farm or segment. Active filters show as chips that can be removed one by one. */
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SEGMENTS } from "@/lib/domain/constants";
import type { PlanResult, Segment } from "@/lib/domain/types";
import type { Selection } from "@/features/trace";
import styles from "./AllocationFilters.module.css";
import { isFiltered } from "./filterAllocations";

interface AllocationFiltersProps {
  result: PlanResult;
  filter: Selection;
  onChange: (filter: Selection) => void;
  visibleCount: number;
}

export function AllocationFilters({ result, filter, onChange, visibleCount }: AllocationFiltersProps) {
  const sortedFarmIds = result.farms.map((farm) => farm.farmId).sort();

  return (
    <div className={styles.bar} role="search" aria-label="Filter allocations">
      <label className={styles.field}>
        Client
        <select
          data-hotkey-focus
          value={filter.clientId ?? ""}
          onChange={(event) => onChange({ ...filter, clientId: event.target.value || undefined })}
        >
          <option value="">All clients</option>
          {result.clients.map((client) => (
            <option key={client.clientId} value={client.clientId}>
              {client.clientId} · {client.acceptanceMode} {client.requestedSegment} · {client.status.toLowerCase()}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        Farm
        <select value={filter.farmId ?? ""} onChange={(event) => onChange({ ...filter, farmId: event.target.value || undefined })}>
          <option value="">All farms</option>
          {sortedFarmIds.map((farmId) => (
            <option key={farmId} value={farmId}>
              {farmId}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        Segment
        <select
          value={filter.segment ?? ""}
          onChange={(event) => onChange({ ...filter, segment: (event.target.value || undefined) as Segment | undefined })}
        >
          <option value="">All segments</option>
          {SEGMENTS.map((segment) => (
            <option key={segment} value={segment}>
              {segment}
            </option>
          ))}
        </select>
      </label>

      {isFiltered(filter) && (
        <div className={styles.chips}>
          {filter.clientId && <FilterChip label={`Client ${filter.clientId}`} onRemove={() => onChange({ ...filter, clientId: undefined })} />}
          {filter.farmId && <FilterChip label={`Farm ${filter.farmId}`} onRemove={() => onChange({ ...filter, farmId: undefined })} />}
          {filter.segment && <FilterChip label={`Segment ${filter.segment}`} onRemove={() => onChange({ ...filter, segment: undefined })} />}
          <Button variant="ghost" onClick={() => onChange({})}>
            Clear all
          </Button>
        </div>
      )}

      <span className={styles.count} aria-live="polite">
        Showing {visibleCount} of {result.allocations.length} allocation rows
      </span>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className={styles.chip}>
      {label}
      <button type="button" className={styles.remove} onClick={onRemove} aria-label={`Remove filter ${label}`}>
        <Icon name="cross" size={12} />
      </button>
    </span>
  );
}
