/** Shown when the server fails or cannot be reached. No stale figures are displayed. */
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import styles from "./States.module.css";

interface ServerErrorStateProps {
  message: string;
  during: "load" | "plan";
  onRetry: () => void;
}

export function ServerErrorState({ message, during, onRetry }: ServerErrorStateProps) {
  const heading = during === "load" ? "The workbook could not be loaded" : "The plan could not be computed";

  return (
    <div className={`${styles.panel} ${styles.error}`} role="alert">
      <h2 className={styles.heading}>
        <span className={styles.errorIcon}>
          <Icon name="alert" size={20} />
        </span>
        {heading}
      </h2>
      <p className={styles.lead}>{message}</p>
      <p className={styles.muted}>
        No figures are shown because they could be out of date. Retry. If the problem continues, check the server log.
      </p>
      <div>
        <Button variant="primary" icon="reload" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}
