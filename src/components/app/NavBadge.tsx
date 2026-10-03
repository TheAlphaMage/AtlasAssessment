/** The small figure next to a sidebar item: clients at risk, tonnes going local, or data-health state. */
import { SidebarMenuBadge } from "@/components/ui/sidebar";
import { fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";

interface NavBadgeProps {
  href: string;
  result: PlanResult | null;
}

export function NavBadge({ href, result }: NavBadgeProps) {
  if (!result) return null;
  const { kpis } = result;

  if (href === "/clients" && kpis.atRiskCount > 0) {
    return <SidebarMenuBadge className="bg-danger-soft text-danger">{kpis.atRiskCount}</SidebarMenuBadge>;
  }
  if (href === "/local-market" && kpis.localT > 0) {
    return <SidebarMenuBadge className="bg-warning-soft text-warning">{fmtT(kpis.localT)}</SidebarMenuBadge>;
  }
  if (href === "/data-health") {
    const allPassed = result.invariants.every((check) => check.passed);
    return (
      <SidebarMenuBadge aria-label={allPassed ? "All checks passed" : "Some checks failed"}>
        <span className={allPassed ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-danger"} />
      </SidebarMenuBadge>
    );
  }
  return null;
}
