"use client";

import type { ValidationIssue } from "@/lib/domain/types";

export function LoadingState({ step }: { step: "load" | "plan" }) {
  return (
    <div className="card state" aria-busy="true">
      <h2>{step === "load" ? "Loading and validating the workbook…" : "Computing the deterministic export plan…"}</h2>
      <p className="muted">
        {step === "load"
          ? "Reading farms, clients and station data on the server and checking every field."
          : "Allocating actual farm supply to client orders by price, quality fit and station capacity."}
      </p>
      <div className="skeleton" style={{ width: "70%" }} />
      <div className="skeleton" style={{ width: "90%" }} />
      <div className="skeleton" style={{ width: "55%" }} />
    </div>
  );
}

export function ValidationErrorState({
  issues,
  workbookFile,
  onRetry,
}: {
  issues: ValidationIssue[];
  workbookFile: string;
  onRetry: () => void;
}) {
  return (
    <div className="card state error" role="alert">
      <h2>
        <span aria-hidden="true">✕</span> The workbook was rejected — no plan was produced
      </h2>
      <p>
        <strong>{workbookFile}</strong> has {issues.length} validation issue{issues.length === 1 ? "" : "s"}. Invalid input is
        never repaired automatically, so the planner shows no figures until the data is corrected. Fix the cells below in the
        workbook, save it, then reload.
      </p>
      <div className="table-wrap">
        <table>
          <caption>Validation issues (sheet → row → ID → field)</caption>
          <thead>
            <tr>
              <th scope="col">Sheet</th>
              <th scope="col" className="num">Row</th>
              <th scope="col">ID</th>
              <th scope="col">Field</th>
              <th scope="col">Problem</th>
              <th scope="col">How to fix</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, i) => (
              <tr key={i}>
                <td>{issue.sheet}</td>
                <td className="num">{issue.row ?? "—"}</td>
                <td>{issue.entityId ? <code>{issue.entityId}</code> : "—"}</td>
                <td>{issue.field ? <code>{issue.field}</code> : "—"}</td>
                <td>{issue.problem}</td>
                <td>{issue.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <button type="button" className="btn primary" onClick={onRetry}>
          ↻ Reload workbook
        </button>
      </div>
    </div>
  );
}

export function ServerErrorState({ message, during, onRetry }: { message: string; during: "load" | "plan"; onRetry: () => void }) {
  return (
    <div className="card state error" role="alert">
      <h2>
        <span aria-hidden="true">✕</span> {during === "load" ? "The workbook could not be loaded" : "The plan could not be computed"}
      </h2>
      <p>{message}</p>
      <p className="muted">
        No figures are shown because they could be out of date. Retry; if the problem persists, check the server log.
      </p>
      <div>
        <button type="button" className="btn primary" onClick={onRetry}>
          ↻ Retry
        </button>
      </div>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="muted" style={{ textAlign: "center", padding: 16 }}>
        {children}
      </td>
    </tr>
  );
}
