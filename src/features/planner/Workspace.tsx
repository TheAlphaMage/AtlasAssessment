"use client";

/**
 * The whole planning workspace: top bar, navigation and the five views.
 * This file only connects the pieces; each piece lives in its own file.
 */
import { useCallback, useMemo, useState } from "react";
import { TraceProvider, type Selection } from "@/features/trace";
import { useHotkeys, type HotkeyMap } from "@/hooks/useHotkeys";
import { CommandPalette } from "./CommandPalette";
import { DecisionSupportNote } from "./DecisionSupportNote";
import { PlannerStatus } from "./PlannerStatus";
import { TopBar } from "./TopBar";
import { ViewNav } from "./ViewNav";
import { ViewPanel } from "./ViewPanel";
import type { PaletteAction } from "./paletteItems";
import { useActiveView } from "./useActiveView";
import { usePlanner } from "./usePlanner";
import { VIEWS } from "./views";
import styles from "./Workspace.module.css";

export function Workspace() {
  const { phase, reload } = usePlanner();
  const [activeView, setActiveView] = useActiveView();
  const [allocationFilter, setAllocationFilter] = useState<Selection>({});
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const result = phase.kind === "ready" ? phase.data.result : null;

  /** Open Allocations filtered to one farm, client or segment. */
  const traceTo = useCallback(
    (selection: Selection) => {
      setAllocationFilter(selection);
      setActiveView("allocations");
      window.scrollTo({ top: 0 });
    },
    [setActiveView],
  );

  function onPaletteChoose(action: PaletteAction) {
    if (action.type === "view") setActiveView(action.view);
    else traceTo(action.selection);
  }

  // Keyboard shortcuts: 1-5 open a view, "/" focuses the search/filter field, Ctrl/Cmd+K opens quick jump.
  const hotkeys = useMemo<HotkeyMap>(() => {
    const keys: HotkeyMap = {
      "/": () => document.querySelector<HTMLElement>("[data-hotkey-focus]")?.focus(),
      "mod+k": () => setIsPaletteOpen(true),
    };
    VIEWS.forEach((view, index) => {
      keys[String(index + 1)] = () => setActiveView(view.id);
    });
    return keys;
  }, [setActiveView]);
  useHotkeys(result ? hotkeys : {});

  return (
    <TraceProvider result={result} onTrace={traceTo}>
      <div className={styles.app}>
        <TopBar phase={phase} onReload={reload} onOpenPalette={() => setIsPaletteOpen(true)} />

        <main className={styles.page}>
          <DecisionSupportNote />
          <PlannerStatus phase={phase} onRetry={reload} />

          {result && (
            <>
              <ViewNav activeView={activeView} onChange={setActiveView} atRiskCount={result.kpis.atRiskCount} />
              <ViewPanel
                view={activeView}
                result={result}
                allocationFilter={allocationFilter}
                onAllocationFilterChange={setAllocationFilter}
                onOpenView={setActiveView}
              />
            </>
          )}
        </main>

        {result && (
          <CommandPalette
            result={result}
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
            onChoose={onPaletteChoose}
          />
        )}
      </div>
    </TraceProvider>
  );
}
