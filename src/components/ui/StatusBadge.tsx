/** Client order status as a coloured pill with an icon, so meaning never depends on colour alone. */
import type { ClientStatus } from "@/lib/domain/types";
import type { IconName } from "./Icon";
import { Pill } from "./Pill";

const STATUS_STYLE: Record<ClientStatus, { tone: "ok" | "risk" | "local"; icon: IconName; label: string }> = {
  COMPLETE: { tone: "ok", icon: "check", label: "Complete" },
  PARTIAL: { tone: "local", icon: "half", label: "Partial" },
  UNSERVED: { tone: "risk", icon: "cross", label: "Unserved" },
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  const { tone, icon, label } = STATUS_STYLE[status];
  return (
    <Pill tone={tone} icon={icon}>
      {label}
    </Pill>
  );
}
