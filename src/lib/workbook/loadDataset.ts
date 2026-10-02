import type { Dataset, ValidationIssue } from "../domain/types";
import { validate } from "../validation/validate";
import { readWorkbook } from "./readWorkbook";

/** Read + validate. Returns a Dataset only when there are no issues at all. */
export async function loadDataset(file: string): Promise<{ dataset: Dataset | null; issues: ValidationIssue[] }> {
  const { raw, issues } = await readWorkbook(file);
  if (issues.length > 0) return { dataset: null, issues };
  return validate(raw);
}
