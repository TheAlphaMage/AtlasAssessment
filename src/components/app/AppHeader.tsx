"use client";

/** Top bar: sidebar toggle, breadcrumb, read-only notice, last update time, search and re-plan. */
import { usePathname } from "next/navigation";
import { Lock, RefreshCw, Search } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCommandMenu } from "@/features/command/CommandMenuContext";
import { findRoute } from "@/features/navigation/routes";
import { usePlan } from "@/features/plan/PlanProvider";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const route = findRoute(usePathname());
  const { data, phase, isRefreshing, replan } = usePlan();
  const { setIsOpen } = useCommandMenu();
  const isBusy = phase.kind === "loading";

  return (
    <header
      data-print="hide"
      className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/85 px-4 backdrop-blur"
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">{route?.group}</BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{route?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="hidden items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground lg:inline-flex">
              <Lock className="size-3" /> Decision support · read-only
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            Nothing here is executed, confirmed or sent to farms, clients or other systems. The Production and Commercial
            committee approves the plan.
          </TooltipContent>
        </Tooltip>
        {data && <span className="hidden text-xs text-muted-foreground xl:inline">Updated {timeOf(data.plannedAt)}</span>}
        <Button variant="outline" size="sm" className="w-44 justify-between text-muted-foreground" onClick={() => setIsOpen(true)}>
          <span className="inline-flex items-center gap-2">
            <Search /> Search
          </span>
          <Kbd>⌘K</Kbd>
        </Button>
        <Button size="sm" onClick={replan} disabled={isBusy}>
          <RefreshCw className={cn(isRefreshing && "animate-spin")} />
          Re-plan
        </Button>
      </div>
    </header>
  );
}

function timeOf(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
