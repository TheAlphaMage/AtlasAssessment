/**
 * Decides the one warning banner shown on every page, from the computed plan. Pure, covered by tests.
 * No banner when every order is complete and nothing goes to the local market.
 */
import { fmtEur, fmtT } from "@/lib/format";
import type { PlanResult } from "@/lib/domain/types";

export interface BannerContent {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export function buildBanner(result: PlanResult): BannerContent | null {
  const { kpis } = result;
  const hasLocal = kpis.localT > 0;
  const hasRisk = kpis.atRiskCount > 0;
  if (!hasLocal && !hasRisk) return null;

  const facts: string[] = [];
  if (hasLocal) facts.push(`${fmtT(kpis.localT)} to local market (${fmtEur(kpis.localValueEur)})`);
  if (hasRisk) facts.push(`${kpis.atRiskCount} orders short`);

  return {
    title: kpis.stationFull ? "Station full" : "Orders need attention",
    description: facts.join(" · "),
    actionLabel: hasRisk ? "Review orders" : "View local market",
    actionHref: hasRisk ? "/clients?tab=at-risk" : "/local-market",
  };
}
