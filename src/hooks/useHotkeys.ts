"use client";

import { useEffect } from "react";

/** Maps a key to what it does. Use "mod+k" for Ctrl+K (Windows/Linux) or Cmd+K (Mac). */
export type HotkeyMap = Record<string, () => void>;

/** True while the user is typing in a form field, where single-key shortcuts must stay off. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Turns a keyboard event into the key name used in HotkeyMap. */
function keyNameOf(event: KeyboardEvent): string {
  const isModifierHeld = event.ctrlKey || event.metaKey;
  return isModifierHeld ? `mod+${event.key.toLowerCase()}` : event.key;
}

export function useHotkeys(hotkeys: HotkeyMap) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const keyName = keyNameOf(event);
      const action = hotkeys[keyName];
      if (!action) return;

      const isModifierShortcut = keyName.startsWith("mod+");
      if (!isModifierShortcut && isTypingTarget(event.target)) return;

      event.preventDefault();
      action();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeys]);
}
