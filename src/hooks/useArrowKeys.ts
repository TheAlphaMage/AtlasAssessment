"use client";

/** Keyboard ← / → support, used to step between entities in the detail drawer. */

import { useEffect } from "react";

/** Calls onPrevious / onNext when ← or → is pressed, unless the user is typing in a field. */
export function useArrowKeys(onPrevious: () => void, onNext: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "ArrowLeft") onPrevious();
      if (event.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onPrevious, onNext]);
}
