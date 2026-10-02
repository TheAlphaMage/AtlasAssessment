"use client";

/**
 * Ctrl/Cmd+K quick jump. Uses the native <dialog> element, which gives us
 * focus trapping, the Escape key and a backdrop with no extra code.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { classNames } from "@/components/ui/classNames";
import type { PlanResult } from "@/lib/domain/types";
import styles from "./CommandPalette.module.css";
import { buildPaletteItems, filterPaletteItems, type PaletteAction, type PaletteItem } from "./paletteItems";

interface CommandPaletteProps {
  result: PlanResult;
  isOpen: boolean;
  onClose: () => void;
  onChoose: (action: PaletteAction) => void;
}

export function CommandPalette({ result, isOpen, onClose, onChoose }: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const allItems = useMemo(() => buildPaletteItems(result), [result]);
  const visibleItems = useMemo(() => filterPaletteItems(allItems, query), [allItems, query]);

  // Open or close the native dialog to match the `isOpen` prop. Start each opening with a clean search box.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      setQuery("");
      setActiveIndex(0);
      dialog.showModal();
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function choose(item: PaletteItem | undefined) {
    if (!item) return;
    onClose();
    onChoose(item.action);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, visibleItems.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      choose(visibleItems[activeIndex]);
    }
  }

  // A click on the dialog element itself (not its content) means the dark backdrop was clicked.
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} onClick={onDialogClick} aria-label="Quick search">
      <div className={styles.content}>
        <div className={styles.inputRow}>
          <Icon name="search" size={18} />
          <input
            className={styles.input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={visibleItems[activeIndex]?.id}
            placeholder="Jump to a client, farm, segment or view…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
          />
        </div>

        <ul id="palette-results" className={styles.results} role="listbox">
          {visibleItems.length === 0 && <li className={styles.empty}>Nothing matches “{query}”.</li>}
          {visibleItems.map((item, index) => (
            <li
              key={item.id}
              id={item.id}
              role="option"
              aria-selected={index === activeIndex}
              className={classNames(styles.item, index === activeIndex && styles.itemActive)}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => choose(item)}
            >
              <span className={styles.group}>{item.group}</span>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.hint}>{item.hint}</span>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
