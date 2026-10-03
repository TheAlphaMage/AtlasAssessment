"use client";

/** Left navigation: brand, the pages grouped by job, and the theme switch. Collapses to icons with ⌘B. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ROUTE_GROUPS, routesInGroup } from "@/features/navigation/routes";
import { usePlan } from "@/features/plan/PlanProvider";
import { NavBadge } from "./NavBadge";
import { ThemeToggle } from "./ThemeToggle";

export function AppSidebar() {
  const pathname = usePathname();
  const { data } = usePlan();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/overview">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Apple className="size-4" />
                </span>
                <span className="grid leading-tight">
                  <span className="font-semibold text-foreground">Atlas Fresh</span>
                  <span className="text-xs text-muted-foreground">Daily export planner</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {ROUTE_GROUPS.map((group) => (
          <SidebarGroup key={group} className="py-1">
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {routesInGroup(group).map((route) => (
                <SidebarMenuItem key={route.href}>
                  <SidebarMenuButton asChild isActive={pathname === route.href} tooltip={route.title}>
                    <Link href={route.href}>
                      <route.icon />
                      <span>{route.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  <NavBadge href={route.href} result={data?.result ?? null} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="group-data-[collapsible=icon]:hidden">Press 1–9 to switch pages</span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
