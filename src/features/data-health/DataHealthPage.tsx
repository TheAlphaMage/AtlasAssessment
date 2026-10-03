"use client";

/** Data health: is the workbook valid, did every plan check pass, and what policy produced the plan. */
import { CircleCheck, CircleX, ShieldCheck, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReadyPlan } from "@/features/plan/PlanProvider";
import { PolicyCard } from "./PolicyCard";
import { WorkbookCard } from "./WorkbookCard";

export function DataHealthPage() {
  const { data, result } = useReadyPlan();
  const passed = result.invariants.filter((check) => check.passed).length;
  const allPassed = passed === result.invariants.length;

  return (
    <>
      <PageHeader title="Data health" info="The workbook is validated on the server and every plan is re-checked against hard limits." />
      <Alert variant={allPassed ? "success" : "destructive"} className="mb-4">
        {allPassed ? <ShieldCheck /> : <ShieldAlert />}
        <AlertTitle>{allPassed ? "Workbook valid · all plan checks passed" : "Some plan checks failed"}</AlertTitle>
        <AlertDescription>
          {passed}/{result.invariants.length} checks passed
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        <WorkbookCard data={data} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Plan checks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {result.invariants.map((check) => (
                <li key={check.name} className="flex items-start gap-3 py-2.5">
                  {check.passed ? <CircleCheck className="mt-0.5 size-4 text-success" /> : <CircleX className="mt-0.5 size-4 text-danger" />}
                  <div>
                    <p className="font-medium">{check.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <PolicyCard />
      </div>
    </>
  );
}
