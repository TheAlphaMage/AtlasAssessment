/** Header and number cells with the app's table style: small muted headers, right-aligned tabular numbers. */
import type { ComponentProps } from "react";
import { TableCell, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface HeadCellProps extends ComponentProps<typeof TableHead> {
  numeric?: boolean;
}

export function HeadCell({ numeric = false, className, ...props }: HeadCellProps) {
  return (
    <TableHead
      className={cn("h-9 text-xs font-medium text-muted-foreground first:pl-4 last:pr-4", numeric && "text-right", className)}
      {...props}
    />
  );
}

export function NumberCell({ className, ...props }: ComponentProps<typeof TableCell>) {
  return <TableCell className={cn("text-right tabular-nums first:pl-4 last:pr-4", className)} {...props} />;
}

export function TextCell({ className, ...props }: ComponentProps<typeof TableCell>) {
  return <TableCell className={cn("first:pl-4 last:pr-4", className)} {...props} />;
}
