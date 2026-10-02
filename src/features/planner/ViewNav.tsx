"use client";

/**
 * The five-step navigation. Follows the accessible "tabs" pattern:
 * arrow keys move between tabs, Home/End jump to the first/last.
 */
import { useRef, type KeyboardEvent } from "react";
import { classNames } from "@/components/ui/classNames";
import styles from "./ViewNav.module.css";
import { VIEWS, type ViewId } from "./views";

interface ViewNavProps {
  activeView: ViewId;
  onChange: (view: ViewId) => void;
  atRiskCount: number;
}

export function ViewNav({ activeView, onChange, atRiskCount }: ViewNavProps) {
  const tabRefs = useRef<Partial<Record<ViewId, HTMLButtonElement | null>>>({});

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = VIEWS.findIndex((view) => view.id === activeView);
    const targetIndex = targetIndexFor(event.key, currentIndex);
    if (targetIndex === null) return;

    event.preventDefault();
    const target = VIEWS[targetIndex];
    onChange(target.id);
    tabRefs.current[target.id]?.focus();
  }

  return (
    <nav className={styles.wrapper} data-print="hide">
      <div className={styles.tabs} role="tablist" aria-label="Planning views" onKeyDown={onKeyDown}>
        {VIEWS.map((view, index) => {
          const isActive = view.id === activeView;
          return (
            <button
              key={view.id}
              ref={(element) => {
                tabRefs.current[view.id] = element;
              }}
              type="button"
              role="tab"
              id={`tab-${view.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${view.id}`}
              tabIndex={isActive ? 0 : -1}
              className={classNames(styles.tab, isActive && styles.active)}
              onClick={() => onChange(view.id)}
            >
              <span className={styles.number}>{index + 1}</span>
              <span className={styles.labels}>
                <span className={styles.label}>{view.label}</span>
                <span className={styles.step}>{view.step}</span>
              </span>
              {view.id === "commercial" && atRiskCount > 0 && (
                <span className={styles.badge} aria-label={`${atRiskCount} clients at risk`}>
                  {atRiskCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Which tab a key should move to. Returns null for keys that do nothing. */
function targetIndexFor(key: string, currentIndex: number): number | null {
  const lastIndex = VIEWS.length - 1;
  if (key === "Home") return 0;
  if (key === "End") return lastIndex;
  if (key === "ArrowRight") return currentIndex === lastIndex ? 0 : currentIndex + 1;
  if (key === "ArrowLeft") return currentIndex === 0 ? lastIndex : currentIndex - 1;
  return null;
}
