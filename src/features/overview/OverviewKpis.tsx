"use client";

/** The five headline figures the committee needs first: supply, station, export rate, local market, value. */
import { Banknote, PackageOpen, Ship, Store, Warehouse } from "lucide-react";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { Delta } from "@/components/app/Delta";
import { KpiCard } from "@/components/app/KpiCard";
import { Progress } from "@/components/ui/progress";
import { fmtEur, fmtPct, fmtT } from "@/lib/format";
import type { Kpis } from "@/lib/domain/types";

export function OverviewKpis({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <KpiCard
        label="Received"
        icon={PackageOpen}
        value={<AnimatedNumber value={kpis.actualT} format={fmtT} />}
        detail={
          <span className="inline-flex items-center gap-1.5">
            <Delta value={kpis.varianceT} /> vs plan
          </span>
        }
      />
      <KpiCard
        label="Station"
        icon={Warehouse}
        value={`${fmtT(kpis.exportT)}`}
        detail={`${fmtPct(kpis.stationUtilization, 0)} of ${fmtT(kpis.stationCapacityT)}`}
      >
        <Progress value={Math.min(100, kpis.stationUtilization * 100)} className="h-1.5" aria-label="Station capacity used" />
      </KpiCard>
      <KpiCard
        label="Export rate"
        icon={Ship}
        value={fmtPct(kpis.exportRate)}
        detail={`${fmtT(kpis.exportT)} of ${fmtT(kpis.actualT)}`}
      />
      <KpiCard
        label="Local market"
        icon={Store}
        tone={kpis.localT > 0 ? "warning" : "default"}
        value={<AnimatedNumber value={kpis.localT} format={fmtT} />}
        detail={`worth ${fmtEur(kpis.localValueEur)}`}
      />
      <KpiCard
        label="Plan value"
        icon={Banknote}
        value={<AnimatedNumber value={kpis.totalValueEur} format={fmtEur} />}
        detail={`export ${fmtEur(kpis.exportRevenueEur)}`}
      />
    </div>
  );
}
