/** Title row at the top of a card: heading, one short hint line, optional action on the right. */
import type { ReactNode } from "react";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({ title, hint, action }: SectionHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h2 className={styles.title}>{title}</h2>
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>
      {action && <div data-print="hide">{action}</div>}
    </header>
  );
}
