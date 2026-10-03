/** Facts about the loaded workbook: file name, station, counts and when it was loaded and planned. */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanResponse } from "@/lib/domain/types";

function timeOf(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function WorkbookCard({ data }: { data: PlanResponse }) {
  const facts: Array<[string, string]> = [
    ["File", data.summary.workbookFile],
    ["Station", data.summary.stationId],
    ["Farms", String(data.summary.farmCount)],
    ["Clients", String(data.summary.clientCount)],
    ["Loaded", timeOf(data.loadedAt)],
    ["Planned", timeOf(data.plannedAt)],
  ];

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Workbook</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2.5">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="truncate text-right font-medium" title={value}>{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
