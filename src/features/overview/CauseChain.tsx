"use client";

/** Draws a decision's chain of causes as small linked steps: farms -> segment -> client. */
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Variance } from "@/components/ui/Variance";
import { IdLink } from "@/features/trace";
import { fmtT } from "@/lib/format";
import styles from "./CauseChain.module.css";
import type { ChainStep } from "./buildDecisions";

interface CauseChainProps {
  steps: ChainStep[];
}

export function CauseChain({ steps }: CauseChainProps) {
  return (
    <ol className={styles.chain} aria-label="Cause chain">
      {steps.map((step, index) => (
        <li key={index} className={styles.link}>
          {index > 0 && <Icon name="arrow-right" size={14} className={styles.arrow} />}
          <div className={styles.step}>{renderStep(step)}</div>
        </li>
      ))}
    </ol>
  );
}

function renderStep(step: ChainStep): ReactNode {
  if (step.kind === "farms") {
    return (
      <>
        <span className={styles.caption}>Farms below plan</span>
        <span className={styles.row}>
          {step.gaps.map((gap) => (
            <span key={gap.farmId} className={styles.row}>
              <IdLink id={gap.farmId} /> <Variance value={gap.varianceT} />
            </span>
          ))}
        </span>
      </>
    );
  }
  if (step.kind === "segment") {
    return (
      <>
        <span className={styles.caption}>Segment gap</span>
        <span className={styles.row}>
          <IdLink id={step.segment} /> <Variance value={step.varianceT} />
        </span>
      </>
    );
  }
  if (step.kind === "station") {
    return (
      <>
        <span className={styles.caption}>Station limit</span>
        <strong>
          {fmtT(step.usedT)} of {fmtT(step.capacityT)} used
        </strong>
      </>
    );
  }
  if (step.kind === "local") {
    return (
      <>
        <span className={styles.caption}>Fruit left over</span>
        <strong className={styles.local}>{fmtT(step.tonnes)} goes local</strong>
      </>
    );
  }
  return (
    <>
      <span className={styles.caption}>Client short</span>
      <span className={styles.row}>
        <IdLink id={step.clientId} /> <strong className={styles.risk}>{fmtT(step.shortT)} short</strong>
      </span>
    </>
  );
}
