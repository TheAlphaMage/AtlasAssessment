"use client";

/** Brand, data-health chip and the global tools (search, theme, reload). */
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { HealthChip } from "./HealthChip";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./TopBar.module.css";
import type { Phase } from "./usePlanner";

interface TopBarProps {
  phase: Phase;
  onReload: () => void;
  onOpenPalette: () => void;
}

export function TopBar({ phase, onReload, onOpenPalette }: TopBarProps) {
  const isLoading = phase.kind === "loading";

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <span className={styles.logo}>
          <Icon name="leaf" size={20} />
        </span>
        <div>
          <p className={styles.name}>Atlas Fresh</p>
          <h1 className={styles.title}>Daily Export Planner</h1>
        </div>
      </div>

      <div className={styles.tools} data-print="hide">
        <HealthChip phase={phase} />
        <button type="button" className={styles.search} onClick={onOpenPalette} aria-label="Search clients, farms and views">
          <Icon name="search" size={15} />
          <span>Search</span>
          <kbd className={styles.shortcut}>Ctrl K</kbd>
        </button>
        <ThemeToggle />
        <Button variant="primary" icon="reload" onClick={onReload} disabled={isLoading}>
          Reload &amp; re-plan
        </Button>
      </div>
    </header>
  );
}
