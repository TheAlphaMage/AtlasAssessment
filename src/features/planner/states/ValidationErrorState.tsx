/** Shown when the workbook breaks a rule. Lists every problem by sheet, with the exact place and how to fix it. */
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { ValidationIssue } from "@/lib/domain/types";
import styles from "./States.module.css";

interface ValidationErrorStateProps {
  issues: ValidationIssue[];
  workbookFile: string;
  onRetry: () => void;
}

/** Groups issues by sheet name, keeping the order the sheets first appear in. */
function groupBySheet(issues: ValidationIssue[]): Array<[string, ValidationIssue[]]> {
  const groups = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    const sheetIssues = groups.get(issue.sheet) ?? [];
    sheetIssues.push(issue);
    groups.set(issue.sheet, sheetIssues);
  }
  return [...groups.entries()];
}

export function ValidationErrorState({ issues, workbookFile, onRetry }: ValidationErrorStateProps) {
  const issueWord = issues.length === 1 ? "issue" : "issues";

  return (
    <div className={`${styles.panel} ${styles.error}`} role="alert">
      <h2 className={styles.heading}>
        <span className={styles.errorIcon}>
          <Icon name="cross" size={20} />
        </span>
        The workbook was rejected. No plan was produced.
      </h2>
      <p className={styles.lead}>
        <strong>{workbookFile}</strong> has {issues.length} validation {issueWord}. Invalid input is never repaired
        automatically, so no figures are shown until the data is corrected. Fix the cells below in the workbook, save it, then
        reload.
      </p>

      {groupBySheet(issues).map(([sheet, sheetIssues]) => (
        <section key={sheet} className={styles.sheetGroup}>
          <h3 className={styles.sheetName}>Sheet: {sheet}</h3>
          <ul className={styles.issueList}>
            {sheetIssues.map((issue, index) => (
              <li key={index} className={styles.issue}>
                <div className={styles.issueWhere}>
                  {issue.row !== null && <span>Row {issue.row}</span>}
                  {issue.entityId && <code>{issue.entityId}</code>}
                  {issue.field && <code>{issue.field}</code>}
                </div>
                <strong>{issue.problem}</strong>
                <span className={styles.fix}>How to fix: {issue.fix}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div>
        <Button variant="primary" icon="reload" onClick={onRetry}>
          Reload workbook
        </Button>
      </div>
    </div>
  );
}
