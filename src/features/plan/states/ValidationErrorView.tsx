/** Shown when the workbook breaks a rule: every problem, grouped by sheet, with where it is and how to fix it. */
import { RefreshCw, OctagonX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeadCell } from "@/components/app/TableCells";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import type { ValidationIssue } from "@/lib/domain/types";

interface ValidationErrorViewProps {
  issues: ValidationIssue[];
  workbookFile: string;
  onRetry: () => void;
}

/** Groups issues by sheet name, keeping the order in which sheets first appear. */
function groupBySheet(issues: ValidationIssue[]): Array<[string, ValidationIssue[]]> {
  const groups = new Map<string, ValidationIssue[]>();
  for (const issue of issues) groups.set(issue.sheet, [...(groups.get(issue.sheet) ?? []), issue]);
  return [...groups.entries()];
}

export function ValidationErrorView({ issues, workbookFile, onRetry }: ValidationErrorViewProps) {
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <OctagonX />
        <AlertTitle>The workbook was rejected. No plan was produced.</AlertTitle>
        <AlertDescription>
          {workbookFile} has {issues.length} {issues.length === 1 ? "problem" : "problems"}. Invalid data is never repaired
          automatically. Fix the cells below, save the file, then reload.
        </AlertDescription>
      </Alert>

      {groupBySheet(issues).map(([sheet, sheetIssues]) => (
        <Card key={sheet} className="gap-0 py-0">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm">Sheet “{sheet}”</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <HeadCell>Row</HeadCell>
                  <HeadCell>ID</HeadCell>
                  <HeadCell>Field</HeadCell>
                  <HeadCell>Problem</HeadCell>
                  <HeadCell>How to fix</HeadCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheetIssues.map((issue, index) => (
                  <TableRow key={index}>
                    <TableCell className="pl-4 tabular-nums">{issue.row ?? "—"}</TableCell>
                    <TableCell className="font-medium">{issue.entityId ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{issue.field ?? "—"}</TableCell>
                    <TableCell className="whitespace-normal">{issue.problem}</TableCell>
                    <TableCell className="pr-4 whitespace-normal text-muted-foreground">{issue.fix}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <Button onClick={onRetry}>
        <RefreshCw /> Reload workbook
      </Button>
    </div>
  );
}
