"use client";

/** Keyboard shortcuts: 1–9 open the pages in sidebar order, "/" focuses the page's filter, ⌘K opens search. */
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCommandMenu } from "@/features/command/CommandMenuContext";
import { usePlan } from "@/features/plan/PlanProvider";
import { useHotkeys, type HotkeyMap } from "@/hooks/useHotkeys";
import { ROUTES } from "./routes";

/** Single-key shortcuts stay off while a drawer or dialog is open. */
function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}

export function WorkspaceHotkeys() {
  const router = useRouter();
  const { setIsOpen } = useCommandMenu();
  const { data } = usePlan();

  const hotkeys = useMemo<HotkeyMap>(() => {
    const keys: HotkeyMap = {
      "mod+k": () => setIsOpen(true),
      "/": () => {
        if (!isDialogOpen()) document.querySelector<HTMLElement>("[data-hotkey-focus]")?.focus();
      },
    };
    ROUTES.forEach((route, index) => {
      keys[String(index + 1)] = () => {
        if (!isDialogOpen()) router.push(route.href);
      };
    });
    return keys;
  }, [router, setIsOpen]);

  useHotkeys(data ? hotkeys : {});
  return null;
}
