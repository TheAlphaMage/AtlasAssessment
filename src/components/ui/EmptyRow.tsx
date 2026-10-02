/** A table row that explains why a table has no data. */
import type { ReactNode } from "react";

interface EmptyRowProps {
  columnCount: number;
  children: ReactNode;
}

export function EmptyRow({ columnCount, children }: EmptyRowProps) {
  return (
    <tr>
      <td colSpan={columnCount} style={{ textAlign: "center", padding: "var(--space-5)", color: "var(--color-ink-faint)" }}>
        {children}
      </td>
    </tr>
  );
}
