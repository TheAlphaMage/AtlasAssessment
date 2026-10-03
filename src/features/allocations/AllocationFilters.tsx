"use client";

/** Filter bar above the ledger: client, farm and segment pickers, a clear button, and the group-by switch. */
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SEGMENTS } from "@/lib/domain/constants";
import type { PlanResult } from "@/lib/domain/types";
import { isFiltered } from "./filterAllocations";
import type { GroupBy } from "./groupAllocations";
import { useAllocationFilter } from "./useAllocationFilter";

/** Radix Select cannot use an empty value, so "any" stands for "no filter". */
const ANY = "any";

interface AllocationFiltersProps {
  result: PlanResult;
  groupBy: GroupBy;
  onGroupBy: (value: GroupBy) => void;
}

export function AllocationFilters({ result, groupBy, onGroupBy }: AllocationFiltersProps) {
  const { filter, setClientId, setFarmId, setSegment } = useAllocationFilter();
  const farmIds = result.farms.map((farm) => farm.farmId).sort();

  function clearFilters() {
    setClientId(null);
    setFarmId(null);
    setSegment(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <FilterSelect label="Client" value={filter.clientId} onChange={setClientId} options={result.clients.map((client) => client.clientId)} hotkeyTarget />
      <FilterSelect label="Farm" value={filter.farmId} onChange={setFarmId} options={farmIds} />
      <FilterSelect label="Segment" value={filter.segment} onChange={setSegment} options={[...SEGMENTS]} />
      {isFiltered(filter) && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X /> Clear
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Group by</span>
        <ToggleGroup type="single" variant="outline" size="sm" value={groupBy} onValueChange={(value) => value && onGroupBy(value as GroupBy)} aria-label="Group rows by">
          <ToggleGroupItem value="none">None</ToggleGroupItem>
          <ToggleGroupItem value="client">Client</ToggleGroupItem>
          <ToggleGroupItem value="farm">Farm</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | null) => void;
  options: string[];
  /** The "/" shortcut focuses this picker. */
  hotkeyTarget?: boolean;
}

function FilterSelect({ label, value, onChange, options, hotkeyTarget = false }: FilterSelectProps) {
  return (
    <Select value={value ?? ANY} onValueChange={(next) => onChange(next === ANY ? null : next)}>
      <SelectTrigger size="sm" className="min-w-32" aria-label={`Filter by ${label.toLowerCase()}`} data-hotkey-focus={hotkeyTarget || undefined}>
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
