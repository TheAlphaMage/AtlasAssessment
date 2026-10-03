"use client";

/** Lets any button (like the search box in the header) open the ⌘K command menu. */
import { createContext, useContext, useState, type ReactNode } from "react";

interface CommandMenuState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CommandMenuContext = createContext<CommandMenuState>({ isOpen: false, setIsOpen: () => {} });

export function CommandMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return <CommandMenuContext.Provider value={{ isOpen, setIsOpen }}>{children}</CommandMenuContext.Provider>;
}

export function useCommandMenu(): CommandMenuState {
  return useContext(CommandMenuContext);
}
