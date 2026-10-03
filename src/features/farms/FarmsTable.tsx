"use client";

/** The farm table: one row per farm, sortable columns, and a totals row. Clicking a row opens the farm drawer. */
import type { ReactNode } from "react";
import { Delta } from "@/components/app/Delta";
import { SegmentDot } from "@/components/app/SegmentDot";
import { SortableHead } from "@/components/app/SortableHead";
import { NumberCell, TextCell } from "@/components/app/TableCells";
import { Table, TableBody, TableFooter, TableHeader, TableRow } from "@/components/ui/table";
import { EntityLink } from "@/features/entities/EntityLink";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";
import { SEGMENTS } from "@/lib/domain/constants";
import { fmtNumber } from "@/lib/format";
import type { FarmResult, PlanResult, Segment } from "@/lib/domain/types";
import type { SortState } from "@/hooks/useSort";
import { FarmSegmentCell } from "./FarmSegmentCell";
import type { CellMode, FarmSortKey } from "./farmRows";

interface FarmsTableProps {
  farms: FarmResult[];
  result: PlanResult;
  mode: CellMode;
  sort: SortState<FarmSortKey>;
  onSort: (key: FarmSortKey, firstDirection?: "asc" | "desc") => void;
}

const NUMBER_COLUMNS: Array<{ key: FarmSortKey; label: string }> = [
  { key: "total", label: "Total" },
  { key: "variance", label: "Variance" },
  { key: "exported", label: "Exported" },
  { key: "local", label: "Local" },
];

export function FarmsTable({ farms, result, mode, sort, onSort }: FarmsTableProps) {
  const { openEntity } = useEntityDrawer();
  const affectedBySegment = new Map<Segment, string[]>(result.gapImpacts.map((gap) => [gap.segment, gap.affectedClientIds]));
  const head = (key: FarmSortKey, label: ReactNode, numeric = true) => (
    <SortableHead key={key} label={label} numeric={numeric} isActive={sort.key === key} direction={sort.direction} onClick={() => onSort(key, key === "farm" ? "asc" : "desc")} />
  );

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {head("farm", "Farm", false)}
          {head("capacity", "Capacity")}
          {SEGMENTS.map((segment) => head(segment, <SegmentDot segment={segment} />))}
          {NUMBER_COLUMNS.map((column) => head(column.key, column.label))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {farms.length === 0 && (
          <TableRow>
            <TextCell colSpan={10} className="py-10 text-center text-muted-foreground">No farm matches these filters.</TextCell>
          </TableRow>
        )}
        {farms.map((farm) => (
          <TableRow key={farm.farmId} className="cursor-pointer" onClick={() => openEntity(farm.farmId)}>
            <TextCell>
              <EntityLink id={farm.farmId} /> <span className="text-muted-foreground">{farm.farmName}</span>
            </TextCell>
            <NumberCell className="text-muted-foreground">{fmtNumber(farm.expectedCapacityT)}</NumberCell>
            {SEGMENTS.map((segment) => (
              <FarmSegmentCell key={segment} farm={farm} segment={segment} mode={mode} affectedClientIds={affectedBySegment.get(segment) ?? []} />
            ))}
            <NumberCell className="font-medium">{fmtNumber(farm.actualTotalT)}</NumberCell>
            <NumberCell><Delta value={farm.varianceTotalT} unit="" /></NumberCell>
            <NumberCell>{fmtNumber(farm.exportedT)}</NumberCell>
            <NumberCell className={farm.localT > 0 ? "font-medium text-warning" : "text-muted-foreground"}>
              {farm.localT > 0 ? fmtNumber(farm.localT) : "—"}
            </NumberCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TextCell>All farms (t)</TextCell>
          <NumberCell />
          {result.segments.map((segment) => (
            <NumberCell key={segment.segment}>{fmtNumber(segment.actualT)}</NumberCell>
          ))}
          <NumberCell>{fmtNumber(result.kpis.actualT)}</NumberCell>
          <NumberCell><Delta value={result.kpis.varianceT} unit="" /></NumberCell>
          <NumberCell>{fmtNumber(result.kpis.exportT)}</NumberCell>
          <NumberCell className="text-warning">{fmtNumber(result.kpis.localT)}</NumberCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
