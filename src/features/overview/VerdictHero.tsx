"use client";

/**
 * The first thing the committee sees: one sentence that states today's situation,
 * the export ring and the station gauge. Numbers count up on arrival.
 */
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import type { ViewId } from "@/features/planner/views";
import { fmtEur, fmtSignedT, fmtT } from "@/lib/format";
import type { Kpis, PlanResult } from "@/lib/domain/types";
import { ExportRing } from "./ExportRing";
import { StationGauge } from "./StationGauge";
import styles from "./VerdictHero.module.css";

interface VerdictHeroProps {
  result: PlanResult;
  onOpenView: (view: ViewId) => void;
}

export function VerdictHero({ result, onOpenView }: VerdictHeroProps) {
  const { kpis } = result;

  return (
    <section className={styles.hero} aria-label="Today's verdict">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Today&apos;s verdict</p>
        <p className={styles.headline}>
          <strong>
            <CountUp value={kpis.actualT} format={fmtT} />
          </strong>{" "}
          arrived against {fmtT(kpis.expectedT)} planned ({fmtSignedT(kpis.varianceT)}). <ExportClause kpis={kpis} />{" "}
          <LocalClause kpis={kpis} />
        </p>
        <div className={styles.actions}>
          <p className={styles.risk}>{riskSentence(kpis)}</p>
          {kpis.atRiskCount > 0 && (
            <Button icon="arrow-right" onClick={() => onOpenView("commercial")}>
              Review clients at risk
            </Button>
          )}
        </div>
      </div>

      <div className={styles.visual}>
        <ExportRing exportRate={kpis.exportRate} />
        <StationGauge kpis={kpis} />
      </div>
    </section>
  );
}

function ExportClause({ kpis }: { kpis: Kpis }): ReactNode {
  const exported = (
    <strong>
      <CountUp value={kpis.exportT} format={fmtT} />
    </strong>
  );
  if (kpis.stationFull) {
    return <>The plan exports {exported}, and the export station is full.</>;
  }
  return <>The plan exports {exported}.</>;
}

function LocalClause({ kpis }: { kpis: Kpis }): ReactNode {
  if (kpis.localT === 0) return <>Everything received is exported.</>;
  return (
    <>
      <mark className={styles.local}>{fmtT(kpis.localT)}</mark> fall back to the local market, worth only{" "}
      <mark className={styles.local}>{fmtEur(kpis.localValueEur)}</mark>.
    </>
  );
}

function riskSentence(kpis: Kpis): string {
  if (kpis.atRiskCount === 0) return `All ${kpis.clientCount} client orders are complete.`;
  const verb = kpis.atRiskCount === 1 ? "needs" : "need";
  return `${kpis.atRiskCount} of ${kpis.clientCount} client orders ${verb} a decision.`;
}
