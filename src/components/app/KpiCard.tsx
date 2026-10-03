/** One headline figure: a short label, a big number, and one muted line of context. */
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: LucideIcon;
  /** "warning" turns the value amber (money lost to the local market). */
  tone?: "default" | "warning";
  /** Optional extra content under the detail line, e.g. a progress bar. */
  children?: ReactNode;
}

export function KpiCard({ label, value, detail, icon: IconComponent, tone = "default", children }: KpiCardProps) {
  return (
    <Card className="gap-0 px-4 py-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {IconComponent && <IconComponent className="size-3.5" aria-hidden="true" />}
        {label}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tracking-tight tabular-nums", tone === "warning" && "text-warning")}>
        {value}
      </div>
      {detail && <div className="mt-1 text-xs text-muted-foreground tabular-nums">{detail}</div>}
      {children && <div className="mt-3">{children}</div>}
    </Card>
  );
}
