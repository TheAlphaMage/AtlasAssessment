"use client";

/** ⌘K menu: jump to any page, open any client, farm or segment, or run an action (re-plan, theme). */
import { Moon, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useEntityDrawer } from "@/features/entities/useEntityDrawer";
import { usePlan } from "@/features/plan/PlanProvider";
import { useCommandMenu } from "./CommandMenuContext";
import { PALETTE_GROUPS, buildPaletteItems, type PaletteAction } from "./paletteItems";

export function CommandMenu() {
  const { isOpen, setIsOpen } = useCommandMenu();
  const { data, replan } = usePlan();
  const { openEntity } = useEntityDrawer();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();

  const items = data ? buildPaletteItems(data.result) : [];

  function run(action: PaletteAction) {
    setIsOpen(false);
    if (action.type === "navigate") router.push(action.href);
    else openEntity(action.id);
  }

  function runAndClose(task: () => void) {
    setIsOpen(false);
    task();
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen} title="Search" description="Jump to a page, client, farm or segment">
      <Command>
        <CommandInput placeholder="Search pages, clients, farms, segments…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {PALETTE_GROUPS.map((group) => (
            <CommandGroup key={group} heading={group}>
              {items
                .filter((item) => item.group === group)
                .map((item) => (
                  <CommandItem key={item.key} value={`${item.label} ${item.hint}`} onSelect={() => run(item.action)}>
                    <span className="font-medium">{item.label}</span>
                    <span className="truncate text-muted-foreground">{item.hint}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
          <CommandGroup heading="Actions">
            <CommandItem value="re-plan reload workbook" onSelect={() => runAndClose(replan)}>
              <RefreshCw />
              Reload workbook and re-plan
            </CommandItem>
            <CommandItem value="toggle theme dark light" onSelect={() => runAndClose(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
              <Moon />
              Toggle dark theme
              <CommandShortcut>theme</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
