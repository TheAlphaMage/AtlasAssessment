"use client";

/** Search box, row filter and the "what do the cells show" switch above the farm table. */
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CellMode, FarmFilter } from "./farmRows";

interface FarmsToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  filter: FarmFilter;
  onFilter: (value: FarmFilter) => void;
  mode: CellMode;
  onMode: (value: CellMode) => void;
}

const FILTERS: Array<{ value: FarmFilter; label: string }> = [
  { value: "all", label: "All farms" },
  { value: "below", label: "Below plan" },
  { value: "local", label: "Has local" },
];

const MODES: Array<{ value: CellMode; label: string }> = [
  { value: "actual", label: "Actual" },
  { value: "plan", label: "Plan" },
  { value: "variance", label: "Variance" },
  { value: "mix", label: "Mix %" },
];

export function FarmsToolbar({ search, onSearch, filter, onFilter, mode, onMode }: FarmsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
      <InputGroup className="w-56">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput data-hotkey-focus placeholder="Search farms" value={search} onChange={(event) => onSearch(event.target.value)} aria-label="Search farms" />
      </InputGroup>

      <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={(value) => value && onFilter(value as FarmFilter)} aria-label="Filter farms">
        {FILTERS.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Cells show</span>
        <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={(value) => value && onMode(value as CellMode)} aria-label="What the segment cells show">
          {MODES.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
