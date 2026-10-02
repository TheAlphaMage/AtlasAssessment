"use client";

import { useCallback, useEffect, useState } from "react";
import { findViewByHash, type ViewId } from "./views";

/**
 * Keeps track of which view is open and mirrors it in the URL hash (#production),
 * so a view can be bookmarked or shared.
 */
export function useActiveView(): [ViewId, (view: ViewId) => void] {
  const [view, setViewState] = useState<ViewId>("overview");

  // On first load, open the view named in the URL hash, if any.
  useEffect(() => {
    const fromHash = findViewByHash(window.location.hash);
    if (fromHash) setViewState(fromHash);
  }, []);

  const setView = useCallback((next: ViewId) => {
    setViewState(next);
    window.history.replaceState(null, "", `#${next}`);
  }, []);

  return [view, setView];
}
