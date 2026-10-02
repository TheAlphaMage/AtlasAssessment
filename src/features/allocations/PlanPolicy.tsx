"use client";

/** Collapsed explanation of how the plan is built, plus the server-side checks that passed or failed. */
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import type { Invariant } from "@/lib/domain/types";
import styles from "./PlanPolicy.module.css";

const POLICY_STEPS = [
  "Available supply = each farm's actual A/B/C/D tonnes. Planned tonnes are for comparison only.",
  "Client orders are processed by export price per tonne, highest first. Equal prices go by client ID.",
  "EXACT accepts only the requested segment. MINIMUM accepts the requested segment or better (A > B > C > D).",
  "Compatible supply is used closest quality first (smallest upgrade), then by farm ID.",
  "Allocation moves in 5 t steps until the order, the compatible supply or the station capacity is used up.",
  "Everything not exported goes local at the local-market ratio × the segment reference price.",
];

interface PlanPolicyProps {
  invariants: Invariant[];
}

export function PlanPolicy({ invariants }: PlanPolicyProps) {
  return (
    <Card label="How the plan is built">
      <details className={styles.details}>
        <summary>How the plan is built (deterministic policy) and plan checks</summary>
        <ol className={styles.steps}>
          {POLICY_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h3 className={styles.checksTitle}>Plan checks, recomputed on the server for every plan</h3>
        <ul className={styles.checks}>
          {invariants.map((check) => (
            <li key={check.name}>
              <Pill tone={check.passed ? "ok" : "risk"} icon={check.passed ? "check" : "cross"}>
                {check.passed ? "Pass" : "Fail"}
              </Pill>
              <span>
                {check.name} <span className={styles.detail}>({check.detail})</span>
              </span>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
