/** A raised surface that groups related content. Use `tone="local"` for the amber local-market areas. */
import type { ReactNode } from "react";
import { classNames } from "./classNames";
import styles from "./Card.module.css";

interface CardProps {
  tone?: "plain" | "local";
  label?: string;
  className?: string;
  children: ReactNode;
}

export function Card({ tone = "plain", label, className, children }: CardProps) {
  return (
    <section aria-label={label} className={classNames(styles.card, tone === "local" && styles.local, className)}>
      {children}
    </section>
  );
}
