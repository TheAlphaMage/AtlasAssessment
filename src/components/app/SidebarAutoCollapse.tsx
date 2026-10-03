"use client";

/** On narrower laptop screens (under 1280 px) the sidebar starts collapsed to icons, leaving room for tables. */
import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

const COLLAPSE_BELOW_PX = 1280;

export function SidebarAutoCollapse() {
  const { setOpen } = useSidebar();

  useEffect(() => {
    if (window.innerWidth < COLLAPSE_BELOW_PX) setOpen(false);
  }, [setOpen]);

  return null;
}
