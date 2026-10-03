/** Client order status as a soft badge with a dot. */
import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ClientStatus, { variant: "success" | "warning" | "danger"; label: string; dot: string }> = {
  COMPLETE: { variant: "success", label: "Complete", dot: "bg-success" },
  PARTIAL: { variant: "warning", label: "Partial", dot: "bg-warning" },
  UNSERVED: { variant: "danger", label: "Unserved", dot: "bg-danger" },
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  const { variant, label, dot } = STATUS_STYLE[status];
  return (
    <Badge variant={variant} className="gap-1.5 rounded-md">
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      {label}
    </Badge>
  );
}
